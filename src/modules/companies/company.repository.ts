
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";


export async function create(data: Prisma.CompanyCreateInput) {
  return prisma.company.create({
    data,
  });
}

export async function findById(id: string) {
  return prisma.company.findUnique({
    where: { id },
  });
}

export async function update(id: string, data: Prisma.CompanyUpdateInput) {
  return prisma.company.update({
    where: { id },
    data,
  });
}
