
import type { FastifyReply, FastifyRequest } from "fastify";
import * as categoriesService from "./categories.service";
import type { CreateCategoryInput } from "./categories.schemas";

export async function createCategory(req: FastifyRequest<{ Body: CreateCategoryInput }>, reply: FastifyReply) {
  try {
    const category = await categoriesService.createCategory(req.body);
    return reply.code(201).send(category);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to create category" });
  }
}

export async function listCategories(req: FastifyRequest, reply: FastifyReply) {
    try {
        const categories = await categoriesService.listCategories();
        return reply.send(categories);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to list categories" });
    }
}
