
import type { FastifyReply, FastifyRequest } from "fastify";
import * as employeeCostService from "./employee-cost.service.js";
import { createEmployeeCostSchema, updateEmployeeCostSchema } from "./employee-cost.schemas.js";
import { z } from "zod";

export async function create(
  request: FastifyRequest<{ Params: { companyId: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const { companyId } = request.params;
  const body = createEmployeeCostSchema.parse(request.body);

  const employeeCost = await employeeCostService.createEmployeeCost(body, companyId);
  
  return reply.status(201).send({
    ...employeeCost,
    dailyRate: Number(employeeCost.dailyRate),
    monthlyTotal: Number(employeeCost.dailyRate) * employeeCost.workedDays
  });
}

export async function update(
  request: FastifyRequest<{ Params: { companyId: string; id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = updateEmployeeCostSchema.parse(request.body);

  const employeeCost = await employeeCostService.updateEmployeeCost(id, body);

  return reply.send({
    ...employeeCost,
    dailyRate: Number(employeeCost.dailyRate),
    monthlyTotal: Number(employeeCost.dailyRate) * employeeCost.workedDays
  });
}

export async function remove(
  request: FastifyRequest<{ Params: { companyId: string; id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  await employeeCostService.deleteEmployeeCost(id);
  return reply.status(204).send();
}

export async function list(
  request: FastifyRequest<{ Params: { companyId: string } }>,
  reply: FastifyReply
) {
  const { companyId } = request.params;
  const costs = await employeeCostService.listEmployeeCosts(companyId);
  return reply.send(costs);
}
