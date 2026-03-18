-- CreateTable
CREATE TABLE "DrillResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "userPlanId" TEXT,
    "dayNumber" INTEGER,
    "hits" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrillResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DrillResult" ADD CONSTRAINT "DrillResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillResult" ADD CONSTRAINT "DrillResult_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "TrainingDrill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
