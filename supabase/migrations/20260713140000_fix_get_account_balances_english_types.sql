-- get_account_balances() still checked the pre-phase-4 Portuguese transaction
-- type values ('entrada'/'saida'/'pagamento'/'transferencia'). Migration
-- 20260630000000 renamed transactions.type to English ('income'/'expense'/
-- 'payment'/'transfer'), so every CASE branch stopped matching and every
-- account's balance silently fell back to just its initial_balance.

CREATE OR REPLACE FUNCTION public.get_account_balances()
RETURNS TABLE(account_id uuid, balance numeric)
LANGUAGE sql
SECURITY INVOKER
STABLE
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