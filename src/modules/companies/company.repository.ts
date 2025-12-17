
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client/index.js";

export async function create(data: Prisma.CompanyCreateInput) {
  return prisma.company.create({
    data,
  });
}
