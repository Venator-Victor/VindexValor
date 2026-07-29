-- Addresses Supabase security advisor warnings (2026-07-29):
--   function_search_path_mutable, pg_graphql_anon_table_exposed,
--   pg_graphql_authenticated_table_exposed,
--   anon/authenticated_security_definer_function_executable.
-- auth_leaked_password_protection is a Dashboard-only auth setting and is
-- not covered here.

-- 1. Pin search_path on get_account_balances so it can't be redirected by a
-- caller-controlled search_path.
CREATE OR REPLACE FUNCTION public.get_account_balances()
RETURNS TABLE(account_id uuid, balance numeric)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$
  SELECT
    a.id AS account_id,
    COALESCE(a.initial_balance, 0) + COALESCE(SUM(
      CASE
        WHEN t.type = 'income'            AND t.account_id             = a.id THEN  ABS(t.amount)
        WHEN t.type IN ('expense', 'payment') AND t.account_id         = a.id THEN -ABS(t.amount)
        WHEN t.type = 'transfer'          AND t.account_id             = a.id THEN -ABS(t.amount)
        WHEN t.type = 'transfer'          AND t.destination_account_id = a.id THEN  COALESCE(ABS(t.converted_amount), ABS(t.amount))
        ELSE 0
      END
    ), 0) AS balance
  FROM public.accounts a
  LEFT JOIN public.transactions t
    ON  t.user_id = a.user_id
    AND (t.account_id = a.id OR t.destination_account_id = a.id)
  WHERE a.user_id = auth.uid()
  GROUP BY a.id, a.initial_balance;
$$;

GRANT EXECUTE ON FUNCTION public.get_account_balances() TO authenticated;

-- 2. rls_auto_enable is an event-trigger helper with no legitimate caller.
-- 20260528000000 already revoked it from anon; authenticated could still
-- call it directly.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 3. monetary_aggregates / foreign_economic_indicators were granted anon
-- access and authenticated write access, even though only the ingestion
-- edge functions (service_role) write to them and only authenticated users
-- read them. Bring grants back in line with 20260528000000's
-- "anon has no business accessing any table" policy.
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.monetary_aggregates FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.monetary_aggregates FROM authenticated;

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.foreign_economic_indicators FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.foreign_economic_indicators FROM authenticated;

-- 4. The app only talks to Supabase via the REST client (supabase-js) and
-- never uses the GraphQL API. graphql_public/graphql are owned by
-- supabase_admin, so a migration (running as postgres) can't revoke the
-- schema/function grants supabase_admin made -- REVOKE silently no-ops
-- instead of erroring. pg_graphql does honor a per-object
-- "totally_hidden" comment directive set by the table/view owner though,
-- which clears every pg_graphql_*_table_exposed warning without touching
-- the REST-facing grants the app depends on.
COMMENT ON TABLE public.accounts IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.categories IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.custom_category_mappings IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.foreign_economic_indicators IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.goals IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.inflation_data IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.investments IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.invoice_items IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.invoices IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.monetary_aggregates IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.recurring_installments IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.recurring_items IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.settings IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.transaction_types IS '@graphql({"totally_hidden": true})';
COMMENT ON TABLE public.transactions IS '@graphql({"totally_hidden": true})';

COMMENT ON VIEW public.vw_account_monthly_flow IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_account_overview IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_category_spending IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_dashboard_summary IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_expense_by_category_monthly IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_goal_progress IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_income_vs_expense_monthly IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_investment_performance IS '@graphql({"totally_hidden": true})';
COMMENT ON VIEW public.vw_investment_summary IS '@graphql({"totally_hidden": true})';
