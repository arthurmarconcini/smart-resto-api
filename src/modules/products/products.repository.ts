
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({
    data,
  });
}

export async function findById(id: string, companyId: string) {
  return prisma.product.findUnique({
    where: { id, companyId },
  });
}

export async function findAll(
  companyId: string, 
  params: { 
    page: number; 
    limit: number; 
    search?: string; 
    categoryId?: string 
  }
) {
  const { page, limit, search, categoryId } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    companyId,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { category: true } // Helpful context
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
}

export async function update(id: string, companyId: string, data: Prisma.ProductUpdateInput) {
  // Try to update directly. If it doesn't exist for this company, it will throw or not return.
  // Prisma update requires 'where' to be unique.
  // To enforce companyId CHECK, we might need updateMany (which doesn't return the record in standard prisma unless we query again)
  // OR we rely on a previous check. The Service usually does check.
  // BUT, to be safe and atomic, we can use updateMany or verify ownership first.
  // Let's stick to simple update if we assume service checks existence, BUT proper multi-tenancy usually means we check the constraint.
  // Since 'id' is globally unique usually, but we want to ensure it belongs to companyId.
  // Prisma 'update' only allows unique where.
  
  // So we first verify, OR we use updateMany (which returns count).
  // Requirements say "Service/Repository pattern".
  // Let's use 'findFirst' to verify ownership if needed, or rely on service.
  // Actually, standard practice with Prisma ID (which is PK) + companyId:
  // If ID is PK, we can just check if it exists with that companyId first.
  
  // However, I will implement a check in the service or here. 
  // Let's change this to use `update` but we need to know it belongs to the company.
  // Service already calls `getProduct` which now calls `findById(id, companyId)`. So it's safe.
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(id: string, companyId: string) {
  // Same logic as update. Service should verify ownership via findById(id, companyId).
  return prisma.product.delete({
    where: { id },
  });
}
