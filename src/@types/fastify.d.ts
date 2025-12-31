import "@fastify/jwt";

declare module "fastify" {
  export interface FastifyRequest {
    companyId: string; // Keeping for backward compatibility or ease of use
    user: {
      sub: string;
      companyId: string;
    }
  }
}
