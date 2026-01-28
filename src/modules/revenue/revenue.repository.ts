
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "@prisma/client";

export async function create(data: Prisma.MonthlyRevenueCreateInput) {
  return prisma.monthlyRevenue.create({
    data,
  });
}

export async function findById(id: string, companyId: string) {
  return prisma.monthlyRevenue.findUnique({
    where: { id, companyId },
  });
}

export async function findByMonthYear(companyId: string, month: number, year: number) {
  return prisma.monthlyRevenue.findUnique({
    where: {
      month_year_companyId: {
        month,
        year,
        companyId,
      },
    },
  });
}

export async function findAll(companyId: string, year?: number) {
  return prisma.monthlyRevenue.findMany({
    where: { 
      companyId,
      ...(year ? { year } : {})
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" }
    ],
  });
}

export async function update(id: string, companyId: string, data: Prisma.MonthlyRevenueUpdateInput) {
  return prisma.monthlyRevenue.update({
    where: { id, companyId },
    data,
  });
}

export async function deleteRevenue(id: string, companyId: string) {
  return prisma.monthlyRevenue.delete({
    where: { id, companyId },
  });
}

// Buscar receitas em um intervalo de meses (para gráficos)
export async function findByDateRange(
  companyId: string,
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
) {
  // Construir condição para intervalo de datas year/month
  return prisma.monthlyRevenue.findMany({
    where: {
      companyId,
      OR: [
        // Anos intermediários completos
        {
          year: { gt: startYear, lt: endYear },
        },
        // Mesmo ano de início e fim
        ...(startYear === endYear
          ? [
              {
                year: startYear,
                month: { gte: startMonth, lte: endMonth },
              },
            ]
          : [
              // Ano de início (meses >= startMonth)
              {
                year: startYear,
                month: { gte: startMonth },
              },
              // Ano de fim (meses <= endMonth)
              {
                year: endYear,
                month: { lte: endMonth },
              },
            ]),
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
}
