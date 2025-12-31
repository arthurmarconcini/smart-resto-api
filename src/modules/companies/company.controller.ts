
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as companiesService from './company.service.js';
import type { CreateCompanyInput } from './company.schemas.js';

export async function createCompany(req: FastifyRequest<{ Body: CreateCompanyInput }>, reply: FastifyReply) {
  try {
    const company = await companiesService.createCompany(req.body);
    return reply.code(201).send(company);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to create company" });
  }
}

export async function getSalesTarget(req: FastifyRequest, reply: FastifyReply) {
  try {
    const target = await companiesService.calculateSalesTarget(req.companyId!);
    return reply.send(target);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to calculate sales target" });
  }
}

export async function updateSettings(req: FastifyRequest<{ Body: { monthlyFixedCost?: number; defaultTaxRate?: number; defaultCardFee?: number; desiredProfit?: number; targetProfitValue?: number } }>, reply: FastifyReply) {
    try {
        const company = await companiesService.updateCompanySettings(req.companyId!, req.body);
        return reply.send(company);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to update company settings" });
    }
}


