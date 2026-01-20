
import * as companiesRepository from "./company.repository.js";
import type { CreateCompanyInput } from "./company.schemas.js";

import * as productsRepository from "../products/products.repository.js";

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit || 0, // Suporte a legado
    targetProfitValue: 0, // Padrão 0
  });
}

export async function updateCompanySettings(
  id: string,
  data: {
    monthlyFixedCost?: number;
    defaultTaxRate?: number;
    defaultCardFee?: number;
    desiredProfit?: number;
    targetProfitValue?: number;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Prisma.CompanyUpdateInput = {};
  if (data.monthlyFixedCost !== undefined) updateData.monthlyFixedCost = data.monthlyFixedCost;
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = data.defaultTaxRate;
  if (data.defaultCardFee !== undefined) updateData.defaultCardFee = data.defaultCardFee;
  if (data.desiredProfit !== undefined) updateData.desiredProfit = data.desiredProfit;
  if (data.targetProfitValue !== undefined) updateData.targetProfitValue = data.targetProfitValue;

  const company = await companiesRepository.update(id, updateData);

  // Converte Decimals para Numbers para o Controller/Frontend
  const monthlyFixedCost = Number(company.monthlyFixedCost);
  const desiredProfit = Number(company.desiredProfit);

  const isConfigured = monthlyFixedCost > 0 && desiredProfit > 0;

  return {
    ...company,
    monthlyFixedCost,
    defaultTaxRate: Number(company.defaultTaxRate),
    defaultCardFee: Number(company.defaultCardFee),
    desiredProfit,
    targetProfitValue: Number(company.targetProfitValue),
    isConfigured,
  };
}

export async function getCompanySettings(id: string) {
  const company = await companiesRepository.findById(id);
  if (!company) throw new Error("Company not found");

  return {
    ...company,
    monthlyFixedCost: Number(company.monthlyFixedCost),
    defaultTaxRate: Number(company.defaultTaxRate),
    defaultCardFee: Number(company.defaultCardFee),
    desiredProfit: Number(company.desiredProfit),
    targetProfitValue: Number(company.targetProfitValue),
    isConfigured: Number(company.monthlyFixedCost) > 0 && Number(company.desiredProfit) > 0
  };
}

export async function calculateSalesTarget(companyId: string) {
  const company = await companiesRepository.findById(companyId);
  if (!company) throw new Error("Company not found");

  const monthlyFixedCost = Number(company.monthlyFixedCost);
  const targetProfitValue = Number(company.targetProfitValue);

  const taxRate = Number(company.defaultTaxRate) / 100;
  const cardFee = Number(company.defaultCardFee) / 100;

  const productsResult = await productsRepository.findAll(companyId, { page: 1, limit: 1000 });
  const products = productsResult.data;

  let totalContributionMargin = 0;
  let totalSalePrice = 0;

  // Calcula a taxa média da Margem de Contribuição
  if (products.length > 0) {
    for (const p of products) {
      const sale = Number(p.salePrice);
      const cost = Number(p.costPrice);
      // Custo Variável = Custo + (Venda * Imposto) + (Venda * Taxa Cartão)
      const variableCost = cost + (sale * taxRate) + (sale * cardFee);
      const contribution = sale - variableCost;
      const marginRatio = sale > 0 ? contribution / sale : 0;

      totalContributionMargin += marginRatio;
      totalSalePrice += sale;
    }
  }

  const avgContributionMargin = products.length > 0 ? totalContributionMargin / products.length : 0.5; // Padrão 50%
  const avgTicket = products.length > 0 ? totalSalePrice / products.length : 0;

  // Lógica de data para o mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Busca soma das despesas agrupadas por categoria para o mês atual
  // Buscamos TODAS as despesas (Pagas + Pendentes) para calcular a meta mensal total
  const expensesAggregations = await prisma.expense.groupBy({
    by: ['category'],
    where: {
      companyId,
      dueDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const expenseMap = new Map<string, number>();
  expensesAggregations.forEach(e => {
    if (e.category) {
      expenseMap.set(e.category, Number(e._sum.amount || 0));
    }
  });

  const detailedFixedCost = expenseMap.get('FIXED') || 0;
  const variableCost = expenseMap.get('VARIABLE') || 0;
  
  // Nota: De acordo com a instrução estrita, 'variableCost' é a soma das despesas marcadas como VARIÁVEL.
  // Outras categorias não são incluídas explicitamente neste cálculo de custo variável simplificado.
  
  const totalFixedCost = monthlyFixedCost + detailedFixedCost;

  // Fórmula: Receita Necessária = (Fixos + Despesas Variáveis + Lucro Alvo) / Margem de Contribuição
  const totalNeeds = totalFixedCost + variableCost + targetProfitValue;

  let totalToSell = 0;
  if (avgContributionMargin > 0) {
    totalToSell = totalNeeds / avgContributionMargin;
  }

  return {
    totalToSell: Number(totalToSell.toFixed(2)),
    dailyTarget: Number((totalToSell / 30).toFixed(2)),
    monthlyTarget: Number(totalToSell.toFixed(2)),
    avgProductQty: avgTicket > 0 ? Math.ceil(totalToSell / avgTicket) : 0,
    breakDown: {
      genericFixedCost: monthlyFixedCost,
      detailedFixedCost: Number(detailedFixedCost.toFixed(2)),
      totalFixedCost: Number(totalFixedCost.toFixed(2)),
      variableCost: Number(variableCost.toFixed(2)),
      targetProfit: targetProfitValue,
    },
    metrics: {
      expensesSum: detailedFixedCost + variableCost, // Mantendo soma para referência
      monthlyFixedCost,
      targetProfitValue,
      avgContributionMargin: Number(avgContributionMargin.toFixed(2)),
      avgTicket: Number(avgTicket.toFixed(2))
    }
  };
}
