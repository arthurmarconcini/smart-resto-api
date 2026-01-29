import * as salesRepository from "./sales.repository.js";
import * as revenueService from "../revenue/revenue.service.js";
import type { CreateSaleInput } from "./sales.schemas.js";

function mapSaleToDto(sale: any) {
  return {
    ...sale,
    totalAmount: Number(sale.totalAmount),
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
