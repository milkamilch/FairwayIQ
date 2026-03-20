/*
  Warnings:

  - A unique constraint covering the columns `[apiId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_createdBy_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "apiId" TEXT,
ADD COLUMN     "holesImported" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "createdBy" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_apiId_key" ON "Course"("apiId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
