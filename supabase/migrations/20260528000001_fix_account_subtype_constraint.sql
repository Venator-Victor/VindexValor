-- The original constraint required account_subtype IS NULL for account types
-- not in the special list (Cartão de Crédito, Investimentos, etc.), which
-- rejected any insert for Conta Corrente, Poupança, Criptomoeda, etc.
-- The new constraint only enforces that types in the special list must have
-- a non-null subtype; all other types are unrestricted.

ALTER TABLE "public"."contas"
  DROP CONSTRAINT "check_account_subtype_validity";

ALTER TABLE "public"."contas"
  ADD CONSTRAINT "check_account_subtype_validity" CHECK (
    ("type" <> ALL (ARRAY[
      'Cartão de Crédito'::text,
      'Investimentos'::text,
      'Vale-Refeição'::text,
      'Vale-Alimentação'::text,
      'Empréstimos'::text
    ]))
    OR ("account_subtype" IS NOT NULL)
  );
