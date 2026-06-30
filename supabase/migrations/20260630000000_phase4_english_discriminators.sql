-- Phase 4: Migrate all discriminator string values from Portuguese/mixed to English

-- ============================================================
-- 1. transactions.type  (drop constraints → update data → recreate)
-- ============================================================
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "chk_entrada_recorrente";
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "chk_saida_recorrente";
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "chk_transferencia_recorrente";
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "chk_transferencia_tipo_recorrente";

UPDATE "public"."transactions" SET "type" = 'income'   WHERE "type" = 'entrada';
UPDATE "public"."transactions" SET "type" = 'expense'  WHERE "type" = 'saida';
UPDATE "public"."transactions" SET "type" = 'transfer' WHERE "type" = 'transferencia';
UPDATE "public"."transactions" SET "type" = 'payment'  WHERE "type" = 'pagamento';

-- Handle both casing variants that existed in the codebase
UPDATE "public"."transactions" SET "recurring_type" = 'subscription'  WHERE "recurring_type" IN ('assinatura', 'Assinatura');
UPDATE "public"."transactions" SET "recurring_type" = 'installments'  WHERE "recurring_type" IN ('parcelamento', 'Parcelas');
UPDATE "public"."transactions" SET "recurring_type" = 'salary'        WHERE "recurring_type" = 'salário';

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "chk_income_recurring"
  CHECK (NOT (is_recurring = true AND type = 'income') OR recurring_type = 'salary');

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "chk_expense_recurring"
  CHECK (NOT (is_recurring = true AND type = 'expense') OR recurring_type = ANY (ARRAY['installments', 'subscription']));

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "chk_transfer_recurring"
  CHECK (type <> 'transfer' OR is_recurring = false);

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "chk_transfer_recurring_type"
  CHECK (type <> 'transfer' OR recurring_type IS NULL);

-- ============================================================
-- 2. invoices.status
-- ============================================================
ALTER TABLE "public"."invoices" DROP CONSTRAINT IF EXISTS "faturas_status_check";

UPDATE "public"."invoices" SET "status" = 'open'   WHERE "status" = 'aberta';
UPDATE "public"."invoices" SET "status" = 'closed' WHERE "status" = 'fechada';
UPDATE "public"."invoices" SET "status" = 'paid'   WHERE "status" = 'paga';

ALTER TABLE "public"."invoices" ALTER COLUMN "status" SET DEFAULT 'open';
ALTER TABLE "public"."invoices"
  ADD CONSTRAINT "invoices_status_check"
  CHECK (status = ANY (ARRAY['open', 'closed', 'paid']));

-- ============================================================
-- 3. recurring_items (recurrence_type, status, frequency)
-- ============================================================
UPDATE "public"."recurring_items" SET "recurrence_type" = 'installments' WHERE "recurrence_type" = 'Parcelas';
UPDATE "public"."recurring_items" SET "recurrence_type" = 'subscription'  WHERE "recurrence_type" = 'Assinatura';

UPDATE "public"."recurring_items" SET "status" = 'active'   WHERE "status" = 'Ativo';
UPDATE "public"."recurring_items" SET "status" = 'inactive' WHERE "status" = 'Inativo';

UPDATE "public"."recurring_items" SET "frequency" = 'daily'      WHERE "frequency" = 'Diário';
UPDATE "public"."recurring_items" SET "frequency" = 'weekly'     WHERE "frequency" = 'Semanal';
UPDATE "public"."recurring_items" SET "frequency" = 'biweekly'   WHERE "frequency" = 'Quinzenal';
UPDATE "public"."recurring_items" SET "frequency" = 'monthly'    WHERE "frequency" = 'Mensal';
UPDATE "public"."recurring_items" SET "frequency" = 'quarterly'  WHERE "frequency" = 'Trimestral';
UPDATE "public"."recurring_items" SET "frequency" = 'semiannual' WHERE "frequency" = 'Semestral';
UPDATE "public"."recurring_items" SET "frequency" = 'yearly'     WHERE "frequency" = 'Anual';

ALTER TABLE "public"."recurring_items" ALTER COLUMN "recurrence_type" SET DEFAULT 'subscription';
ALTER TABLE "public"."recurring_items" ALTER COLUMN "status"          SET DEFAULT 'active';
ALTER TABLE "public"."recurring_items" ALTER COLUMN "frequency"       SET DEFAULT 'monthly';

-- ============================================================
-- 4. goals (goal_type, period_frequency)
-- ============================================================
UPDATE "public"."goals" SET "goal_type" = 'target_value'  WHERE "goal_type" = 'valor_final';
UPDATE "public"."goals" SET "goal_type" = 'monthly_value' WHERE "goal_type" = 'valor_mensal';

UPDATE "public"."goals" SET "period_frequency" = 'daily'      WHERE "period_frequency" = 'Diário';
UPDATE "public"."goals" SET "period_frequency" = 'weekly'     WHERE "period_frequency" = 'Semanal';
UPDATE "public"."goals" SET "period_frequency" = 'biweekly'   WHERE "period_frequency" = 'Quinzenal';
UPDATE "public"."goals" SET "period_frequency" = 'monthly'    WHERE "period_frequency" = 'Mensal';
UPDATE "public"."goals" SET "period_frequency" = 'quarterly'  WHERE "period_frequency" = 'Trimestral';
UPDATE "public"."goals" SET "period_frequency" = 'semiannual' WHERE "period_frequency" = 'Semestral';
UPDATE "public"."goals" SET "period_frequency" = 'yearly'     WHERE "period_frequency" = 'Anual';

ALTER TABLE "public"."goals" ALTER COLUMN "goal_type"        SET DEFAULT 'target_value';
ALTER TABLE "public"."goals" ALTER COLUMN "period_frequency" SET DEFAULT 'monthly';

-- ============================================================
-- 5. categories.budget_period
-- ============================================================
UPDATE "public"."categories" SET "budget_period" = 'daily'      WHERE "budget_period" = 'Diário';
UPDATE "public"."categories" SET "budget_period" = 'weekly'     WHERE "budget_period" = 'Semanal';
UPDATE "public"."categories" SET "budget_period" = 'biweekly'   WHERE "budget_period" = 'Quinzenal';
UPDATE "public"."categories" SET "budget_period" = 'monthly'    WHERE "budget_period" = 'Mensal';
UPDATE "public"."categories" SET "budget_period" = 'quarterly'  WHERE "budget_period" = 'Trimestral';
UPDATE "public"."categories" SET "budget_period" = 'semiannual' WHERE "budget_period" = 'Semestral';
UPDATE "public"."categories" SET "budget_period" = 'yearly'     WHERE "budget_period" = 'Anual';

-- ============================================================
-- 6. Recreate views with English string values, table names, and column names
-- ============================================================

CREATE OR REPLACE VIEW "public"."vw_account_monthly_flow" WITH ("security_invoker"='on') AS
 WITH "monthly_flow" AS (
         SELECT "transactions"."user_id",
            "transactions"."account_id",
            "transactions"."date",
                CASE
                    WHEN ("transactions"."type" = 'income')   THEN "transactions"."amount"
                    WHEN ("transactions"."type" = 'expense')  THEN (- "abs"("transactions"."amount"))
                    WHEN ("transactions"."type" = 'transfer') THEN (- "abs"("transactions"."amount"))
                    ELSE (0)::numeric
                END AS "flow"
           FROM "public"."transactions"
          WHERE ("transactions"."account_id" IS NOT NULL)
        UNION ALL
         SELECT "transactions"."user_id",
            "transactions"."destination_account_id" AS "account_id",
            "transactions"."date",
            "abs"("transactions"."amount") AS "flow"
           FROM "public"."transactions"
          WHERE (("transactions"."type" = 'transfer') AND ("transactions"."destination_account_id" IS NOT NULL))
        )
 SELECT "user_id",
    "account_id",
    EXTRACT(year FROM "date") AS "year",
    EXTRACT(month FROM "date") AS "month",
    "sum"("flow") AS "net_flow"
   FROM "monthly_flow"
  GROUP BY "user_id", "account_id", (EXTRACT(year FROM "date")), (EXTRACT(month FROM "date"));


CREATE OR REPLACE VIEW "public"."vw_category_spending" WITH ("security_invoker"='true') AS
 SELECT "t"."user_id",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."color" AS "category_color",
    "c"."spending_limit",
    "sum"("abs"("t"."amount")) AS "total_spent"
   FROM ("public"."transactions" "t"
     JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
  WHERE ("t"."type" = 'expense')
  GROUP BY "t"."user_id", "c"."id", "c"."name", "c"."color", "c"."spending_limit";


CREATE OR REPLACE VIEW "public"."vw_dashboard_summary" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'income') THEN "amount"
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_income",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'expense') THEN "abs"("amount")
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_expense",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'income') THEN "amount"
            ELSE "amount"
        END), (0)::numeric) AS "net_balance"
   FROM "public"."transactions"
  GROUP BY "user_id";


CREATE OR REPLACE VIEW "public"."vw_expense_by_category_monthly" WITH ("security_invoker"='on') AS
 SELECT "t"."user_id",
    "t"."category_id",
    "c"."name" AS "category_name",
    "c"."color" AS "category_color",
    EXTRACT(month FROM "t"."date") AS "month",
    EXTRACT(year FROM "t"."date") AS "year",
    "sum"("abs"("t"."amount")) AS "total_amount",
    "count"("t"."id") AS "transaction_count"
   FROM ("public"."transactions" "t"
     LEFT JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
  WHERE ("t"."type" = 'expense')
  GROUP BY "t"."user_id", "t"."category_id", "c"."name", "c"."color", (EXTRACT(month FROM "t"."date")), (EXTRACT(year FROM "t"."date"));


CREATE OR REPLACE VIEW "public"."vw_income_vs_expense_monthly" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    EXTRACT(month FROM "date") AS "month",
    EXTRACT(year FROM "date") AS "year",
    "sum"(
        CASE
            WHEN ("type" = 'income') THEN "amount"
            ELSE (0)::numeric
        END) AS "total_income",
    "sum"(
        CASE
            WHEN ("type" = 'expense') THEN "abs"("amount")
            ELSE (0)::numeric
        END) AS "total_expense",
    ("sum"(
        CASE
            WHEN ("type" = 'income') THEN "amount"
            ELSE (0)::numeric
        END) - "sum"(
        CASE
            WHEN ("type" = 'expense') THEN "abs"("amount")
            ELSE (0)::numeric
        END)) AS "net_balance"
   FROM "public"."transactions" "t"
  GROUP BY "user_id", (EXTRACT(month FROM "date")), (EXTRACT(month FROM "date"));