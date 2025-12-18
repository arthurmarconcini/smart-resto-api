import type { FastifyRequest, FastifyReply } from "fastify";

export async function fakeAuthMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const companyId = req.headers["x-company-id"] as string;

  if (!companyId) {
    return reply.code(400).send({ error: "Missing x-company-id header" });
  }

  req.companyId = companyId;
}
