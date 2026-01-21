
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

  // 1. Busca detalhes da Empresa para Custos Fixos e Lucro Alvo
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) throw new Error("Company not found");

  const monthlyFixedCost = Number(company.monthlyFixedCost);
  const targetProfitValue = Number(company.targetProfitValue);

  // 2. Agrega TODAS as despesas (Pagas + Pendentes) para o mês
  const expenses = await financeRepository.findExpensesInMonth(
      companyId,
      targetMonth,
      targetYear
  );

  let detailedFixedCost = 0;
  let variableExpenses = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    if (expense.category === "FIXED") {
      detailedFixedCost += amount;
    } else {
      variableExpenses += amount;
    }
  }

  // 3. Calcula Totais
  const totalFixedCost = monthlyFixedCost + detailedFixedCost;
  const breakEvenRevenue = totalFixedCost + variableExpenses;
  const goalRevenue = totalFixedCost + variableExpenses + targetProfitValue;

  // 4. Detalhamento Diário
  const isCurrentMonth = targetMonth === (now.getMonth() + 1) && targetYear === now.getFullYear();
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  let remainingDays = daysInMonth;

  if (isCurrentMonth) {
    const currentDay = now.getDate();
    remainingDays = Math.max(1, daysInMonth - currentDay);
  }

  const dailyTarget = goalRevenue / remainingDays;

  return {
    breakDown: {
      genericFixedCost: Number(monthlyFixedCost),
      detailedFixedCost: Number(detailedFixedCost),
      totalFixedCost: Number(totalFixedCost),
      variableExpenses: Number(variableExpenses),
      targetProfit: Number(targetProfitValue)
    },
    targets: {
      breakEvenRevenue: Number(breakEvenRevenue),
      goalRevenue: Number(goalRevenue),
      dailyTarget: Number(dailyTarget)
    },
    // Mantendo summary para retrocompatibilidade se necessário, mas com valores corrigidos
    summary: {
      fixedCost: Number(totalFixedCost),
      variableExpenses: Number(variableExpenses),
      totalDebts: Number(breakEvenRevenue),
      targetProfit: Number(targetProfitValue)
    }
  };
}
