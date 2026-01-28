
import type { FastifyInstance } from "fastify";
import { createRevenueHandler, listRevenuesHandler, updateRevenueHandler, deleteRevenueHandler, getCurrentMonthRevenueHandler, getRevenueChartHandler } from "./revenue.controller.js";
import { createRevenueSchema, updateRevenueSchema, revenueQuerySchema, revenueIdParamSchema, revenueChartQuerySchema } from "./revenue.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export async function revenueRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  
  server.addHook("preHandler", authMiddleware);

  // Rotas específicas primeiro (antes das rotas com parâmetros)
  server.get(
    "/current-month",
    {},
    getCurrentMonthRevenueHandler
  );

  server.get(
    "/chart",
    {
      schema: {
        querystring: revenueChartQuerySchema,
      },
    },
    getRevenueChartHandler
  );

  server.post(
    "/",
    {
      schema: {
        body: createRevenueSchema,
      },
    },
    createRevenueHandler
  );

  server.get(
    "/",
    {
      schema: {
        querystring: revenueQuerySchema,
      },
    },
    listRevenuesHandler
  );

  server.patch(
    "/:id",
    {
      schema: {
        params: revenueIdParamSchema,
        body: updateRevenueSchema,
      },
    },
    updateRevenueHandler
  );

  server.delete(
    "/:id",
    {
       schema: {
        params: revenueIdParamSchema,
       }
    },
    deleteRevenueHandler
  );
}
