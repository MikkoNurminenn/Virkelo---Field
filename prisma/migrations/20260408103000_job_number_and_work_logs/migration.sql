-- AlterEnum
ALTER TYPE "JobAttachmentKind" ADD VALUE 'RECEIPT';

-- AlterEnum
ALTER TYPE "JobEntryType" ADD VALUE 'WORK_LOG';

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "jobNumber" TEXT;
