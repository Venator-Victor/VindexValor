// Shared shape for the Settings page's "export data" / "import data" pair. Export just
// picks these entities off useFinance(); import restores them into the current user's
// account, table by table, in FK dependency order, with original ids preserved so the
// relationships between rows (a transaction's category_id, an invoice_item's invoice_id,
// etc.) still resolve after the round trip.
export const BACKUP_VERSION = 1;

// Column whitelists strip out anything that isn't a real column on the target table —
// the arrays from useFinance() carry joined relations (categories, account, invoices...)
// and, for accounts, an in-memory-only computed field (current_fatura_value) that would
// otherwise make the insert fail with "column does not exist".
const ACCOUNT_COLUMNS = [
  'id', 'name', 'type', 'bank', 'balance', 'color', 'icon', 'account_subtype',
  'credit_limit', 'closing_date', 'due_date', 'investment_type', 'expected_return',
  'reload_value', 'reload_date', 'total_amount', 'interest_rate', 'term_months',
  'amortization_type', 'holders', 'initial_balance', 'currency', 'crypto_symbol', 'created_at'
];

const CATEGORY_COLUMNS = [
  'id', 'name', 'color', 'icon', 'spending_limit', 'budget_period', 'budget_enabled', 'parent_id', 'created_at'
];

const INVOICE_COLUMNS = [
  'id', 'invoice_number', 'opening_date', 'closing_date', 'total_amount', 'status', 'account_id', 'created_at', 'updated_at'
];

const INVOICE_ITEM_COLUMNS = [
  'id', 'invoice_id', 'date', 'description', 'category_id', 'account_id', 'amount',
  'parcel_number', 'total_parcels', 'is_installment', 'transaction_id', 'is_payment', 'is_carryover',
  'created_at', 'updated_at'
];

const TRANSACTION_COLUMNS = [
  'id', 'description', 'amount', 'type', 'date', 'is_recurring', 'recurring_id', 'original_amount',
  'is_future_only', 'name', 'responsible_holder', 'category_id', 'account_id', 'destination_account_id',
  'transaction_type_id', 'recurring_type', 'exchange_rate', 'converted_amount', 'invoice_id', 'created_at'
];

const RECURRING_COLUMNS = [
  'id', 'description', 'amount', 'frequency', 'next_date', 'status', 'recurrence_type',
  'installment_count', 'category_id', 'created_at'
];

const RECURRING_INSTALLMENT_COLUMNS = [
  'id', 'recurring_item_id', 'parcel_number', 'amount', 'due_date', 'status', 'paid_date', 'created_at'
];

const INVESTMENT_COLUMNS = [
  'id', 'name', 'type', 'invested_amount', 'current_amount', 'purchase_date', 'subtype', 'account_id', 'created_at'
];

const GOAL_COLUMNS = [
  'id', 'name', 'target_amount', 'current_amount', 'deadline', 'description', 'color', 'icon',
  'goal_type', 'reserved_account_id', 'reserved_amount', 'accumulated_amount', 'contribution_value',
  'period_frequency', 'account_reservations', 'created_at'
];

// Picks the whitelisted columns off a row and stamps it with the *current* user —
// the exported row's own user_id belongs to whoever originally exported it, and RLS's
// WITH CHECK (auth.uid() = user_id) would reject every insert otherwise.
const sanitizeRow = (row, columns, userId) => {
  const clean = { user_id: userId };
  columns.forEach(col => {
    if (row[col] !== undefined) clean[col] = row[col];
  });
  return clean;
};

const insertInChunks = async (supabase, table, rows, chunkSize = 200) => {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  return rows.length;
};

// Categories self-reference via parent_id, so children can't be inserted before their
// parent exists. Walks the set in waves (parent_id null or already inserted) rather than
// assuming a fixed nesting depth — any row whose parent never shows up (points outside
// this export, or a cycle) gets its parent_id dropped on the next wave instead of
// stalling the import forever.
const insertCategoriesTopologically = async (supabase, categories) => {
  let remaining = [...categories];
  const insertedIds = new Set();
  let total = 0;

  while (remaining.length > 0) {
    let batch = remaining.filter(c => !c.parent_id || insertedIds.has(c.parent_id));
    if (batch.length === 0) {
      remaining.forEach(c => { c.parent_id = null; });
      batch = remaining;
    }

    const { error } = await supabase.from('categories').insert(batch);
    if (error) throw new Error(`categories: ${error.message}`);

    batch.forEach(c => insertedIds.add(c.id));
    total += batch.length;
    const batchIds = new Set(batch.map(c => c.id));
    remaining = remaining.filter(c => !batchIds.has(c.id));
  }

  return total;
};

export const buildBackupPayload = ({ transactions, accounts, categories, investments, recurring, parcels, goals, invoices, invoiceItems, settings }) => ({
  version: BACKUP_VERSION,
  exportDate: new Date().toISOString(),
  transactions,
  accounts,
  categories,
  investments,
  recurring,
  parcels,
  goals,
  invoices,
  invoiceItems,
  settings
});

// A backup is anything with at least one of the entity arrays this export produces —
// intentionally loose so older exports (before goals/invoices/parcels were added) still
// import whatever they do contain instead of being rejected outright.
export const isValidBackupShape = (data) => {
  if (!data || typeof data !== 'object') return false;
  const knownKeys = ['transactions', 'accounts', 'categories', 'investments', 'recurring', 'parcels', 'goals', 'invoices', 'invoiceItems'];
  return knownKeys.some(key => Array.isArray(data[key]));
};

// Restores a backup into the *current* user's account, in FK dependency order:
// categories (self-referencing, handled separately) -> accounts -> invoices/investments/
// recurring items (need accounts/categories) -> transactions (needs all of the above) ->
// invoice items (need transactions) -> recurring installments -> goals (need accounts).
//
// Each table is its own insert call, not one shared transaction, so a failure partway
// through leaves everything before it already committed — the returned per-table counts
// let the caller report exactly how far it got.
export const importBackupData = async (supabase, userId, backup) => {
  const counts = {};

  const categoryRows = (backup.categories || []).map(c => sanitizeRow(c, CATEGORY_COLUMNS, userId));
  counts.categories = await insertCategoriesTopologically(supabase, categoryRows);

  const accountRows = (backup.accounts || []).map(a => sanitizeRow(a, ACCOUNT_COLUMNS, userId));
  counts.accounts = await insertInChunks(supabase, 'accounts', accountRows);

  const invoiceRows = (backup.invoices || []).map(i => sanitizeRow(i, INVOICE_COLUMNS, userId));
  counts.invoices = await insertInChunks(supabase, 'invoices', invoiceRows);

  const investmentRows = (backup.investments || []).map(i => sanitizeRow(i, INVESTMENT_COLUMNS, userId));
  counts.investments = await insertInChunks(supabase, 'investments', investmentRows);

  const recurringRows = (backup.recurring || []).map(r => sanitizeRow(r, RECURRING_COLUMNS, userId));
  counts.recurring = await insertInChunks(supabase, 'recurring_items', recurringRows);

  const transactionRows = (backup.transactions || []).map(t => sanitizeRow(t, TRANSACTION_COLUMNS, userId));
  counts.transactions = await insertInChunks(supabase, 'transactions', transactionRows);

  const invoiceItemRows = (backup.invoiceItems || []).map(i => sanitizeRow(i, INVOICE_ITEM_COLUMNS, userId));
  counts.invoiceItems = await insertInChunks(supabase, 'invoice_items', invoiceItemRows);

  const parcelRows = (backup.parcels || []).map(p => sanitizeRow(p, RECURRING_INSTALLMENT_COLUMNS, userId));
  counts.parcels = await insertInChunks(supabase, 'recurring_installments', parcelRows);

  const goalRows = (backup.goals || []).map(g => sanitizeRow(g, GOAL_COLUMNS, userId));
  counts.goals = await insertInChunks(supabase, 'goals', goalRows);

  return counts;
};
