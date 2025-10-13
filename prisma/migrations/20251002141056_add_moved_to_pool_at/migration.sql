-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "movedToPoolAt" DATETIME;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "deliveryLocation" TEXT;
ALTER TABLE "Task" ADD COLUMN "targetRole" TEXT;
