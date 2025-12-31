
import * as financeRepository from "./finance.repository.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./finance.schemas.js";

export async function createExpense(data: CreateExpenseInput, companyId: string) {
  return financeRepository.create({
    description: data.description,
    amount: data.amount,
    dueDate: new Date(data.dueDate),
    isPaid: data.isPaid || false,
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
  const updateData: any = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  
  return financeRepository.update(id, companyId, updateData);
}

export async function deleteExpense(id: string, companyId: string) {
  const expense = await financeRepository.findById(id, companyId);
  if (!expense) throw new Error("Expense not found");
  
  return financeRepository.deleteExpense(id, companyId);
}

export async function getMonthlyExpenses(companyId: string) {
  const now = new Date();
  return financeRepository.sumUnpaidExpenses(companyId, now.getMonth() + 1, now.getFullYear());
}
