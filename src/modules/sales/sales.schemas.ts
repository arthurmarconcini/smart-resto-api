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
