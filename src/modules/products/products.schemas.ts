
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  salePrice: z.number().min(0, "Sales price must be positive").optional(),
  markup: z.number().optional(),
  unit: z.string().min(1, "Unit is required"), // e.g., 'kg', 'un', 'l'
  categoryId: z.uuid("Invalid Category ID"),
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  markup: z.number().optional(),
  unit: z.string().optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.uuid().optional(),
});

export const productIdParamSchema = z.object({
  id: z.uuid("Invalid Product ID"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
