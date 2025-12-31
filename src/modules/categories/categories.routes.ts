
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as categoriesController from "./categories.controller.js";
import { createCategorySchema, listCategoriesQuerySchema, categoryIdParamSchema, updateCategorySchema } from "./categories.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export async function categoriesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Apply fake auth middleware
  server.addHook("preHandler", authMiddleware);

  server.post(
    "/",
    {
      schema: {
        body: createCategorySchema,
      },
    },
    categoriesController.createCategory
  );

  server.get(
    "/",
    {
        schema: {
            querystring: listCategoriesQuerySchema
        }
    },
    categoriesController.listCategories
  );

  server.get(
    "/:id",
    {
      schema: {
        params: categoryIdParamSchema,
      },
    },
    categoriesController.getCategory
  );

  server.put(
    "/:id",
    {
      schema: {
        params: categoryIdParamSchema,
        body: updateCategorySchema,
      },
    },
    categoriesController.updateCategory
  );

  server.delete(
    "/:id",
    {
      schema: {
        params: categoryIdParamSchema,
      },
    },
    categoriesController.deleteCategory
  );
}
