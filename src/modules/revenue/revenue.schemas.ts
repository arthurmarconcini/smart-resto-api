
import { z } from "zod";

export const createRevenueSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  totalRevenue: z.number().positive(),
});

export const updateRevenueSchema = createRevenueSchema.partial();

export const revenueIdParamSchema = z.object({
  id: z.string().uuid("Invalid Revenue ID"),
});

export const revenueQuerySchema = z.object({
  year: z.coerce.number().optional(),
});

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;
export type UpdateRevenueInput = z.infer<typeof updateRevenueSchema>;
