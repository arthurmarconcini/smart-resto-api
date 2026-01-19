
import * as financeRepository from "./finance.repository.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./finance.schemas.js";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

export async function createExpense(data: CreateExpenseInput, companyId: string) {
  const installments = data.installments ?? 1;
  const intervalDays = data.intervalDays ?? 30;

  if (installments > 1) {
    const installmentAmount = Number(data.amount) / installments;

    return prisma.$transaction(async (tx) => {
      const createdExpenses = [];
      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(data.dueDate);
        dueDate.setDate(dueDate.getDate() + (i * intervalDays));

        const expense = await tx.expense.create({
          data: {
            description: `${data.description} (${i + 1}/${installments})`,
            amount: installmentAmount,
            dueDate: dueDate,
            paidAt: data.paidAt ? new Date(data.paidAt) : null,
            status: data.status || "PENDING",
            category: data.category,
            isRecurring: data.isRecurring || false,
            company: { connect: { id: companyId } },
          },
        });
        createdExpenses.push(expense);
      }
      return createdExpenses;
    }, { timeout: 20000 });
  }

  return financeRepository.create({
    description: data.description,
    amount: data.amount,
    dueDate: new Date(data.dueDate),
    paidAt: data.paidAt ? new Date(data.paidAt) : null,
    status: data.status || "PENDING",
    category: data.category,
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
  if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.category !== undefined) updateData.category = data.category;
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

export async function getFinancialForecast(companyId: string, month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  // 1. Get Company details for Fixed Costs & Target Profit
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) throw new Error("Company not found");

  const monthlyFixedCost = Number(company.monthlyFixedCost);
  const targetProfitValue = Number(company.targetProfitValue); // Explicit field from Company model

  // 2. Get Pending Expenses for the month
  const pendingExpenses = await financeRepository.findPendingExpensesInMonth(
    companyId,
    targetMonth,
    targetYear
  );

  // Sum pending expenses
  const variableExpenses = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // 3. Calculate Totals
  const totalNeeds = monthlyFixedCost + variableExpenses; // Break-even (Fixed + Pending Debts)
  const targetRevenue = totalNeeds + targetProfitValue; // Goal (Break-even + Profit)

  // 4. Daily Breakdown
  // Calculate remaining days in the month (if current month) OR total days if future
  // If we are in the target month/year:
  const isCurrentMonth = targetMonth === (now.getMonth() + 1) && targetYear === now.getFullYear();
  
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  let remainingDays = daysInMonth;

  if (isCurrentMonth) {
    const currentDay = now.getDate();
    remainingDays = Math.max(1, daysInMonth - currentDay); // Avoid 0 or negative if at end of month
  }
  
  // If target is in the past, maybe daily target is irrelevant? 
  // But logic says "days remaining". If full month (future), it's daysInMonth.
  
  const dailyTarget = targetRevenue / remainingDays;

  return {
    summary: {
      fixedCost: monthlyFixedCost,
      variableExpenses: variableExpenses,
      totalDebts: totalNeeds, // As per prompt "Custo total" is implied as Needs? 
      // Prompt says: "totalDebts": 7500 which was 5000+2500. So yes.
      targetProfit: targetProfitValue,
    },
    targets: {
      breakEvenRevenue: totalNeeds,
      goalRevenue: targetRevenue,
      dailyTarget: Math.round(dailyTarget * 100) / 100, // Round to 2 decimals
    },
  };
}
