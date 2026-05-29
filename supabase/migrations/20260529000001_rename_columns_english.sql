-- Rename columns from Portuguese/mixed to English snake_case

-- transactions (transacoes)
ALTER TABLE "public"."transactions" RENAME COLUMN "categoria_id"      TO "category_id";
ALTER TABLE "public"."transactions" RENAME COLUMN "conta_id"           TO "account_id";
ALTER TABLE "public"."transactions" RENAME COLUMN "conta_destino_id"   TO "destination_account_id";
ALTER TABLE "public"."transactions" RENAME COLUMN "fatura_id"          TO "invoice_id";
ALTER TABLE "public"."transactions" RENAME COLUMN "titular_responsavel" TO "responsible_holder";
ALTER TABLE "public"."transactions" RENAME COLUMN "tipo_recorrente"    TO "recurring_type";

-- invoices (faturas)
ALTER TABLE "public"."invoices" RENAME COLUMN "numero_fatura"   TO "invoice_number";
ALTER TABLE "public"."invoices" RENAME COLUMN "data_abertura"   TO "opening_date";
ALTER TABLE "public"."invoices" RENAME COLUMN "data_fechamento" TO "closing_date";
ALTER TABLE "public"."invoices" RENAME COLUMN "valor_total"     TO "total_amount";
ALTER TABLE "public"."invoices" RENAME COLUMN "conta_id"        TO "account_id";

-- categories (categorias)
ALTER TABLE "public"."categories" RENAME COLUMN "limite_gasto"   TO "spending_limit";
ALTER TABLE "public"."categories" RENAME COLUMN "periodo_limite" TO "budget_period";

-- goals (metas)
ALTER TABLE "public"."goals" RENAME COLUMN "tipo_meta"          TO "goal_type";
ALTER TABLE "public"."goals" RENAME COLUMN "conta_reservada_id" TO "reserved_account_id";
ALTER TABLE "public"."goals" RENAME COLUMN "valor_reservado"    TO "reserved_amount";
ALTER TABLE "public"."goals" RENAME COLUMN "valor_acumulado"    TO "accumulated_amount";

-- recurring_items (recorrencias)
ALTER TABLE "public"."recurring_items" RENAME COLUMN "numero_parcelas" TO "installment_count";
ALTER TABLE "public"."recurring_items" RENAME COLUMN "categoria_id"    TO "category_id";

-- recurring_installments (recorrencia_parcelas)
ALTER TABLE "public"."recurring_installments" RENAME COLUMN "recorrencia_id" TO "recurring_item_id";

-- invoice_items (compras_fatura)
ALTER TABLE "public"."invoice_items" RENAME COLUMN "fatura_id"    TO "invoice_id";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "data"         TO "date";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "descricao"    TO "description";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "categoria_id" TO "category_id";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "conta_id"     TO "account_id";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "valor"        TO "amount";
ALTER TABLE "public"."invoice_items" RENAME COLUMN "transacao_id" TO "transaction_id";

-- settings (configuracoes)
ALTER TABLE "public"."settings" RENAME COLUMN "metas_view_preference"        TO "goals_view_preference";
ALTER TABLE "public"."settings" RENAME COLUMN "categorias_period_preference" TO "categories_period_preference";
ALTER TABLE "public"."settings" RENAME COLUMN "transacoes_view_preference"   TO "transactions_view_preference";
ALTER TABLE "public"."settings" RENAME COLUMN "investimentos_view_preference" TO "investments_view_preference";
ALTER TABLE "public"."settings" RENAME COLUMN "recorrencias_view_preference" TO "recurring_items_view_preference";
ALTER TABLE "public"."settings" RENAME COLUMN "contas_view_preference"       TO "accounts_view_preference";
