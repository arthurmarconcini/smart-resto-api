
import * as productsRepository from "./products.repository.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.schemas.js";
import { Prisma } from "@prisma/client";

// Core business logic for smart pricing
// Suggested Price = Cost / (1 - (Tax% + Fees% + ProfitMargin%))
// If user provides salePrice, we calculate markup/margin.
// If user provides markup/margin, we calculate salePrice.
interface PricingSettings {
  taxRate?: number;
  cardFee?: number;
  desiredMargin?: number;
}

function calculateSmartPricing(costPrice: number, settings: PricingSettings, salePrice?: number) {
  const tax = (settings.taxRate ?? 0) / 100;
  const fee = (settings.cardFee ?? 0) / 100;
  const margin = (settings.desiredMargin ?? 0) / 100;
  
  if (salePrice !== undefined) {
    // If sale price given, we calculate the implied margin or just accept it? 
    // Usually markup is just (Sale-Cost)/Cost.
    // Let's stick to simple markup calculation for consistency in storage, 
    // but the system will suggest the optimal price if asked.
    // The requirement says "The API must calculate automatically the suggested sale price".
    // This usually implies when CREATING/UPDATING with COST, we default to the suggested price if no price given.
    
    // For now, let's keep standard markup calculation if SalePrice is explicit.
    const calculatedMarkup = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;
    return { costPrice, salePrice, markup: Number(calculatedMarkup.toFixed(2)) };
  } else {
    // Calculate Suggested Price
    // Denominator = 1 - (Tax + Fee + Margin)
    const denominator = 1 - (tax + fee + margin);
    
    let suggestedPrice = 0;
    if (denominator > 0) {
        suggestedPrice = costPrice / denominator;
    } else {
        // Fallback: If margins > 100% (impossible denominator), just add simple markup? 
        // Or throw error? Let's just do Cost * (1 + Sum) as fallback to avoid crash/infinite.
        suggestedPrice = costPrice * (1 + tax + fee + margin);
    }
    
    const calculatedMarkup = costPrice > 0 ? ((suggestedPrice - costPrice) / costPrice) * 100 : 0;
    
    return {
        costPrice,
        salePrice: Number(suggestedPrice.toFixed(2)),
        markup: Number(calculatedMarkup.toFixed(2))
    };
  }
}

import * as companiesRepository from "../companies/company.repository.js";

// Helper to get settings
async function getCompanyPricingSettings(companyId: string): Promise<PricingSettings> {
    const company = await companiesRepository.findById(companyId);
    if (!company) throw new Error("Company not found");
    return {
        taxRate: Number(company.defaultTaxRate),
        cardFee: Number(company.defaultCardFee),
        desiredMargin: Number(company.desiredProfit),
    };
}

export async function createProduct(data: CreateProductInput, companyId: string) {
  const { costPrice, salePrice, markup, categoryId, description, unit, ...rest } = data;

  const settings = await getCompanyPricingSettings(companyId);
  const pricing = calculateSmartPricing(costPrice, settings, salePrice);
  
  const finalSalesPrice = pricing.salePrice ?? 0;
  const finalMarkup = pricing.markup ?? 0;

  return productsRepository.create({
    ...rest,
    description: description ?? null,
    costPrice: pricing.costPrice,
    salePrice: finalSalesPrice, 
    markup: finalMarkup,
    unit,
    company: { connect: { id: companyId } },
    category: { connect: { id: categoryId } },
  });
}

export async function getProduct(id: string, companyId: string) {
  const product = await productsRepository.findById(id, companyId);
  if (!product) {
    throw new Error(`Product not found: ${id}`);
  }
  return product;
}

export async function listProducts(companyId: string, query: ListProductsQuery) {
  const { page, limit, search, categoryId } = query;
  return productsRepository.findAll(companyId, {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId } : {}),
  });
}

export async function updateProduct(id: string, companyId: string, data: UpdateProductInput) {
  const product = await getProduct(id, companyId);
  
  // Convert Decimal to number for calculation
  const productCost = Number(product.costPrice);
  
  const newCost = data.costPrice ?? productCost;
  
  const settings = await getCompanyPricingSettings(companyId);
  
  let pricingUpdate: { costPrice?: number; salePrice?: number | undefined; markup?: number | undefined } = {};

  // If cost changes or user asks to update price via logic
  if (data.costPrice !== undefined) {
      // If salePrice provided, prioritize it (manual override)
      if (data.salePrice !== undefined) {
          pricingUpdate = calculateSmartPricing(data.costPrice, settings, data.salePrice);
      } else {
          // If ONLY cost provided, recalculate salePrice based on smart settings
          // UNLESS user provided markup (legacy behavior). Assuming smart pricing takes precedence if no manual price.
          // Let's assume if cost changes, we recalculate suggested price unless salePrice given.
          pricingUpdate = calculateSmartPricing(data.costPrice, settings, undefined);
      }
  } else {
      // Cost unchanged
      if (data.salePrice !== undefined) {
          pricingUpdate = calculateSmartPricing(newCost, settings, data.salePrice);
      } else if (data.markup !== undefined) {
         // Legacy markup change? 
         // System doesn't support "update margin to X" directly in this signature, 
         // but if we want to "re-calculate based on current settings", maybe we need a flag.
         // For now, if no cost/salePrice change, we do nothing to pricing unless explicitly requested.
      }
  }

  // Construct update data cleanly without undefined
  const updateData: Prisma.ProductUpdateInput = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description; // null or string
  if (data.unit) updateData.unit = data.unit;
  
  // Spread pricingUpdate fields if they exist
  if (pricingUpdate.costPrice !== undefined) updateData.costPrice = pricingUpdate.costPrice;
  if (pricingUpdate.salePrice !== undefined) updateData.salePrice = pricingUpdate.salePrice;
  if (pricingUpdate.markup !== undefined) updateData.markup = pricingUpdate.markup;

  return productsRepository.update(id, companyId, updateData);
}

export async function deleteProduct(id: string, companyId: string) {
  await getProduct(id, companyId);
  return productsRepository.deleteProduct(id, companyId);
}
