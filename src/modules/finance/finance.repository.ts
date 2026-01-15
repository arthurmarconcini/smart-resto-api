
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "@prisma/client";

export async function create(data: Prisma.ExpenseCreateInput) {
  return prisma.expense.create({
    data,
  });
}

export async function findById(id: string, companyId: string) {
  return prisma.expense.findUnique({
    where: { id, companyId },
  });
}

export async function findAll(companyId: string) {
  return prisma.expense.findMany({
    where: { companyId },
    orderBy: { dueDate: "asc" },
  });
}

export async function update(id: string, companyId: string, data: Prisma.ExpenseUpdateInput) {
  return prisma.expense.update({
    where: { id, companyId },
    data,
  });
}

export async function deleteExpense(id: string, companyId: string) {
  return prisma.expense.delete({
    where: { id, companyId },
  });
}

export async function sumUnpaidExpenses(companyId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); 
  endDate.setHours(23, 59, 59, 999); // Include full last day

  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      // Logic for sum: 
      // 1. One-time expenses in this month range (dueDate)
      // 2. OR Recurring expenses (dueDate day match? Or just any recurring expense?)
      // Simplification: Standard recurring expense logic usually means it hits every month.
      // For this MVP, we will sum ALL recurring expenses + any one-time expense in this month due date.
      OR: [
        {
          isRecurring: true,
        },
        {
          dueDate: {
            gte: startDate,
            lte: endDate,
          }
        }
      ]
    },
  });

  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

export async function findPendingExpensesInMonth(companyId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); 
  endDate.setHours(23, 59, 59, 999);

  return prisma.expense.findMany({
    where: {
      companyId,
      status: "PENDING",
      OR: [
        { isRecurring: true },
        {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
  });
}
