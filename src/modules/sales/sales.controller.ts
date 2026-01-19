import type { FastifyRequest, FastifyReply } from "fastify";
import * as salesService from "./sales.service.js";
import type { CreateSaleInput } from "./sales.schemas.js";

export async function createSaleHandler(
  request: FastifyRequest<{ Body: CreateSaleInput }>,
  reply: FastifyReply
) {
  // @ts-ignore - user é anexado pelo authMiddleware
  const { companyId } = request.user as { companyId: string };
  const sale = await salesService.createSale(request.body, companyId);
  return reply.status(201).send(sale);
}

export async function listSalesHandler(
  request: FastifyRequest<{ Querystring: { month?: number; year?: number } }>,
  reply: FastifyReply
) {
  // @ts-ignore - user é anexado pelo authMiddleware
  const { companyId } = request.user as { companyId: string };
  const { month, year } = request.query;
  const sales = await salesService.getSales(companyId, month, year);
  return reply.send(sales);
}
