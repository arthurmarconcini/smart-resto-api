
import * as productsRepository from "./products.repository.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.schemas.js";
import { Prisma } from "@prisma/client";

// Core business logic for pricing
// Formula: Markup = ((Sales - Cost) / Cost) * 100
// Formula: Sales = Cost * (1 + Markup/100)
function calculatePricingValues(costPrice: number, salePrice?: number, markup?: number) {
  if (salePrice !== undefined) {
    // Calculate markup based on salePrice
    if (costPrice === 0) return { costPrice, salePrice, markup: 0, profitMargin: 0 }; // Avoid division by zero
    
    // markup = ((venda - custo) / custo) * 100
    const calculatedMarkup = ((salePrice - costPrice) / costPrice) * 100;
    
    return { 
      costPrice, 
      salePrice, 
      markup: parseFloat(calculatedMarkup.toFixed(2)) 
    };
  } else if (markup !== undefined) {
    // Calculate salePrice based on markup
    // venda = custo * (1 + markup/100)
    const calculatedSalesPrice = costPrice * (1 + markup / 100);
    
    return { 
      costPrice, 
      markup, 
      salePrice: parseFloat(calculatedSalesPrice.toFixed(2)) 
    };
  }
  return { costPrice, salePrice, markup };
}

export async function createProduct(data: CreateProductInput, companyId: string) {
  const { costPrice, salePrice, markup, categoryId, description, unit, ...rest } = data;

  const pricing = calculatePricingValues(costPrice, salePrice, markup)
  
  const finalSalesPrice = pricing.salePrice ?? 0; // Should not happen given validation
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
  
  let pricingUpdate: { costPrice?: number; salePrice?: number | undefined; markup?: number | undefined } = {};

  if (data.costPrice !== undefined) {
     if (data.markup !== undefined) {
        pricingUpdate = calculatePricingValues(data.costPrice, undefined, data.markup);
     } else if (data.salePrice !== undefined) {
         pricingUpdate = calculatePricingValues(data.costPrice, data.salePrice, undefined);
     }
  } else {
     // Cost price not changing, but we use 'newCost' (which is productCost)
     if (data.markup !== undefined) {
         pricingUpdate = calculatePricingValues(newCost, undefined, data.markup);
     } else if (data.salePrice !== undefined) {
         pricingUpdate = calculatePricingValues(newCost, data.salePrice, undefined);
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
