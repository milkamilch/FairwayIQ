-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ScheduledTraining" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Tee" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "slope" DOUBLE PRECISION,
    "distances" JSONB,

    CONSTRAINT "Tee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tee_courseId_idx" ON "Tee"("courseId");

-- AddForeignKey
ALTER TABLE "Tee" ADD CONSTRAINT "Tee_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
