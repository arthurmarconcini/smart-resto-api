/*
  Warnings:

  - You are about to drop the column `salesPrice` on the `Product` table. All the data in the column will be lost.
  - Added the required column `salePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "salesPrice",
ADD COLUMN     "salePrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "stock" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT NOT NULL;
