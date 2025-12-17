
import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

export async function create(data: Prisma.CompanyCreateInput) {
  return prisma.company.create({
    data,
  });
}
