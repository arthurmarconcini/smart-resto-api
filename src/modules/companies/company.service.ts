
import * as companiesRepository from "./company.repository.js";
import type { CreateCompanyInput } from "./company.schemas.js";

import * as productsRepository from "../products/products.repository.js";
import * as financeService from "../finance/finance.service.js";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit,
  });
}

export async function updateCompanySettings(id: string, data: { monthlyFixedCost?: number; defaultTaxRate?: number; defaultCardFee?: number; desiredProfit?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.monthlyFixedCost !== undefined) updateData.monthlyFixedCost = data.monthlyFixedCost;
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = data.defaultTaxRate;
  if (data.defaultCardFee !== undefined) updateData.defaultCardFee = data.defaultCardFee;
  if (data.desiredProfit !== undefined) updateData.desiredProfit = data.desiredProfit;
  
  return companiesRepository.update(id, updateData);
}

export async function calculateSalesTarget(companyId: string) {
  const company = await companiesRepository.findById(companyId);
  if (!company) throw new Error("Company not found");

  const monthlyFixedCost = Number(company.monthlyFixedCost);
  const desiredProfitPercent = Number(company.desiredProfit);
  // We treat desiredProfit as a percentage of the Revenue (Margin) usually, or as a fixed value?
  // "Meta de Faturamento ... + Meta de Lucro em Valor Real / Margem de Contribuição"
  // The Prompt says: "Meta de Lucro em Valor Real". But the schema has `desiredProfit` (Decimal). 
  // Is `desiredProfit` a percentage (margin) or a fixed value (R$)? 
  // In `createCompanySchema`: `max(100)` implies percentage.
  // HOWEVER, the formula says "Meta de Lucro em Valor Real".
  // Let's assume for this calculation, if the user stored a % in DB, we might want to convert it?
  // OR, maybe the user WANTS to store a fixed value but the schema validation forced them to %?
  // Wait, `desiredProfit` in schema is `Decimal`. The schema validation `max(100)` suggests %.
  // IF the user wants "Real Value Profit", we might need to calculate it derived from the target revenue?
  // FORMULA: RequiredRevenue = (FixedCosts + BillSum + RealProfit) / ContributionMargin
  // Contribution Margin = (Revenue - VariableCosts) / Revenue.
  // Variable Costs = Taxes + CardFees + ProductCost (COGS).
  // This is complex because COGS depends on WHAT we sell.
  // Simplified Contribution Margin Average:
  // "Avg Product Qty... based on ticket medio".
  
  // Let's TRY to find an Average Contribution Margin %.
  // AvgMargin = Average( (SalePrice - CostPrice - Taxes - Fees) / SalePrice ) across all products?
  // Let's use that.
  
  const taxRate = Number(company.defaultTaxRate) / 100;
  const cardFee = Number(company.defaultCardFee) / 100; // e.g. 3% -> 0.03
  
  const productsResult = await productsRepository.findAll(companyId, { page: 1, limit: 1000 });
  const products = productsResult.data;
  
  let totalContributionMargin = 0;
  let totalSalePrice = 0;
  
  // Calculate Average Contribution Margin Ratio and Avg Ticket
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
  
  const avgContributionMargin = products.length > 0 ? totalContributionMargin / products.length : 0.5; // Default 50% if no products
  const avgTicket = products.length > 0 ? totalSalePrice / products.length : 0;
  
  // Expenses
  const expensesSum = await financeService.getMonthlyExpenses(companyId);
  
  // "Meta de Lucro em Valor Real" 
  // If `desiredProfit` is a percentage (e.g. 20%), then RealProfit = TargetRevenue * 0.20
  // Formula: Revenue = (Fixed + Expenses + Revenue*Profit%) / CM
  // Revenue - Revenue*Profit%/CM = (Fixed + Expenses)/CM -> WRONG algebra.
  // Revenue = (Fixed + Expenses) / (CM - Profit%)
  // Example: Fixed 1000, CM 0.5, Profit 0.1 (10%).
  // Revenue = 1000 / (0.5 - 0.1) = 1000 / 0.4 = 2500.
  // Check: Rev 2500. CM = 1250. Profit = 250. 
  // Fixed(1000) + Profit(250) = 1250. Matches CM. Correct.
  
  const targetProfitPercent = desiredProfitPercent / 100;
  
  const denominator = avgContributionMargin - targetProfitPercent;
  
  // Safety check
  if (denominator <= 0) {
     // Impossible to reach target. 
     // Return 0 or handle error?
     // Let's return a "Projected" valid only if possible.
     return {
        totalToSell: 0,
        dailyTarget: 0,
        avgProductQty: 0,
        warning: "Your desired profit and costs exceed your product margins. Impossible to calculate target."
     };
  }
  
  const totalFixedNeeds = monthlyFixedCost + expensesSum;
  const totalToSell = totalFixedNeeds / denominator;
  
  return {
    totalToSell: Number(totalToSell.toFixed(2)),
    dailyTarget: Number((totalToSell / 30).toFixed(2)),
    avgProductQty: avgTicket > 0 ? Math.ceil(totalToSell / avgTicket) : 0,
    metrics: {
        expensesSum,
        monthlyFixedCost,
        avgContributionMargin: Number(avgContributionMargin.toFixed(2)),
        avgTicket: Number(avgTicket.toFixed(2))
    }
  };
}
