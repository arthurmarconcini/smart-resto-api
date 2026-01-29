
import { z } from "zod";

export const createEmployeeCostSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  workedDays: z.number().int().positive("Dias trabalhados deve ser um inteiro positivo"),
  dailyRate: z.number().positive("Valor da diária deve ser positivo"),
});

export const updateEmployeeCostSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  workedDays: z.number().int().positive().optional(),
  dailyRate: z.number().positive().optional(),
});

export type CreateEmployeeCostInput = z.infer<typeof createEmployeeCostSchema>;
export type UpdateEmployeeCostInput = z.infer<typeof updateEmployeeCostSchema>;
