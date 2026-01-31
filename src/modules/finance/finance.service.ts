
import * as financeRepository from "./finance.repository.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./finance.schemas.js";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

interface EmployeeBreakdownItem {
  id: string;
  name: string;
  role: string;
  workedDays: number;
  dailyRate: number;
  monthlyCost: number;
}

interface FixedCostsBreakdown {
  manualCosts: number;
  employeeCosts: number;
  employees: EmployeeBreakdownItem[];
}

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

export async function payExpense(id: string, companyId: string, paidAt?: string) {
  const expense = await financeRepository.findById(id, companyId);
  if (!expense) throw new Error("Expense not found");

  return financeRepository.update(id, companyId, {
    status: "PAID",
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });
}

export async function getMonthlyExpenses(companyId: string, month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  
  return financeRepository.sumUnpaidExpenses(companyId, targetMonth, targetYear);
}

async function calculateTotalFixedCosts(
  companyId: string,
  manualEmployeeCostEnabled: boolean,
  monthlyFixedCost: number
): Promise<{ total: number; breakdown: FixedCostsBreakdown }> {
  let employeeCostsTotal = 0;
  let employees: EmployeeBreakdownItem[] = [];

  // Custo fixo base é SEMPRE incluído
  const baseCost = monthlyFixedCost;

  // Se modo manual ativado, ADICIONA os custos de funcionários
  if (manualEmployeeCostEnabled) {
    const employeeCostRecords = await financeRepository.getEmployeeCostsByCompany(companyId);
    
    employees = employeeCostRecords.map(emp => {
      const dailyRate = Number(emp.dailyRate);
      const monthlyCost = dailyRate * emp.workedDays;
      
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        workedDays: emp.workedDays,
        dailyRate: dailyRate,
        monthlyCost: monthlyCost
      };
    });

    employeeCostsTotal = employees.reduce((sum, emp) => sum + emp.monthlyCost, 0);
  }

  return {
    total: baseCost + employeeCostsTotal,
    breakdown: {
      manualCosts: baseCost,
      employeeCosts: employeeCostsTotal,
      employees
    }
  };
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

  // 2. Calcula custos fixos com breakdown detalhado
  const fixedCostsData = await calculateTotalFixedCosts(
    companyId,
    company.manualEmployeeCostEnabled,
    monthlyFixedCost
  );

  // 3. Agrega TODAS as despesas (Pagas + Pendentes) para o mês
  const expenses = await financeRepository.findExpensesInMonth(
      companyId,
      targetMonth,
      targetYear
  );

  let detailedFixedCost = 0;
  let variableExpenses = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);

    if (expense.category === "FIXED" && expense.status === "PAID") {
      detailedFixedCost += amount;
    } else {
      variableExpenses += amount;
    }
  }

  // 4. Calcula Totais
  const totalEmployeeCost = fixedCostsData.breakdown.employeeCosts;
  const totalFixedCost = fixedCostsData.total + detailedFixedCost;
  const breakEvenRevenue = totalFixedCost + variableExpenses;
  const goalRevenue = totalFixedCost + variableExpenses + targetProfitValue;

  // 5. Detalhamento Diário
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
      genericFixedCost: fixedCostsData.breakdown.manualCosts,
      detailedFixedCost: Number(detailedFixedCost),
      totalEmployeeCost: Number(totalEmployeeCost),
      totalFixedCost: Number(totalFixedCost),
      variableExpenses: Number(variableExpenses),
      targetProfit: Number(targetProfitValue)
    },
   
    fixedCostsBreakdown: fixedCostsData.breakdown,
    targets: {
      breakEvenRevenue: Number(breakEvenRevenue),
      goalRevenue: Number(goalRevenue),
      dailyTarget: Number(dailyTarget)
    },
   
    summary: {
      fixedCost: Number(totalFixedCost),
      variableExpenses: Number(variableExpenses),
      totalDebts: Number(breakEvenRevenue),
      targetProfit: Number(targetProfitValue)
    }
  };
}
