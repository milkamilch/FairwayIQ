-- CreateTable
CREATE TABLE "HandicapEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handicap" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandicapEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HandicapEntry" ADD CONSTRAINT "HandicapEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
