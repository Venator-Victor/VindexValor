-- Persist each page's period-selector choice (a compound {type, month, year, startDate,
-- endDate} object, hence jsonb rather than a flat column) and move Categories' view
-- preference from localStorage-only into the same per-user settings row as the other pages.
ALTER TABLE "public"."settings"
  ADD COLUMN IF NOT EXISTS "transactions_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "accounts_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "dashboard_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "investments_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "invoices_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "recurring_items_date_filter" jsonb,
  ADD COLUMN IF NOT EXISTS "categories_view_preference" text DEFAULT 'card';
