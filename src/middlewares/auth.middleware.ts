
import type { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await req.jwtVerify<{ sub: string; companyId: string }>();
    
    // Enrich req.user with explicit properties as requested
    req.user = {
      sub: payload.sub,
      userId: payload.sub,
      companyId: payload.companyId
    };

    // Maintain backward compatibility for now if some controllers rely on req.companyId directly
    req.companyId = payload.companyId;

  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized: Invalid or missing token" });
  }
}
