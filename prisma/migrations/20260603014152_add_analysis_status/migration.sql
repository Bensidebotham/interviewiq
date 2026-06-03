-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "triggerRunId" TEXT;
