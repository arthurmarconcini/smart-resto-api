
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as financeController from "./finance.controller.js";
import { createExpenseSchema, updateExpenseSchema, expenseIdParamSchema } from "./finance.schemas.js";
import { fakeAuthMiddleware } from "../../middlewares/fakeAuth.js";

export async function financeRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.addHook("preHandler", fakeAuthMiddleware);

  server.post(
    "/expenses",
    {
      schema: {
        body: createExpenseSchema,
      },
    },
    financeController.createExpense
  );

  server.get("/expenses", financeController.listExpenses);

  server.put(
    "/expenses/:id",
    {
        schema: {
            params: expenseIdParamSchema,
            body: updateExpenseSchema
        }
    },
    financeController.updateExpense
  );

  server.delete(
    "/expenses/:id",
    {
        schema: {
            params: expenseIdParamSchema
        }
    },
    financeController.deleteExpense
  );
}
