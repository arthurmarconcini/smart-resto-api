import type { FastifyRequest, FastifyReply } from "fastify";
import * as salesService from "./sales.service.js";
import type { CreateSaleInput } from "./sales.schemas.js";
import { AppError } from "../../errors/AppError.js";

export async function createSaleHandler(
  request: FastifyRequest<{ Body: CreateSaleInput }>,
  reply: FastifyReply
) {
  // @ts-ignore - user é anexado pelo authMiddleware
  const { companyId } = request.user as { companyId: string };
  const sale = await salesService.createSale(request.body, companyId);
  return reply.status(201).send(sale);
}

export async function listSalesHandler(
  request: FastifyRequest<{ Querystring: { month?: number; year?: number } }>,
  reply: FastifyReply
) {
  // @ts-ignore - user é anexado pelo authMiddleware
  const { companyId } = request.user as { companyId: string };
  const { month, year } = request.query;
  const sales = await salesService.getSales(companyId, month, year);
  return reply.send(sales);
}

export async function uploadAnotaAiHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // @ts-ignore - user é anexado pelo authMiddleware
  const { companyId } = request.user as { companyId: string };

  const file = await request.file();

  if (!file) {
    throw new AppError("Nenhum arquivo enviado. Envie um arquivo .xlsx.", 400);
  }

  // Validar extensão
  const filename = file.filename.toLowerCase();
  if (!filename.endsWith(".xlsx")) {
    throw new AppError(
      "Formato de arquivo inválido. Apenas arquivos .xlsx são aceitos.",
      400
    );
  }

  // Validar mimetype
  const validMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ];
  if (!validMimeTypes.includes(file.mimetype)) {
    throw new AppError(
      "Tipo de arquivo inválido. Apenas arquivos .xlsx são aceitos.",
      400
    );
  }

  // Ler o buffer do arquivo
  const buffer = await file.toBuffer();

  // Validar tamanho (10MB) — proteção extra além do limite do multipart
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new AppError(
      "Arquivo muito grande. O tamanho máximo permitido é 10MB.",
      400
    );
  }

  // Processar upload
  const result = await salesService.processAnotaAiUpload(buffer, companyId);

  return reply.status(200).send({
    message: "Upload processado com sucesso",
    ...result,
  });
}
