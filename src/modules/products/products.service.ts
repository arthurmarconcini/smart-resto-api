
import * as productsRepository from "./products.repository";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export async function createProduct(data: Prisma.ProductCreateInput) {
  if (data.costPrice && data.company?.connect?.id) {
    const company = await prisma.company.findUnique({
      where: { id: data.company.connect.id },
    });

    if (company?.desiredProfit) {
      const cost = Number(data.costPrice);
      const marginPercentage = Number(company.desiredProfit);

      const marginDecimal = marginPercentage / 100;

      if (marginDecimal >= 1) {
        throw new Error("A margem de lucro deve ser inferior a 100%.");
      }

      const divisor = 1 - marginDecimal;
      const calculatedSalesPrice = cost / divisor;
      data.salesPrice = parseFloat(calculatedSalesPrice.toFixed(2));
    }
  }

  return productsRepository.create(data);
}

export async function getProduct(id: string) {
  const product = await productsRepository.findById(id);
  if (!product) {
    throw new Error(`Product not found: ${id}`);
  }
  return product;
}

export async function listProducts() {
  return productsRepository.findAll();
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  await getProduct(id);
  return productsRepository.update(id, data);
}

export async function deleteProduct(id: string) {
  await getProduct(id);
  return productsRepository.deleteProduct(id);
}
