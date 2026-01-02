
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as authController from "./auth.controller.js";
import { signUpSchema, signInSchema, getMeResponseSchema } from "./auth.schemas.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/sign-up",
    {
      schema: {
        body: signUpSchema,
      },
    },
    authController.signUp
  );

  server.post(
    "/sign-in",
    {
      schema: {
        body: signInSchema,
      },
    },
    authController.signIn
  );

  server.get(
    "/me",
    {
      preHandler: [authMiddleware],
      schema: {
        response: {
          200: getMeResponseSchema,
        },
      },
    },
    authController.getMe
  );
}
