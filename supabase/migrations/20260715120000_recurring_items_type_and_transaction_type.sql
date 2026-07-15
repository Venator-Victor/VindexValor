-- Give recurring_items the same income/expense vocabulary transactions already has,
-- so a recurrence's type is stored explicitly instead of inferred from the amount's
-- sign. Previously recurrence_type only had two values ('installments'/'subscription'),
-- so an income recurrence (e.g. salary) was always mislabeled 'subscription' and
-- rendered/counted everywhere as a bill. This adds a third value ('salary') mirroring
-- transactions.recurring_type, plus the underlying type/transaction_type_id columns
-- transactions already carries, so editing a recurrence no longer has to guess which
-- transaction_types row was originally picked.

ALTER TABLE "public"."recurring_items" ADD COLUMN "type" "text";
ALTER TABLE "public"."recurring_items" ADD COLUMN "transaction_type_id" "uuid" REFERENCES "public"."transaction_types"("id");

-- Backfill from the amount's sign — the only signal that existed before this migration.
UPDATE "public"."recurring_items" SET "type" = CASE WHEN "amount" > 0 THEN 'income' ELSE 'expense' END WHERE "type" IS NULL;

-- Any existing income recurrence was mislabeled 'subscription' (recurring_items had no
-- salary/income branch before now) — relabel it now that 'salary' exists.
UPDATE "public"."recurring_items" SET "recurrence_type" = 'salary' WHERE "type" = 'income' AND "recurrence_type" = 'subscription';

-- Best-effort backfill of transaction_type_id by matching the transaction_types row whose
-- name corresponds to the recurrence's (now-correct) classification. transaction_types is a
-- small, hand-seeded lookup table with no version-controlled seed data, so this is a soft
-- match — rows with no matching name are simply left NULL, same as every row was before
-- this migration (the edit form already tolerates an unresolved type selection).
UPDATE "public"."recurring_items" ri SET "transaction_type_id" = tt.id
  FROM "public"."transaction_types" tt
  WHERE ri."transaction_type_id" IS NULL AND ri."recurrence_type" = 'salary' AND tt."name" = 'Salário';

UPDATE "public"."recurring_items" ri SET "transaction_type_id" = tt.id
  FROM "public"."transaction_types" tt
  WHERE ri."transaction_type_id" IS NULL AND ri."recurrence_type" = 'installments' AND tt."name" = 'Parcelamento';

UPDATE "public"."recurring_items" ri SET "transaction_type_id" = tt.id
  FROM "public"."transaction_types" tt
  WHERE ri."transaction_type_id" IS NULL AND ri."recurrence_type" = 'subscription' AND tt."name" = 'Assinatura';

ALTER TABLE "public"."recurring_items" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "public"."recurring_items" ALTER COLUMN "type" SET DEFAULT 'expense';

ALTER TABLE "public"."recurring_items"
  ADD CONSTRAINT "chk_recurring_items_type_valid"
  CHECK ("type" = ANY (ARRAY['income', 'expense']));

ALTER TABLE "public"."recurring_items"
  ADD CONSTRAINT "chk_recurring_items_recurrence_type_valid"
  CHECK ("recurrence_type" IS NULL OR "recurrence_type" = ANY (ARRAY['salary', 'subscription', 'installments']));

ALTER TABLE "public"."recurring_items"
  ADD CONSTRAINT "chk_recurring_items_income_recurrence"
  CHECK (NOT ("type" = 'income') OR "recurrence_type" = 'salary');

ALTER TABLE "public"."recurring_items"
  ADD CONSTRAINT "chk_recurring_items_expense_recurrence"
  CHECK (NOT ("type" = 'expense') OR "recurrence_type" = ANY (ARRAY['installments', 'subscription']));
