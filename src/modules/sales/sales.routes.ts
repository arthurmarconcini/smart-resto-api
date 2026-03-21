import type { FastifyInstance } from "fastify";
import { createSaleHandler, listSalesHandler, updateSaleHandler, deleteSaleHandler, uploadAnotaAiHandler } from "./sales.controller.js";
import { createSaleSchema, updateSaleSchema, saleIdParamSchema } from "./sales.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function salesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.addHook("preHandler", authMiddleware);

  server.post(
    "/",
    {
      schema: {
        body: createSaleSchema,
      },
    },
    createSaleHandler
  );

  server.get(
    "/",
    {
      schema: {
        querystring: z.object({
          month: z.coerce.number().optional(),
          year: z.coerce.number().optional(),
        }),
      },
    },
    listSalesHandler
  );

  server.put(
    "/:id",
    {
      schema: {
        params: saleIdParamSchema,
        body: updateSaleSchema,
      },
    },
    updateSaleHandler
  );

  server.delete(
    "/:id",
    {
      schema: {
        params: saleIdParamSchema,
      },
    },
    deleteSaleHandler
  );

  // Upload de relatório Anota Aí (XLSX)
  server.post(
    "/upload-anota-ai",
    uploadAnotaAiHandler
  );
}
