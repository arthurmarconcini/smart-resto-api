/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber,companyId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "deliveryType" TEXT,
ADD COLUMN     "discount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "freightValue" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "subtotal" DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_orderNumber_companyId_key" ON "Sale"("orderNumber", "companyId");
