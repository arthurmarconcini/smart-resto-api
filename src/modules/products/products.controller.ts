import type { FastifyReply, FastifyRequest } from "fastify";
import * as productsService from "./products.service.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.schemas.js";

export async function createProduct(req: FastifyRequest<{ Body: CreateProductInput }>, reply: FastifyReply) {
  try {
    const { companyId } = req;
    const product = await productsService.createProduct(req.body, companyId);
    return reply.code(201).send(product);
  } catch (error) {
     console.error(error);
    return reply.code(500).send({ error: "Failed to create product" });
  }
}

export async function getProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    const { companyId } = req;
    const product = await productsService.getProduct(id, companyId);
    return reply.send(product);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(500).send({ error: "Failed to fetch product" });
  }
}

export async function listProducts(req: FastifyRequest<{ Querystring: ListProductsQuery }>, reply: FastifyReply) {
  try {
    const { companyId } = req;
    const products = await productsService.listProducts(companyId, req.query);
    return reply.send(products);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Failed to list products" });
  }
}

export async function updateProduct(req: FastifyRequest<{ Params: { id: string }, Body: UpdateProductInput }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    const { companyId } = req;
    
    const product = await productsService.updateProduct(id, companyId, req.body);
    return reply.send(product);
  } catch (error: any) {
      if (error.message.includes("not found")) {
      return reply.code(404).send({ error: error.message });
    }
    console.error(error);
    return reply.code(500).send({ error: "Failed to update product" });
  }
}

export async function deleteProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    const { companyId } = req;
    await productsService.deleteProduct(id, companyId);
    return reply.code(204).send();
  } catch (error: any) {
      if (error.message.includes("not found")) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(500).send({ error: "Failed to delete product" });
  }
}
