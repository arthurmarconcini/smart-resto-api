import type { FastifyRequest, FastifyReply } from "fastify";

export async function fakeAuthMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await req.jwtVerify<{ companyId: string }>();
    
    // Populate request with user info for strict typing usage if needed
    // The @fastify/jwt plugin automatically populates req.user
    
    // We also set req.companyId to maintain compatibility with existing controllers
    req.companyId = payload.companyId;

  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized: Invalid or missing token" });
  }
}
