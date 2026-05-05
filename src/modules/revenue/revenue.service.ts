
import * as revenueRepository from "./revenue.repository.js";
import type { CreateRevenueInput, UpdateRevenueInput } from "./revenue.schemas.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function createRevenue(data: CreateRevenueInput, companyId: string) {
  const existing = await revenueRepository.findByMonthYear(companyId, data.month, data.year);
  if (existing) {
    throw new Error("Revenue for this month and year already exists");
  }

  return revenueRepository.create({
    month: data.month,
    year: data.year,
    totalRevenue: data.totalRevenue,
    company: { connect: { id: companyId } },
  });
}

export async function listRevenues(companyId: string, year?: number) {
  return revenueRepository.findAll(companyId, year);
}

export async function updateRevenue(id: string, companyId: string, data: UpdateRevenueInput) {
  const revenue = await revenueRepository.findById(id, companyId);
  if (!revenue) throw new Error("Revenue record not found");

  const updateData: Prisma.MonthlyRevenueUpdateInput = {};
  if (data.month !== undefined) updateData.month = data.month;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.totalRevenue !== undefined) updateData.totalRevenue = data.totalRevenue;

  // Nota: Se mês/ano forem alterados, a constraint única do Prisma (P2002) garante a integridade.

  return revenueRepository.update(id, companyId, updateData);
}

export async function deleteRevenue(id: string, companyId: string) {
  const revenue = await revenueRepository.findById(id, companyId);
  if (!revenue) throw new Error("Revenue record not found");

  return revenueRepository.deleteRevenue(id, companyId);
}

/**
 * Recalcula a receita de um mês específico baseado nas vendas registradas
 * Útil para correções ou reconciliação de dados
 */
export async function recalculateMonthRevenue(
  companyId: string,
  month: number,
  year: number
) {

  // Definir intervalo do mês
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // Primeiro dia do próximo mês (exclusivo)

  // Somar todas as vendas do mês usando agregação
  const result = await prisma.sale.aggregate({
    where: {
      companyId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const totalRevenue = result._sum.totalAmount ?? 0;

  // Upsert no MonthlyRevenue
  return prisma.monthlyRevenue.upsert({
    where: {
      month_year_companyId: { month, year, companyId },
    },
    create: {
      month,
      year,
      companyId,
      totalRevenue,
    },
    update: {
      totalRevenue,
    },
  });
}

/**
 * Busca a receita do mês atual calculando em tempo real a partir das vendas
 */
export async function getCurrentMonthRevenue(companyId: string) {
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Definir intervalo do mês atual
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // Primeiro dia do próximo mês (exclusivo)

  // Agregar vendas do mês atual em tempo real
  const salesAggregate = await prisma.sale.aggregate({
    where: {
      companyId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
  });

  const totalRevenue = Number(salesAggregate._sum.totalAmount ?? 0);
  const salesCount = salesAggregate._count.id;

  // Buscar registro consolidado (se existir)
  const consolidatedRevenue = await revenueRepository.findByMonthYear(companyId, month, year);

  return {
    month,
    year,
    totalRevenue,
    salesCount,
    consolidatedRevenue: consolidatedRevenue ? Number(consolidatedRevenue.totalRevenue) : null,
  };
}

/**
 * Busca receitas para gráficos (últimos 6 meses por default)
 */
export async function getRevenueChart(
  companyId: string,
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number
) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Default: últimos 6 meses
  let finalEndMonth = endMonth ?? currentMonth;
  let finalEndYear = endYear ?? currentYear;
  let finalStartMonth = startMonth;
  let finalStartYear = startYear;

  if (!finalStartMonth || !finalStartYear) {
    // Calcular 6 meses atrás
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
    finalStartMonth = sixMonthsAgo.getMonth() + 1;
    finalStartYear = sixMonthsAgo.getFullYear();
  }

  const revenues = await revenueRepository.findByDateRange(
    companyId,
    finalStartMonth,
    finalStartYear,
    finalEndMonth,
    finalEndYear
  );

  // Mapear para formato de resposta com Decimal convertido para number
  return revenues.map((r) => ({
    id: r.id,
    month: r.month,
    year: r.year,
    totalRevenue: Number(r.totalRevenue),
  }));
}
