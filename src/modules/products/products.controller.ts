
import type { FastifyReply, FastifyRequest } from "fastify";
import * as productsService from "./products.service";
import type { CreateProductInput, UpdateProductInput } from "./products.schemas";

export async function createProduct(req: FastifyRequest<{ Body: CreateProductInput }>, reply: FastifyReply) {
  try {
    const { name, description, costPrice, companyId, categoryId } = req.body;
    
    // Map flat input to nested Prisma connect structure
    const product = await productsService.createProduct({
        name,
        description: description || null, // Convert undefined to null for Prisma
        costPrice,
        salesPrice: 0, 
        company: { connect: { id: companyId } },
        category: { connect: { id: categoryId } }
    });
    return reply.code(201).send(product);
  } catch (error) {
     console.error(error);
    return reply.code(500).send({ error: "Failed to create product" });
  }
}

export async function getProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    const product = await productsService.getProduct(id);
    return reply.send(product);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(500).send({ error: "Failed to fetch product" });
  }
}

export async function listProducts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await productsService.listProducts();
    return reply.send(products);
  } catch (error) {
    return reply.code(500).send({ error: "Failed to list products" });
  }
}

export async function updateProduct(req: FastifyRequest<{ Params: { id: string }, Body: UpdateProductInput }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    // Strip undefined values to avoid "exactOptionalPropertyTypes" issues or manually map
    const updateData: any = { ...req.body };
    // Handle specific fields if necessary, or just pass as any if types are compatible enough with relaxed checking
    // Prisma UpdateInput allows 'string | null' for nullable fields, 'string' for required.
    // Zod 'string().optional()' gives 'string | undefined'.
    // We need to ensure we don't pass 'undefined' if Prisma expects something else or strict mode is on.
    
    const product = await productsService.updateProduct(id, updateData);
    return reply.send(product);
  } catch (error: any) {
      if (error.message.includes("not found")) {
      return reply.code(404). send({ error: error.message });
    }
    return reply.code(500).send({ error: "Failed to update product" });
  }
}

export async function deleteProduct(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    await productsService.deleteProduct(id);
    return reply.code(204).send();
  } catch (error: any) {
      if (error.message.includes("not found")) {
      return reply.code(404).send({ error: error.message });
    }
    return reply.code(500).send({ error: "Failed to delete product" });
  }
}
