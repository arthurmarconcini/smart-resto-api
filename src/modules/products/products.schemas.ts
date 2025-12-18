
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  salesPrice: z.number().min(0, "Sales price must be positive").optional(),
  markup: z.number().optional(),
  categoryId: z.string().uuid("Invalid Category ID"),
}).refine(data => data.salesPrice !== undefined || data.markup !== undefined, {
    message: "Either salesPrice or markup must be provided",
    path: ["salesPrice", "markup"],
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  salesPrice: z.number().min(0).optional(),
  markup: z.number().optional(),
});

export const listProductsQuerySchema = z.object({
  name: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid Product ID"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
