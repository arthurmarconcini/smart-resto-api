
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";


export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
  });
}

export async function findById(id: string, companyId: string) {
  return prisma.category.findUnique({
    where: { id, companyId },
  });
}

export async function findAll(
  companyId: string,
  params: {
    page: number;
    limit: number;
    search?: string;
  }
) {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.CategoryWhereInput = {
    companyId,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [total, data] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function update(id: string, companyId: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({
    where: { id, companyId },
    data,
  });
}

export async function deleteCategory(id: string, companyId: string) {
  return prisma.category.delete({
    where: { id, companyId },
  });
}
