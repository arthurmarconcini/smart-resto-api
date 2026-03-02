import * as XLSX from "xlsx";
import * as salesRepository from "./sales.repository.js";
import * as revenueService from "../revenue/revenue.service.js";
import type { CreateSaleInput, AnotaAiRow } from "./sales.schemas.js";
import { anotaAiRowSchema, ANOTA_AI_COLUMNS, IGNORED_STATUSES } from "./sales.schemas.js";

function mapSaleToDto(sale: any) {
  return {
    ...sale,
    totalAmount: Number(sale.totalAmount),
    freightValue: sale.freightValue ? Number(sale.freightValue) : null,
    subtotal: sale.subtotal ? Number(sale.subtotal) : null,
    discount: sale.discount ? Number(sale.discount) : null,
    items: sale.items?.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subTotal: Number(item.subTotal),
    })),
  };
}

export async function createSale(data: CreateSaleInput, companyId: string) {
  let sale;
  if (data.type === "ITEMIZED") {
    sale = await salesRepository.createItemizedSale(data, companyId);
  } else {
    sale = await salesRepository.createDailyTotalSale(data, companyId);
  }

  // Atualizar MonthlyRevenue do mês correspondente
  const saleDate = new Date(data.date);
  await revenueService.recalculateMonthRevenue(
    companyId,
    saleDate.getMonth() + 1,
    saleDate.getFullYear()
  );

  return mapSaleToDto(sale);
}

export async function getSales(companyId: string, month?: number, year?: number) {
  const sales = await salesRepository.findAll(companyId, month, year);
  return sales.map(mapSaleToDto);
}

// ===== Processamento de Upload Anota Aí =====

interface UploadError {
  row: number;
  orderNumber?: string;
  error: string;
}

interface UploadResult {
  totalProcessed: number;
  created: number;
  skipped: number;
  duplicates: number;
  errors: UploadError[];
}

function parseMonetaryValue(value: any): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;

  // Tratar formatos brasileiros: "1.234,56" → 1234.56
  const str = String(value).trim();
  // Remove "R$" prefix if present
  const cleaned = str.replace(/R\$\s*/g, "").trim();

  // Se contém vírgula como separador decimal (formato BR)
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }

  return parseFloat(cleaned) || 0;
}

function parseDateBR(dateStr: string): Date {
  // DD/MM/AAAA → Date
  const [day, month, year] = dateStr.split("/").map(Number) as [number, number, number];
  return new Date(year, month - 1, day, 12, 0, 0); // Meio-dia para evitar problemas de timezone
}

function parseXlsxToRows(buffer: Buffer): Record<string, any>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("O arquivo XLSX não contém nenhuma planilha");
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Planilha não encontrada no arquivo XLSX");
  }

  // Converter para JSON com headers da primeira linha
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
  });

  return rawRows;
}

function mapRawRowToAnotaAiRow(raw: Record<string, any>): Record<string, any> {
  return {
    orderNumber: String(raw[ANOTA_AI_COLUMNS[0]] ?? "").trim(),
    origin: String(raw[ANOTA_AI_COLUMNS[1]] ?? "").trim(),
    paymentMethod: String(raw[ANOTA_AI_COLUMNS[2]] ?? "").trim(),
    cardBrand: String(raw[ANOTA_AI_COLUMNS[3]] ?? "").trim() || undefined,
    deliveryType: String(raw[ANOTA_AI_COLUMNS[4]] ?? "").trim(),
    discount: parseMonetaryValue(raw[ANOTA_AI_COLUMNS[5]]),
    freightValue: parseMonetaryValue(raw[ANOTA_AI_COLUMNS[6]]),
    subtotal: parseMonetaryValue(raw[ANOTA_AI_COLUMNS[7]]),
    totalAmount: parseMonetaryValue(raw[ANOTA_AI_COLUMNS[8]]),
    date: String(raw[ANOTA_AI_COLUMNS[9]] ?? "").trim(),
    deliveryPerson: String(raw[ANOTA_AI_COLUMNS[10]] ?? "").trim() || undefined,
    status: String(raw[ANOTA_AI_COLUMNS[11]] ?? "").trim(),
  };
}

export async function processAnotaAiUpload(
  fileBuffer: Buffer,
  companyId: string,
): Promise<UploadResult> {
  const result: UploadResult = {
    totalProcessed: 0,
    created: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  };

  // 1. Parsear XLSX
  const rawRows = parseXlsxToRows(fileBuffer);
  result.totalProcessed = rawRows.length;

  // Rastrear meses afetados para recalcular MonthlyRevenue no final
  const affectedMonths = new Set<string>();

  // 2. Processar cada linha
  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // +2 porque linha 1 é header e índice começa em 0

    try {
      const rawRow = rawRows[i];
      if (!rawRow) continue;

      // Mapear colunas do XLSX para campos internos
      const mapped = mapRawRowToAnotaAiRow(rawRow);

      // Filtrar status ignorados ANTES de validar
      if (IGNORED_STATUSES.includes(mapped.status as any)) {
        result.skipped++;
        continue;
      }

      // Validar com Zod
      const parsed = anotaAiRowSchema.parse(mapped);

      // Verificar duplicidade
      const existing = await salesRepository.findByOrderNumber(
        parsed.orderNumber,
        companyId,
      );

      if (existing) {
        result.duplicates++;
        result.errors.push({
          row: rowNumber,
          orderNumber: parsed.orderNumber,
          error: `Pedido #${parsed.orderNumber} já foi importado anteriormente`,
        });
        continue;
      }

      // Converter data BR para Date
      const saleDate = parseDateBR(parsed.date);

      // Criar venda
      await salesRepository.createAnotaAiSale(
        {
          orderNumber: parsed.orderNumber,
          origin: parsed.origin,
          paymentMethod: parsed.paymentMethod,
          ...(parsed.cardBrand && { cardBrand: parsed.cardBrand }),
          deliveryType: parsed.deliveryType,
          discount: parsed.discount,
          freightValue: parsed.freightValue,
          subtotal: parsed.subtotal,
          totalAmount: parsed.totalAmount,
          date: saleDate,
        },
        companyId,
      );

      // Registrar mês afetado
      affectedMonths.add(`${saleDate.getMonth() + 1}-${saleDate.getFullYear()}`);
      result.created++;
    } catch (err: any) {
      // Capturar erros de validação Zod ou outros
      const errorMessage =
        err?.issues
          ? err.issues.map((issue: any) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
          : err?.message || "Erro desconhecido";

      result.errors.push({
        row: rowNumber,
        error: errorMessage,
      });
    }
  }

  // 3. Recalcular MonthlyRevenue para cada mês afetado
  for (const monthYear of affectedMonths) {
    const [month, year] = monthYear.split("-").map(Number) as [number, number];
    await revenueService.recalculateMonthRevenue(companyId, month, year);
  }

  return result;
}
