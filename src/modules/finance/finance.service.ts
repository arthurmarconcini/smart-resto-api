
import * as financeRepository from "./finance.repository.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./finance.schemas.js";
import { Prisma } from "@prisma/client";

export async function createExpense(data: CreateExpenseInput, companyId: string) {
  return financeRepository.create({
    description: data.description,
    amount: data.amount,
    dueDate: new Date(data.dueDate),
    status: data.status || "PENDING",
    isRecurring: data.isRecurring || false,
    company: { connect: { id: companyId } },
  });
}

export async function listExpenses(companyId: string) {
  return financeRepository.findAll(companyId);
}

export async function updateExpense(id: string, companyId: string, data: UpdateExpenseInput) {
  const expense = await financeRepository.findById(id, companyId);
  if (!expense) throw new Error("Expense not found");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const updateData: Prisma.ExpenseUpdateInput = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  
  return financeRepository.update(id, companyId, updateData);
}

export async function deleteExpense(id: string, companyId: string) {
  const expense = await financeRepository.findById(id, companyId);
  if (!expense) throw new Error("Expense not found");
  
  return financeRepository.deleteExpense(id, companyId);
}

export async function getMonthlyExpenses(companyId: string, month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  
  return financeRepository.sumUnpaidExpenses(companyId, targetMonth, targetYear);
}
