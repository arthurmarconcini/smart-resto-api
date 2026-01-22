
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as financeController from "./finance.controller.js";
import { createExpenseSchema, updateExpenseSchema, expenseIdParamSchema } from "./finance.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { z } from "zod";

export async function financeRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.addHook("preHandler", authMiddleware);

  server.post(
    "/expenses",
    {
      schema: {
        body: createExpenseSchema,
      },
    },
    financeController.createExpense
  );

  server.get(
    "/forecast",
    {
      schema: {
        querystring: z.object({
          month: z.coerce.number().optional(),
          year: z.coerce.number().optional(),
        }),
      },
    },
    financeController.getFinancialForecast
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

  server.patch(
    "/expenses/:id/pay",
    {
        schema: {
            params: expenseIdParamSchema,
            body: z.object({
                paidAt: z.iso.datetime().optional()
            })
        }
    },
    financeController.payExpense
  );
}
