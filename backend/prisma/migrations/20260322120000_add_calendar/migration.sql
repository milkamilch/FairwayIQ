CREATE TABLE "DrillSet" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT,
  "name"      TEXT NOT NULL,
  "category"  "TrainingCategory",
  "isPreset"  BOOLEAN NOT NULL DEFAULT false,
  "color"     TEXT NOT NULL DEFAULT '#FF6535',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DrillSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DrillSetItem" (
  "id"          TEXT NOT NULL,
  "drillSetId"  TEXT NOT NULL,
  "drillId"     TEXT,
  "customName"  TEXT,
  "durationMin" INTEGER NOT NULL DEFAULT 10,
  "order"       INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DrillSetItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledTraining" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "date"            TIMESTAMP(3) NOT NULL,
  "title"           TEXT NOT NULL,
  "category"        "TrainingCategory",
  "drillSetId"      TEXT,
  "notes"           TEXT,
  "completed"       BOOLEAN NOT NULL DEFAULT false,
  "completedAt"     TIMESTAMP(3),
  "calendarEventId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduledTraining_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DrillSet_userId_idx" ON "DrillSet"("userId");
CREATE INDEX "DrillSetItem_drillSetId_idx" ON "DrillSetItem"("drillSetId");
CREATE INDEX "ScheduledTraining_userId_date_idx" ON "ScheduledTraining"("userId", "date");

ALTER TABLE "DrillSet" ADD CONSTRAINT "DrillSet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrillSetItem" ADD CONSTRAINT "DrillSetItem_drillSetId_fkey"
  FOREIGN KEY ("drillSetId") REFERENCES "DrillSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrillSetItem" ADD CONSTRAINT "DrillSetItem_drillId_fkey"
  FOREIGN KEY ("drillId") REFERENCES "TrainingDrill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduledTraining" ADD CONSTRAINT "ScheduledTraining_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledTraining" ADD CONSTRAINT "ScheduledTraining_drillSetId_fkey"
  FOREIGN KEY ("drillSetId") REFERENCES "DrillSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
