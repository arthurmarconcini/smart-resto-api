
import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  desiredProfit: z.number().min(0, "Profit must be positive").max(100, "Profit cannot exceed 100%"), 
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
