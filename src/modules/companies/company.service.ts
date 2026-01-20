
import * as companiesRepository from "./company.repository.js";
import type { CreateCompanyInput } from "./company.schemas.js";

import * as productsRepository from "../products/products.repository.js";

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit || 0, // Legacy support
    targetProfitValue: 0, // Default 0
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

  // Convert Decimals to Numbers for the Controller/Frontend
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

  // Calculate Average Contribution Margin Ratio
  if (products.length > 0) {
    for (const p of products) {
      const sale = Number(p.salePrice);
      const cost = Number(p.costPrice);
      // Variable Cost = Cost + (Sale * Tax) + (Sale * CardFee)
      const variableCost = cost + (sale * taxRate) + (sale * cardFee);
      const contribution = sale - variableCost;
      const marginRatio = sale > 0 ? contribution / sale : 0;

      totalContributionMargin += marginRatio;
      totalSalePrice += sale;
    }
  }

  const avgContributionMargin = products.length > 0 ? totalContributionMargin / products.length : 0.5; // Default 50%
  const avgTicket = products.length > 0 ? totalSalePrice / products.length : 0;

  // Date Logic for Current Month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Fetch Expenses Sum grouped by Category for the current month
  // We fetch ALL expenses (Paid + Pending) to calculate the full monthly target
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
  
  // Note: If there are other categories (DEBT, TAX, INVESTMENT), they are not explicitly requested 
  // in the breakdown, but for the Total Target (totalNeeds), we should probably include them 
  // if we want to cover *all* costs. 
  // However, the prompt specifically asked for "variableExpenses" and defined it as "Sum of expenses VARIABLE".
  // And defined Total Fixed as "Generic + Fixed Expenses".
  // To be safe and compliant with "RequiredRevenue = TotalFixed + Variable + Profit", 
  // I will use detailedFixedCost and variableCost as defined.
  // If we want to capture ALL other expenses as "Variable" in the broad sense, we could sum everything not FIXED.
  // Given the strict instruction "variableCost: number // Soma das expenses VARIABLE", I will stick to the category.
  
  const totalFixedCost = monthlyFixedCost + detailedFixedCost;

  // Formula: RequiredRevenue * CM = FixedCosts + Expenses + ProfitTarget
  // RequiredRevenue = (Fixed + Expenses + ProfitTarget) / CM
  
  // Per instructions: target uses (totalFixedCost + variableExpenses + targetProfitValue)
  // variableExpenses here maps to variableCost
  const totalNeeds = totalFixedCost + variableCost + targetProfitValue;

  let totalToSell = 0;
  if (avgContributionMargin > 0) {
    totalToSell = totalNeeds / avgContributionMargin;
  }

  return {
    totalToSell: Number(totalToSell.toFixed(2)),
    dailyTarget: Number((totalToSell / 30).toFixed(2)),
    monthlyTarget: Number(totalToSell.toFixed(2)), // Added monthlyTarget as per example
    avgProductQty: avgTicket > 0 ? Math.ceil(totalToSell / avgTicket) : 0,
    breakDown: {
      genericFixedCost: monthlyFixedCost,
      detailedFixedCost: Number(detailedFixedCost.toFixed(2)),
      totalFixedCost: Number(totalFixedCost.toFixed(2)),
      variableCost: Number(variableCost.toFixed(2)),
      targetProfit: targetProfitValue,
    },
    metrics: {
      expensesSum: detailedFixedCost + variableCost, // Keeping a sum for reference, though deprecated in new structure
      monthlyFixedCost,
      targetProfitValue,
      avgContributionMargin: Number(avgContributionMargin.toFixed(2)),
      avgTicket: Number(avgTicket.toFixed(2))
    }
  };
}
