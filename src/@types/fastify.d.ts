import "@fastify/jwt";

declare module "fastify" {
  export interface FastifyRequest {
    companyId: string; // Keeping for backward compatibility or ease of use
    user: {
      sub: string;
      userId: string; // Added alias for clarity
      companyId: string;
    }
  }
}
