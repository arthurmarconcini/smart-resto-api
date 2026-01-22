
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation Error",
      issues: z.treeifyError(error),
    });
  }

  // Fastify Schema Validation Error
  if (error.validation) {
     return reply.status(400).send({
      message: "Validation Error",
      issues: error.validation,
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message,
    });
  }

  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.status(401).send({ error: "Unauthorized: Invalid or missing token" })
  }

  console.error(error);

  return reply.status(500).send({
    message: "Internal Server Error",
  });
}
