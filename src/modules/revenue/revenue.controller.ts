
import type { FastifyReply, FastifyRequest } from "fastify";
import * as revenueService from "./revenue.service.js";
import { createRevenueSchema, updateRevenueSchema, revenueIdParamSchema, revenueQuerySchema, revenueChartQuerySchema } from "./revenue.schemas.js";
import { z } from "zod";

export async function createRevenueHandler(
  request: FastifyRequest<{ Body: z.infer<typeof createRevenueSchema> }>,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const revenue = await revenueService.createRevenue(request.body, companyId);
  return reply.code(201).send(revenue);
}

export async function listRevenuesHandler(
  request: FastifyRequest<{ Querystring: z.infer<typeof revenueQuerySchema> }>,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const { year } = request.query;
  const revenues = await revenueService.listRevenues(companyId, year);
  return reply.send(revenues);
}

export async function updateRevenueHandler(
  request: FastifyRequest<{ Params: z.infer<typeof revenueIdParamSchema>; Body: z.infer<typeof updateRevenueSchema> }>,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const { id } = request.params;
  const revenue = await revenueService.updateRevenue(id, companyId, request.body);
  return reply.send(revenue);
}

export async function deleteRevenueHandler(
  request: FastifyRequest<{ Params: z.infer<typeof revenueIdParamSchema> }>,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const { id } = request.params;
  await revenueService.deleteRevenue(id, companyId);
  return reply.code(204).send();
}

export async function getCurrentMonthRevenueHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const revenue = await revenueService.getCurrentMonthRevenue(companyId);
  return reply.send(revenue);
}

export async function getRevenueChartHandler(
  request: FastifyRequest<{ Querystring: z.infer<typeof revenueChartQuerySchema> }>,
  reply: FastifyReply
) {
  const { companyId } = request.user as { companyId: string };
  const { startMonth, startYear, endMonth, endYear } = request.query;
  const chart = await revenueService.getRevenueChart(
    companyId,
    startMonth,
    startYear,
    endMonth,
    endYear
  );
  return reply.send(chart);
}
