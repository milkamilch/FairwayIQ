-- CreateEnum
CREATE TYPE "SwingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SwingAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" "SwingStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" INTEGER,
    "phases" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwingAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwingFeedback" (
    "id" TEXT NOT NULL,
    "swingId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metric" TEXT,
    "actual" DOUBLE PRECISION,
    "target" DOUBLE PRECISION,

    CONSTRAINT "SwingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SwingAnalysis_userId_idx" ON "SwingAnalysis"("userId");

-- CreateIndex
CREATE INDEX "SwingFeedback_swingId_idx" ON "SwingFeedback"("swingId");

-- AddForeignKey
ALTER TABLE "SwingAnalysis" ADD CONSTRAINT "SwingAnalysis_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwingFeedback" ADD CONSTRAINT "SwingFeedback_swingId_fkey"
    FOREIGN KEY ("swingId") REFERENCES "SwingAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
