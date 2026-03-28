-- Add JSON field for additional shots (approach, layup) to HoleStrategy
ALTER TABLE "HoleStrategy" ADD COLUMN "shots" TEXT NOT NULL DEFAULT '[]';
