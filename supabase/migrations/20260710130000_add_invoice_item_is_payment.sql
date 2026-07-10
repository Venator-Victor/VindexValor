-- Marks a positive invoice item as the invoice's payment settlement line (as opposed to a
-- refund/return), so it can be excluded from "total spent" while still netting against
-- purchases in the invoice's overall balance.
ALTER TABLE "public"."invoice_items"
  ADD COLUMN "is_payment" boolean DEFAULT false NOT NULL;
