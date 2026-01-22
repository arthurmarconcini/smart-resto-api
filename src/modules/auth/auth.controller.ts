
import type { FastifyReply, FastifyRequest } from "fastify";
import * as authService from "./auth.service.js";
import type { SignUpInput, SignInInput } from "./auth.schemas.js";
import { AppError } from "../../errors/AppError.js";

export async function signUp(req: FastifyRequest<{ Body: SignUpInput }>, reply: FastifyReply) {
  try {
    const { user, company } = await authService.signUp(req.body);
    
    return reply.code(201).send({
      message: "User and Company created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      company: {
        id: company.id,
        name: company.name,
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
        throw new AppError("User already exists", 409);
    }
    throw error;
  }
}

export async function signIn(req: FastifyRequest<{ Body: SignInInput }>, reply: FastifyReply) {
  try {
    const user = await authService.signIn(req.body);

    const token = await reply.jwtSign({
      sub: user.id,
      companyId: user.companyId,
    });

    return reply.send({ 
      token,
      user: user
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Invalid credentials") {
        throw new AppError("Invalid credentials", 401);
    }
    throw error;
  }
}

export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = req.user as { sub: string };
    const userId = user.sub;
    const result = await authService.getMe(userId);
    return reply.send(result);
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
        throw new AppError("User not found", 404);
    }
    throw error;
  }
}
