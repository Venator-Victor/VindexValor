-- RPC function that computes account balances server-side from transactions.
-- Replaces the client-side calculateAccountBalance loop in FinanceContext.
-- SECURITY INVOKER: runs as the calling user so RLS on accounts + transactions applies automatically.

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
        WHEN t.type = 'entrada'               AND t.account_id             = a.id THEN  ABS(t.amount)
        WHEN t.type IN ('saida', 'pagamento') AND t.account_id             = a.id THEN -ABS(t.amount)
        WHEN t.type = 'transferencia'         AND t.account_id             = a.id THEN -ABS(t.amount)
        WHEN t.type = 'transferencia'         AND t.destination_account_id = a.id THEN  COALESCE(ABS(t.converted_amount), ABS(t.amount))
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