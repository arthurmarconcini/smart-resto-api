import { z } from "zod";
import { SaleType } from "@prisma/client";

export const createSaleSchema = z.object({
  date: z.iso.datetime(),
  type: z.enum(SaleType),
  totalAmount: z.number().optional(),
  items: z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().min(0.01)
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.type === SaleType.DAILY_TOTAL) {
    if (data.totalAmount === undefined || data.totalAmount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Total amount is required and must be positive for DAILY_TOTAL sales",
        path: ["totalAmount"],
      });
    }
  }

  if (data.type === SaleType.ITEMIZED) {
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one item is required for ITEMIZED sales",
        path: ["items"],
      });
    }
  }
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const updateSaleSchema = z.object({
  date: z.iso.datetime().optional(),
  type: z.enum(SaleType).optional(),
  totalAmount: z.number().positive().optional(),
  items: z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().min(0.01),
  })).optional(),
  orderNumber: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  cardBrand: z.string().optional().nullable(),
  deliveryType: z.string().optional().nullable(),
  freightValue: z.number().min(0).optional().nullable(),
  subtotal: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).optional().nullable(),
});

export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;

export const saleIdParamSchema = z.object({
  id: z.uuid("Invalid Sale ID"),
});

// Schema para validação de cada linha do XLSX do Anota Aí
export const anotaAiRowSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório"),
  origin: z.string().min(1, "Origem é obrigatória"),
  paymentMethod: z.string().min(1, "Condição de pagamento é obrigatória"),
  cardBrand: z.string().optional().default(""),
  deliveryType: z.string().min(1, "Tipo de retirada é obrigatório"),
  discount: z.number().min(0).default(0),
  freightValue: z.number().min(0).default(0),
  subtotal: z.number().min(0, "Subtotal deve ser maior ou igual a zero"),
  totalAmount: z.number().min(0, "Valor total deve ser maior ou igual a zero"),
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA"),
  deliveryPerson: z.string().optional().default(""),
  status: z.string().min(1, "Status é obrigatório"),
});

export type AnotaAiRow = z.infer<typeof anotaAiRowSchema>;

// Colunas esperadas no XLSX do Anota Aí (posição fixa)
export const ANOTA_AI_COLUMNS = [
  "Número do Pedido",
  "Origem",
  "Condição de pagamento",
  "Cartão Utilizado",
  "Retirada",
  "Descontos",
  "Valor do frete",
  "Subtotal",
  "Valor total",
  "Data",
  "Entregador",
  "Status",
] as const;

// Status que devem ser ignorados no processamento
export const IGNORED_STATUSES = ["Cancelado", "Pedido online expirado"] as const;
