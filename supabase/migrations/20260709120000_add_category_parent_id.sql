-- One level of subcategories: a category can optionally belong to a parent
-- category. Nesting deeper than one level is enforced in the UI only, not here.
ALTER TABLE "public"."categories"
  ADD COLUMN "parent_id" uuid;

ALTER TABLE ONLY "public"."categories"
  ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id")
  REFERENCES "public"."categories"("id") ON DELETE SET NULL;

CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");
