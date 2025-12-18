
import * as productsRepository from "./products.repository.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.schemas.js";
import { Prisma } from "@prisma/client";

function calculatePricingValues(costPrice: number, salesPrice?: number, markup?: number) {
  if (salesPrice !== undefined) {
    // Calculate markup based on salesPrice and costPrice
    // Markup = ((Sales - Cost) / Cost) * 100
    if (costPrice === 0) return { costPrice, salesPrice, markup: 0 }; // Avoid division by zero
    const calculatedMarkup = ((salesPrice - costPrice) / costPrice) * 100;
    return { costPrice, salesPrice, markup: parseFloat(calculatedMarkup.toFixed(2)) };
  } else if (markup !== undefined) {
    // Calculate salesPrice based on costPrice and markup
    // Sales = Cost * (1 + Markup/100)
    const calculatedSalesPrice = costPrice * (1 + markup / 100);
    return { costPrice, markup, salesPrice: parseFloat(calculatedSalesPrice.toFixed(2)) };
  }
  return { costPrice, salesPrice, markup };
}

export async function createProduct(data: CreateProductInput, companyId: string) {
  const { costPrice, salesPrice, markup, categoryId, description, ...rest } = data;

  const pricing = calculatePricingValues(costPrice, salesPrice, markup);

  // Prisma CreateInput requires non-nullable fields to be present.
  // salesPrice and markup are required in schema (Decimal), but have @default(0)? 
  // No, markup has default(0). salesPrice does NOT have default.
  // So salesPrice IS REQUIRED.
  // If pricing.salesPrice is undefined, we have a problem. 
  // Validation schema requires (salesPrice OR markup).
  // logical: if salesPrice provided -> ok. If markup provided -> salesPrice calc -> ok.
  // So pricing.salesPrice SHOULD be defined.
  
  const finalSalesPrice = pricing.salesPrice ?? 0; // Should not happen given validation
  const finalMarkup = pricing.markup ?? 0;

  return productsRepository.create({
    ...rest,
    description: description ?? null,
    costPrice: pricing.costPrice,
    salesPrice: finalSalesPrice, 
    markup: finalMarkup,       
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
  return productsRepository.findAll(companyId, query);
}

export async function updateProduct(id: string, companyId: string, data: UpdateProductInput) {
  const product = await getProduct(id, companyId);
  
  // Convert Decimal to number for calculation
  const productCost = Number(product.costPrice);
  
  const newCost = data.costPrice ?? productCost;
  
  let pricingUpdate: { costPrice?: number; salesPrice?: number | undefined; markup?: number | undefined } = {};

  if (data.costPrice !== undefined) {
     if (data.markup !== undefined) {
        pricingUpdate = calculatePricingValues(data.costPrice, undefined, data.markup);
     } else if (data.salesPrice !== undefined) {
         pricingUpdate = calculatePricingValues(data.costPrice, data.salesPrice, undefined);
     }
  } else {
     // Cost price not changing, but we use 'newCost' (which is productCost)
     if (data.markup !== undefined) {
         pricingUpdate = calculatePricingValues(newCost, undefined, data.markup);
     } else if (data.salesPrice !== undefined) {
         pricingUpdate = calculatePricingValues(newCost, data.salesPrice, undefined);
     }
  }

  // Construct update data cleanly without undefined
  const updateData: Prisma.ProductUpdateInput = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description; // null or string
  
  // Spread pricingUpdate fields if they exist
  if (pricingUpdate.costPrice !== undefined) updateData.costPrice = pricingUpdate.costPrice;
  if (pricingUpdate.salesPrice !== undefined) updateData.salesPrice = pricingUpdate.salesPrice;
  if (pricingUpdate.markup !== undefined) updateData.markup = pricingUpdate.markup;

  return productsRepository.update(id, companyId, updateData);
}

export async function deleteProduct(id: string, companyId: string) {
  await getProduct(id, companyId);
  return productsRepository.deleteProduct(id, companyId);
}
