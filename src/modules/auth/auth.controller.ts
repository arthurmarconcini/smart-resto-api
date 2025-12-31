
import type { FastifyReply, FastifyRequest } from "fastify";
import * as authService from "./auth.service.js";
import type { SignUpInput, SignInInput } from "./auth.schemas.js";

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
  } catch (error: any) {
    if (error.message === "User already exists") {
      return reply.code(409).send({ error: error.message });
    }
    console.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
}

export async function signIn(req: FastifyRequest<{ Body: SignInInput }>, reply: FastifyReply) {
  try {
    const user = await authService.signIn(req.body);

    const token = await reply.jwtSign({
      sub: user.id,
      companyId: user.companyId,
    });

    return reply.send({ token });
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return reply.code(401).send({ error: error.message });
    }
    console.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
}
