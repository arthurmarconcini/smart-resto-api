
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
                    monthlyFixedCost: z.number().optional(),
                    defaultTaxRate: z.number().optional(),
                    defaultCardFee: z.number().optional(),
                    desiredProfit: z.number().optional(),
                    targetProfitValue: z.number().optional(),
                })
            }
        },
        companiesController.updateSettings
    );

    protectedRoutes.get("/targets", companiesController.getSalesTarget);
  });
}
