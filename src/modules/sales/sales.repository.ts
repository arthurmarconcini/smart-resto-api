import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../errors/AppError.js";
import type { CreateSaleInput } from "./sales.schemas.js";
import { Prisma } from "@prisma/client";

export async function createItemizedSale(
  data: CreateSaleInput,
  companyId: string,
) {
  return await prisma.$transaction(async (tx) => {
    if (!data.items || data.items.length === 0) {
      throw new AppError("Items are required for detailed sales");
    }

    let calculatedTotal = 0;
    const saleItemsCreateData = [];

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId, companyId },
      });

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`);
      }

      if (product.stock.toNumber() < item.quantity) {
        throw new AppError(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      // Decrementar estoque
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      // Usar preço atual do banco de dados
      const unitPrice = product.salePrice.toNumber();
      const subTotal = item.quantity * unitPrice;
      calculatedTotal += subTotal;

      saleItemsCreateData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subTotal: subTotal,
      });
    }

    const sale = await tx.sale.create({
      data: {
        companyId,
        date: data.date,
        totalAmount: calculatedTotal,
        type: "ITEMIZED",
        items: {
          create: saleItemsCreateData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Atualizar MonthlyRevenue automaticamente
    const saleDate = new Date(sale.date);
    const month = saleDate.getMonth() + 1;
    const year = saleDate.getFullYear();

    await tx.monthlyRevenue.upsert({
      where: {
        month_year_companyId: { month, year, companyId },
      },
      create: {
        month,
        year,
        companyId,
        totalRevenue: sale.totalAmount,
      },
      update: {
        totalRevenue: {
          increment: sale.totalAmount,
        },
      },
    });

    return sale;
  });
}

export async function createDailyTotalSale(
  data: CreateSaleInput,
  companyId: string,
) {
  return await prisma.$transaction(async (tx) => {
    // Lógica dentro da transação para consistência com venda itemizada

    if (!data.totalAmount || data.totalAmount <= 0) {
      throw new AppError(
        "Total amount is required and must be positive for daily total sales",
      );
    }

    const sale = await tx.sale.create({
      data: {
        companyId,
        date: data.date,
        totalAmount: data.totalAmount,
        type: "DAILY_TOTAL",
      },
      include: {
        items: true,
      },
    });

    // Atualizar MonthlyRevenue automaticamente
    const saleDate = new Date(sale.date);
    const month = saleDate.getMonth() + 1;
    const year = saleDate.getFullYear();

    await tx.monthlyRevenue.upsert({
      where: {
        month_year_companyId: { month, year, companyId },
      },
      create: {
        month,
        year,
        companyId,
        totalRevenue: sale.totalAmount,
      },
      update: {
        totalRevenue: {
          increment: sale.totalAmount,
        },
      },
    });

    return sale;
  });
}

export async function findAll(
  companyId: string,
  month?: number,
  year?: number,
) {
  const where: Prisma.SaleWhereInput = {
    companyId,
  };

  if (month && year) {
    // Construir intervalo de data
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último dia do mês
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  return await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function findByOrderNumber(orderNumber: string, companyId: string) {
  return await prisma.sale.findUnique({
    where: {
      orderNumber_companyId: { orderNumber, companyId },
    },
  });
}

export async function createAnotaAiSale(
  data: {
    orderNumber: string;
    origin: string;
    paymentMethod: string;
    cardBrand?: string;
    deliveryType: string;
    discount: number;
    freightValue: number;
    subtotal: number;
    totalAmount: number;
    date: Date;
  },
  companyId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        companyId,
        date: data.date,
        totalAmount: data.totalAmount,
        type: "DAILY_TOTAL",
        orderNumber: data.orderNumber,
        origin: data.origin,
        paymentMethod: data.paymentMethod,
        cardBrand: data.cardBrand || null,
        deliveryType: data.deliveryType,
        freightValue: data.freightValue,
        subtotal: data.subtotal,
        discount: data.discount,
      },
    });

    // Atualizar MonthlyRevenue automaticamente
    const saleDate = new Date(sale.date);
    const month = saleDate.getMonth() + 1;
    const year = saleDate.getFullYear();

    await tx.monthlyRevenue.upsert({
      where: {
        month_year_companyId: { month, year, companyId },
      },
      create: {
        month,
        year,
        companyId,
        totalRevenue: sale.totalAmount,
      },
      update: {
        totalRevenue: {
          increment: sale.totalAmount,
        },
      },
    });

    return sale;
  });
}

export async function findById(id: string, companyId: string) {
  return await prisma.sale.findUnique({
    where: { id, companyId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updateSale(
  id: string,
  companyId: string,
  data: Prisma.SaleUpdateInput,
  newItems?: { productId: string; quantity: number }[],
) {
  return await prisma.$transaction(async (tx) => {
    // Se novos items forem enviados, recalcular e substituir
    if (newItems && newItems.length > 0) {
      // Reverter estoque dos items antigos
      const oldItems = await tx.saleItem.findMany({
        where: { saleId: id },
      });

      for (const oldItem of oldItems) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: oldItem.quantity } },
        });
      }

      // Remover items antigos
      await tx.saleItem.deleteMany({ where: { saleId: id } });

      // Criar novos items
      let calculatedTotal = 0;
      for (const item of newItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, companyId },
        });

        if (!product) {
          throw new AppError(`Produto não encontrado: ${item.productId}`);
        }

        if (product.stock.toNumber() < item.quantity) {
          throw new AppError(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          );
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        const unitPrice = product.salePrice.toNumber();
        const subTotal = item.quantity * unitPrice;
        calculatedTotal += subTotal;

        await tx.saleItem.create({
          data: {
            saleId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            subTotal,
          },
        });
      }

      // Atualizar totalAmount com o novo cálculo
      data.totalAmount = calculatedTotal;
    }

    return await tx.sale.update({
      where: { id, companyId },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });
}

export async function deleteSale(id: string, companyId: string) {
  return await prisma.$transaction(async (tx) => {
    // Reverter estoque dos items da venda
    const items = await tx.saleItem.findMany({
      where: { saleId: id },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Deletar items primeiro (FK constraint)
    await tx.saleItem.deleteMany({ where: { saleId: id } });

    // Deletar a venda
    return await tx.sale.delete({
      where: { id, companyId },
    });
  });
}

