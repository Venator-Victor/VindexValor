-- The Goals UI treats deadline as optional (fixed goals without a due date,
-- recurring goals in general), but the column was still NOT NULL.
ALTER TABLE "public"."goals" ALTER COLUMN "deadline" DROP NOT NULL;