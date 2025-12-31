
import type { FastifyReply, FastifyRequest } from "fastify";
import * as categoriesService from "./categories.service.js";
import type { CreateCategoryInput, UpdateCategoryInput, listCategoriesQuery } from "./categories.schemas.js";

export async function createCategory(req: FastifyRequest<{ Body: CreateCategoryInput }>, reply: FastifyReply) {
  try {
    const category = await categoriesService.createCategory({
        ...req.body,
        companyId: req.companyId!, // Injected by fakeAuth
    });
    return reply.code(201).send(category);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to create category" });
  }
}

export async function listCategories(req: FastifyRequest<{ Querystring: listCategoriesQuery }>, reply: FastifyReply) {
    try {
        const categories = await categoriesService.listCategories(req.companyId!, req.query);
        return reply.send(categories);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to list categories" });
    }
}

export async function getCategory(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const category = await categoriesService.getCategory(req.params.id, req.companyId!);
        return reply.send(category);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to get category" });
    }
}

export async function updateCategory(req: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryInput }>, reply: FastifyReply) {
    try {
        const category = await categoriesService.updateCategory(req.params.id, req.companyId!, req.body);
        return reply.send(category);
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to update category" });
    }
}

export async function deleteCategory(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        await categoriesService.deleteCategory(req.params.id, req.companyId!);
        return reply.code(204).send();
    } catch (error) {
        console.error(error);
        return reply.code(500).send({ error: "Failed to delete category" });
    }
}
