
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as companiesController from "./company.controller.js";
import { createCompanySchema } from "./company.schemas.js";

export async function companiesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/",
    {
      schema: {
        body: createCompanySchema,
      },
    },
    companiesController.createCompany
  );
}
