-- Marks a negative invoice item as a restatement of the previous invoice's already-owed
-- balance (e.g. "Valor pendente do mês anterior") rather than a genuine new purchase.
-- The real running balance is still carried forward via computeInvoiceBalances/invoice
-- status regardless of this flag, so these lines are pure noise for "total spent" and
-- would otherwise double-count debt that already carried forward on its own.
ALTER TABLE "public"."invoice_items"
  ADD COLUMN "is_carryover" boolean DEFAULT false NOT NULL;
