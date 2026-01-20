
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as companiesController from "./company.controller.js";
import { createCompanySchema } from "./company.schemas.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { z } from "zod";

export async function companiesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Rota existente: POST /
  
  server.post(
    "/",
    {
      schema: {
        body: createCompanySchema,
      },
    },
    companiesController.createCompany
  );

  // Rotas autenticadas
  server.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", authMiddleware);

    protectedRoutes.put(
      "/settings",
      {
        schema: {
          body: z.object({
            monthlyFixedCost: z.number().min(0).optional(),
            defaultTaxRate: z.number().min(0).max(100).optional(),
            defaultCardFee: z.number().min(0).max(100).optional(),
            desiredProfit: z.number().min(0).max(1000).optional(), // Margem por produto
            targetProfitValue: z.number().min(0).optional(), // Meta mensal
          }),
          response: {
            200: z.object({
              id: z.string(),
              name: z.string(),
              // Campos monetários/percentuais retornados como números padrão para o Frontend
              monthlyFixedCost: z.number(),
              defaultTaxRate: z.number(),
              defaultCardFee: z.number(),
              desiredProfit: z.number(),
              targetProfitValue: z.number(),
              isConfigured: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          },
        },
      },
      companiesController.updateSettings
    );

    protectedRoutes.get(
      "/settings",
      {
        schema: {
          response: {
            200: z.object({
              id: z.string(),
              name: z.string(),
              monthlyFixedCost: z.number(),
              defaultTaxRate: z.number(),
              defaultCardFee: z.number(),
              desiredProfit: z.number(),
              targetProfitValue: z.number(),
              isConfigured: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          },
        },
      },
      companiesController.getSettings
    );

    protectedRoutes.get("/targets", companiesController.getSalesTarget);
  });
}
