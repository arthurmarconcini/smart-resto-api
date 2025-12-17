
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  companyId: z.string().uuid("Invalid Company ID"),
  categoryId: z.string().uuid("Invalid Category ID"),
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  salesPrice: z.number().min(0).optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid Product ID"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
