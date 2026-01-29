
import { Prisma } from "@prisma/client";
import * as employeeCostRepository from "./employee-cost.repository.js";
import type { CreateEmployeeCostInput, UpdateEmployeeCostInput } from "./employee-cost.schemas.js";

export async function createEmployeeCost(data: CreateEmployeeCostInput, companyId: string) {
  return employeeCostRepository.create({
    ...data,
    company: { connect: { id: companyId } },
  });
}

export async function updateEmployeeCost(id: string, data: UpdateEmployeeCostInput) {
  const employeeCost = await employeeCostRepository.findById(id);
  if (!employeeCost) throw new Error("Employee cost not found");

  // Remover propriedades undefined para satisfazer exactOptionalPropertyTypes
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Prisma.EmployeeCostUpdateInput;

  return employeeCostRepository.update(id, cleanData);
}

export async function deleteEmployeeCost(id: string) {
  const employeeCost = await employeeCostRepository.findById(id);
  if (!employeeCost) throw new Error("Employee cost not found");

  return employeeCostRepository.deleteEmployeeCost(id);
}


export async function listEmployeeCosts(companyId: string) {
  const costs = await employeeCostRepository.findAll(companyId);
  return costs.map((cost) => ({
    ...cost,
    dailyRate: Number(cost.dailyRate),
    monthlyTotal: Number(cost.dailyRate) * cost.workedDays
  }));
}

export async function calculateTotalEmployeeCost(companyId: string) {
  const costs = await employeeCostRepository.findAll(companyId);
  
  let total = 0;
  for (const cost of costs) {
    total += Number(cost.dailyRate) * cost.workedDays;
  }
  
  return total;
}
