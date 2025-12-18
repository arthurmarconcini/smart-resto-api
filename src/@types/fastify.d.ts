import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    companyId: string;
  }
}
