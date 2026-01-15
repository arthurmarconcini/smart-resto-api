
import type { FastifyRequest, FastifyReply } from "fastify";
import * as financeService from "./finance.service.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./finance.schemas.js";

export async function createExpense(req: FastifyRequest<{ Body: CreateExpenseInput }>, reply: FastifyReply) {
  try {
    const expense = await financeService.createExpense(req.body, req.companyId!);
    return reply.code(201).send(expense);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        return reply.code(500).send({ error: error.message, stack: error.stack });
    }
    return reply.code(500).send({ error: "Failed to create expense", details: error });
  }
}

export async function listExpenses(req: FastifyRequest, reply: FastifyReply) {
  try {
    const expenses = await financeService.listExpenses(req.companyId!);
    return reply.send(expenses);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to list expenses" });
  }
}

export async function updateExpense(req: FastifyRequest<{ Params: { id: string }; Body: UpdateExpenseInput }>, reply: FastifyReply) {
    try {
        const expense = await financeService.updateExpense(req.params.id, req.companyId!, req.body);
        return reply.send(expense);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to update expense" });
    }
}

export async function deleteExpense(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        await financeService.deleteExpense(req.params.id, req.companyId!);
        return reply.code(204).send();
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to delete expense" });
    }
}

export async function getFinancialForecast(req: FastifyRequest<{ Querystring: { month?: number; year?: number } }>, reply: FastifyReply) {
    try {
        const { month, year } = req.query;
        const forecast = await financeService.getFinancialForecast(req.companyId!, month, year);
        return reply.send(forecast);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to get financial forecast" });
    }
}
