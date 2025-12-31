
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import * as authController from "./auth.controller.js";
import { signUpSchema, signInSchema } from "./auth.schemas.js";

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/signup",
    {
      schema: {
        body: signUpSchema,
      },
    },
    authController.signUp
  );

  server.post(
    "/signin",
    {
      schema: {
        body: signInSchema,
      },
    },
    authController.signIn
  );
}
