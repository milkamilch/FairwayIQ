-- CreateTable
CREATE TABLE "TrainingSessionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPlanId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "feeling" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSessionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrainingSessionLog" ADD CONSTRAINT "TrainingSessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSessionLog" ADD CONSTRAINT "TrainingSessionLog_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserTrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
