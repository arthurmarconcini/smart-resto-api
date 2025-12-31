
import * as companiesRepository from "./company.repository.js";
import type { CreateCompanyInput } from "./company.schemas.js";

import * as productsRepository from "../products/products.repository.js";
import * as financeService from "../finance/finance.service.js";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit || 0, // Legacy support
    targetProfitValue: 0, // Default 0
  });
}

export async function updateCompanySettings(id: string, data: { monthlyFixedCost?: number; defaultTaxRate?: number; defaultCardFee?: number; desiredProfit?: number; targetProfitValue?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.monthlyFixedCost !== undefined) updateData.monthlyFixedCost = data.monthlyFixedCost;
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = data.defaultTaxRate;
  if (data.defaultCardFee !== undefined) updateData.defaultCardFee = data.defaultCardFee;
  if (data.desiredProfit !== undefined) updateData.desiredProfit = data.desiredProfit;
  if (data.targetProfitValue !== undefined) updateData.targetProfitValue = data.targetProfitValue;
  
  return companiesRepository.update(id, updateData);
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
  
  // Expenses (Sum of all pending/paid expenses for the month to be covered)
  const expensesSum = await financeService.getMonthlyExpenses(companyId);
  
  // Formula: RequiredRevenue * CM = FixedCosts + Expenses + ProfitTarget
  // RequiredRevenue = (Fixed + Expenses + ProfitTarget) / CM
  
  let totalToSell = 0;
  
  if (avgContributionMargin > 0) {
      const totalNeeds = monthlyFixedCost + expensesSum + targetProfitValue;
      totalToSell = totalNeeds / avgContributionMargin;
  }
  
  return {
    totalToSell: Number(totalToSell.toFixed(2)),
    dailyTarget: Number((totalToSell / 30).toFixed(2)),
    avgProductQty: avgTicket > 0 ? Math.ceil(totalToSell / avgTicket) : 0,
    metrics: {
        expensesSum,
        monthlyFixedCost,
        targetProfitValue,
        avgContributionMargin: Number(avgContributionMargin.toFixed(2)),
        avgTicket: Number(avgTicket.toFixed(2))
    }
  };
}
