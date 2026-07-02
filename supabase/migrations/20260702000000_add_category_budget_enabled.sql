-- Add a toggle to decide whether a category is tracked against a budget at all.
-- Categories like income ("Salário") or "Investimentos" don't represent spending,
-- so tracking a "current spending" figure against them doesn't make sense.
ALTER TABLE "public"."categories"
  ADD COLUMN "budget_enabled" boolean NOT NULL DEFAULT true;

-- Existing income-style categories: turn budget tracking off by default.
UPDATE "public"."categories"
  SET "budget_enabled" = false
  WHERE "name" IN ('Salário', 'Investimentos');

-- Consolidate the duplicate "Jogos" category into "Lazer e Hobbies" per user,
-- reassigning every reference before removing the duplicate row.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT j.id AS jogos_id, h.id AS hobbies_id
    FROM public.categories j
    JOIN public.categories h
      ON h.user_id = j.user_id AND h.name = 'Lazer e Hobbies'
    WHERE j.name = 'Jogos'
  LOOP
    UPDATE public.transactions SET category_id = r.hobbies_id WHERE category_id = r.jogos_id;
    UPDATE public.invoice_items SET category_id = r.hobbies_id WHERE category_id = r.jogos_id;
    UPDATE public.recurring_items SET category_id = r.hobbies_id WHERE category_id = r.jogos_id;
    UPDATE public.custom_category_mappings SET category_id = r.hobbies_id WHERE category_id = r.jogos_id;
    DELETE FROM public.categories WHERE id = r.jogos_id;
  END LOOP;
END $$;