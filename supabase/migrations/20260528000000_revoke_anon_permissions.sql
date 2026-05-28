-- Remove all table and view privileges granted to the anon role.
-- The anon role has no business accessing any table in this schema;
-- all application routes require authentication.

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."categorias" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."compras_fatura" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."configuracoes" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."contas" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."custom_category_mappings" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."faturas" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."inflation_data" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."investimentos" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."metas" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."recorrencia_parcelas" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."recorrencias" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."transacoes" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."transaction_types" FROM "anon";

-- Views
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_account_monthly_flow" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_account_overview" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_category_spending" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_dashboard_summary" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_expense_by_category_monthly" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_goal_progress" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_income_vs_expense_monthly" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_investment_performance" FROM "anon";
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."vw_investment_summary" FROM "anon";

-- rls_auto_enable is an event trigger helper; anon users cannot execute DDL anyway.
REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon";

-- Prevent future tables, sequences, and functions created by the postgres role
-- from inheriting grants to anon automatically.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";