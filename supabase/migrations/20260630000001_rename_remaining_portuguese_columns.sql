-- Rename remaining Portuguese column names missed in 20260529000001

-- custom_category_mappings.categoria_id was not renamed in the earlier migration
-- (the JS code already uses category_id, making saves/updates broken)
ALTER TABLE "public"."custom_category_mappings" RENAME COLUMN "categoria_id" TO "category_id";

-- invoice_items.is_parcelado → is_installment
ALTER TABLE "public"."invoice_items" RENAME COLUMN "is_parcelado" TO "is_installment";