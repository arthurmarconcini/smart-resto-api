
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyId: z.string().uuid("Invalid Company ID"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
