import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as productsController from "./products.controller.js";
import { createProductSchema, updateProductSchema, productIdParamSchema, listProductsQuerySchema } from "./products.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export async function productsRoutes(app: FastifyInstance) {
  // Use ZodTypeProvider for this scope
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Apply fake auth middleware to all routes in this context
  server.addHook("preHandler", authMiddleware);

  server.post(
    "/",
    {
      schema: {
        body: createProductSchema,
      },
    },
    productsController.createProduct
  );

  server.get(
    "/", 
    {
      schema: {
        querystring: listProductsQuerySchema, 
      },
    },
    productsController.listProducts
  );

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
