-- Rename tables from Portuguese to English snake_case
-- Column renames are a separate migration

ALTER TABLE "public"."transacoes"         RENAME TO "transactions";
ALTER TABLE "public"."contas"             RENAME TO "accounts";
ALTER TABLE "public"."categorias"         RENAME TO "categories";
ALTER TABLE "public"."faturas"            RENAME TO "invoices";
ALTER TABLE "public"."metas"              RENAME TO "goals";
ALTER TABLE "public"."recorrencias"       RENAME TO "recurring_items";
ALTER TABLE "public"."configuracoes"      RENAME TO "settings";
ALTER TABLE "public"."compras_fatura"     RENAME TO "invoice_items";
ALTER TABLE "public"."investimentos"      RENAME TO "investments";
ALTER TABLE "public"."recorrencia_parcelas" RENAME TO "recurring_installments";
