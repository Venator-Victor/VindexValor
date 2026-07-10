-- Migrate accounts.type discriminator values from Portuguese to English
-- (accounts.type was missed by the Phase 4 discriminator migration)

ALTER TABLE "public"."accounts" DROP CONSTRAINT IF EXISTS "check_account_subtype_validity";

UPDATE "public"."accounts" SET "type" = 'checking',        "account_subtype" = 'checking'        WHERE "type" = 'Conta Corrente';
UPDATE "public"."accounts" SET "type" = 'credit_card',     "account_subtype" = 'credit_card'     WHERE "type" = 'Cartão de Crédito';
UPDATE "public"."accounts" SET "type" = 'savings',         "account_subtype" = 'savings'         WHERE "type" = 'Poupança';
UPDATE "public"."accounts" SET "type" = 'investment',      "account_subtype" = 'investment'      WHERE "type" = 'Investimentos';
UPDATE "public"."accounts" SET "type" = 'crypto',          "account_subtype" = 'crypto'          WHERE "type" IN ('Criptomoeda', 'Cripto');
UPDATE "public"."accounts" SET "type" = 'cash',            "account_subtype" = 'cash'            WHERE "type" = 'Dinheiro';
UPDATE "public"."accounts" SET "type" = 'other',           "account_subtype" = 'other'           WHERE "type" = 'Outros';
UPDATE "public"."accounts" SET "type" = 'meal_voucher',    "account_subtype" = 'meal_voucher'    WHERE "type" = 'Vale-Refeição';
UPDATE "public"."accounts" SET "type" = 'food_voucher',    "account_subtype" = 'food_voucher'    WHERE "type" = 'Vale-Alimentação';
UPDATE "public"."accounts" SET "type" = 'loan',             "account_subtype" = 'loan'            WHERE "type" = 'Empréstimos';
UPDATE "public"."accounts" SET "type" = 'assets',          "account_subtype" = 'assets'          WHERE "type" = 'Bens';
UPDATE "public"."accounts" SET "type" = 'joint_account',   "account_subtype" = 'joint_account'   WHERE "type" = 'Conta Conjunta';
UPDATE "public"."accounts" SET "type" = 'payment_account', "account_subtype" = 'payment_account' WHERE "type" = 'Conta de Pagamentos';

ALTER TABLE "public"."accounts"
  ADD CONSTRAINT "check_account_subtype_validity" CHECK (
    ("type" <> ALL (ARRAY['credit_card', 'investment', 'meal_voucher', 'food_voucher', 'loan']::text[]))
    OR ("account_subtype" IS NOT NULL)
  );