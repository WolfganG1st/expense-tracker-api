-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('in', 'out');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "entryType" "EntryType" NOT NULL DEFAULT 'out';
