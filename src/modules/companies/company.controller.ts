
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as companiesService from './company.service';
import type { CreateCompanyInput } from './company.schemas';

export async function createCompany(req: FastifyRequest<{ Body: CreateCompanyInput }>, reply: FastifyReply) {
  try {
    const company = await companiesService.createCompany(req.body);
    return reply.code(201).send(company);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to create company" });
  }
}
