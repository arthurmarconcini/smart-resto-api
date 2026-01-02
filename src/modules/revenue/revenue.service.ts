
import * as revenueRepository from "./revenue.repository.js";
import type { CreateRevenueInput, UpdateRevenueInput } from "./revenue.schemas.js";
import { Prisma } from "@prisma/client";

export async function createRevenue(data: CreateRevenueInput, companyId: string) {
  // Check if revenue already exists for this month/year
  const existing = await revenueRepository.findByMonthYear(companyId, data.month, data.year);
  if (existing) {
    throw new Error("Revenue for this month and year already exists");
  }

  return revenueRepository.create({
    month: data.month,
    year: data.year,
    totalRevenue: data.totalRevenue,
    company: { connect: { id: companyId } },
  });
}

export async function listRevenues(companyId: string, year?: number) {
  return revenueRepository.findAll(companyId, year);
}

export async function updateRevenue(id: string, companyId: string, data: UpdateRevenueInput) {
  const revenue = await revenueRepository.findById(id, companyId);
  if (!revenue) throw new Error("Revenue record not found");

  const updateData: Prisma.MonthlyRevenueUpdateInput = {};
  if (data.month !== undefined) updateData.month = data.month;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.totalRevenue !== undefined) updateData.totalRevenue = data.totalRevenue;

  // Ideally, if changing month/year, check for conflicts again. 
  // For simplicity, omitting that check for now or assuming the unique constraint will catch it (Prisma will throw P2002).

  return revenueRepository.update(id, companyId, updateData);
}

export async function deleteRevenue(id: string, companyId: string) {
  const revenue = await revenueRepository.findById(id, companyId);
  if (!revenue) throw new Error("Revenue record not found");

  return revenueRepository.deleteRevenue(id, companyId);
}
