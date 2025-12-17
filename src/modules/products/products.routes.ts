
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as productsController from "./products.controller";
import { createProductSchema, updateProductSchema, productIdParamSchema } from "./products.schemas";

export async function productsRoutes(app: FastifyInstance) {
  // Use ZodTypeProvider for this scope
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/",
    {
      schema: {
        body: createProductSchema,
      },
    },
    productsController.createProduct
  );

  server.get("/", productsController.listProducts);

  server.get(
    "/:id",
    {
      schema: {
        params: productIdParamSchema,
      },
    },
    productsController.getProduct
  );

  server.put(
    "/:id",
    {
      schema: {
        params: productIdParamSchema,
        body: updateProductSchema,
      },
    },
    productsController.updateProduct
  );

  server.delete(
    "/:id",
    {
      schema: {
        params: productIdParamSchema,
      },
    },
    productsController.deleteProduct
  );
}
