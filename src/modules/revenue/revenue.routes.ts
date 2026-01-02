
import type { FastifyInstance } from "fastify";
import { createRevenueHandler, listRevenuesHandler, updateRevenueHandler, deleteRevenueHandler } from "./revenue.controller.js";
import { createRevenueSchema, updateRevenueSchema, revenueQuerySchema, revenueIdParamSchema } from "./revenue.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export async function revenueRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();
  
  server.addHook("preHandler", authMiddleware);

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
