
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as categoriesController from "./categories.controller";
import { createCategorySchema } from "./categories.schemas";

export async function categoriesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/",
    {
      schema: {
        body: createCategorySchema,
      },
    },
    categoriesController.createCategory
  );

  server.get("/", categoriesController.listCategories);
}
