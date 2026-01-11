
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as companiesController from "./company.controller.js";
import { createCompanySchema } from "./company.schemas.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { z } from "zod";

export async function companiesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Public wrapper for create company? Or require auth? 
  // Usually createCompany is public for signup, but we have auth/signup.
  // Existing route: POST /
  // If we want to secure "targets" and "settings", we must use middleware.

  server.post(
    "/",
    {
      schema: {
        body: createCompanySchema,
      },
    },
    companiesController.createCompany
  );

  // Authenticated routes
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
            desiredProfit: z.number().min(0).max(1000).optional(), // Margin per product
            targetProfitValue: z.number().min(0).optional(), // Monthly target
          }),
          response: {
            200: z.object({
              id: z.string(),
              name: z.string(),
              // Monetary/Percent fields returned as standard Numbers for Frontend
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

    protectedRoutes.get("/targets", companiesController.getSalesTarget);
  });
}
