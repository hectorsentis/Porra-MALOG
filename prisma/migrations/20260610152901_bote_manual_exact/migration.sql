-- AlterTable
ALTER TABLE "BoteConfig" ADD COLUMN     "consolationPrize" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "firstPrize" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "secondPrize" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "thirdPrize" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "rules" SET DEFAULT 'Reparto del bote entre primer, segundo, tercer clasificado y premio de consolacion.';
