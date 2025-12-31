
import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime(), // ISO 8601 string
  status: z.enum(["PENDING", "PAID"]).optional().default("PENDING"),
  isRecurring: z.boolean().optional().default(false),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseIdParamSchema = z.object({
  id: z.string().uuid("Invalid Expense ID"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
