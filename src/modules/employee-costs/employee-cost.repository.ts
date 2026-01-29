
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function create(data: Prisma.EmployeeCostCreateInput) {
  return prisma.employeeCost.create({
    data,
  });
}

export async function update(id: string, data: Prisma.EmployeeCostUpdateInput) {
  return prisma.employeeCost.update({
    where: { id },
    data,
  });
}

export async function deleteEmployeeCost(id: string) {
  return prisma.employeeCost.delete({
    where: { id },
  });
}

export async function findById(id: string) {
  return prisma.employeeCost.findUnique({
    where: { id },
  });
}

export async function findAll(companyId: string) {
  return prisma.employeeCost.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function countByCompany(companyId: string) {
  return prisma.employeeCost.count({
    where: { companyId },
  });
}
