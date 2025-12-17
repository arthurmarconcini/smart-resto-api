
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";


export async function create(data: Prisma.CompanyCreateInput) {
  return prisma.company.create({
    data,
  });
}
