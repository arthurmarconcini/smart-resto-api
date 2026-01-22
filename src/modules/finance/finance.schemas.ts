
import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.iso.datetime(),
  paidAt: z.iso.datetime().optional().nullable(),
  status: z.enum(["PENDING", "PAID"]).optional().default("PENDING"),
  category: z.enum(["FIXED", "VARIABLE", "DEBT", "INVESTMENT"]),
  isRecurring: z.boolean().optional().default(false),
  installments: z.number().min(1).optional().default(1),
  intervalDays: z.number().min(1).optional().default(30),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseIdParamSchema = z.object({
  id: z.uuid("Invalid Expense ID"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const payExpenseSchema = z.object({
  paidAt: z.iso.datetime().optional(),
});

export type PayExpenseInput = z.infer<typeof payExpenseSchema>;
