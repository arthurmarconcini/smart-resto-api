
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";


export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
  });
}

export async function findById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  });
}

export async function findAll() {
    return prisma.category.findMany();
}
