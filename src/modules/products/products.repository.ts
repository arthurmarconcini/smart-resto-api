
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client/index.js";

export async function create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({
    data,
  });
}

export async function findById(id: string) {
  return prisma.product.findUnique({
    where: { id },
  });
}

export async function findAll() {
  return prisma.product.findMany();
}

export async function update(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}
