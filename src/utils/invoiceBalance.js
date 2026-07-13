// Credit card statements settle one billing cycle late: an invoice's payment line
// (if the bank includes one) pays off the *previous* invoice, not its own purchases.
// So an invoice's real "amount owed" isn't just the sum of its own items — it's the
// previous invoice's carried balance plus this period's activity, same as how account
// balances are computed client-side from transaction history rather than stored.
//
// A payment can settle an invoice two different ways: a CSV-imported statement may
// include its own payment line directly in invoice_items (flagged is_payment, already
// netted into the item sum below), or the app's own "link a payment" flow attaches an
// existing transactions row via invoice_id instead (any type — expense/transfer/payment,
// see InvoicePaymentLinkModal's eligible-payments query) — that one lives outside
// invoice_items, so it has to be netted in separately or a linked payment would never
// actually reduce the running balance carried into the next invoice.
//
// An invoice marked 'paid' — whether that came from the numbers above reconciling, a
// manual status edit, or the CSV import's "confirmed payment" flag — is settled by
// definition, so nothing about it carries into the next invoice's opening balance even
// if its own items/payments don't add up to a clean zero (rounding, a payment made
// outside the app, interest the statement doesn't itemize...). Without this, three paid
// invoices at -1000 each still pile their debt onto the fourth, showing -4000 owed
// instead of just that invoice's own -1000.
//
// Walks each account's invoices in chronological order (by closing_date) and returns,
// per invoice: the balance carried in, this period's raw item sum, and the resulting
// balance carried out (which becomes the next invoice's opening balance).
export const computeInvoiceBalances = (invoices, itemsByInvoiceId, paymentsByInvoiceId = {}) => {
  const byAccount = {};
  for (const inv of invoices) {
    if (!byAccount[inv.account_id]) byAccount[inv.account_id] = [];
    byAccount[inv.account_id].push(inv);
  }

  const result = {};
  for (const accountId of Object.keys(byAccount)) {
    const sorted = [...byAccount[accountId]].sort((a, b) =>
      new Date(a.closing_date) - new Date(b.closing_date) || new Date(a.opening_date) - new Date(b.opening_date)
    );
    let runningBalance = 0;
    for (const inv of sorted) {
      const items = itemsByInvoiceId[inv.id] || [];
      const payments = paymentsByInvoiceId[inv.id] || [];
      const itemsTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      // Payment transaction amounts are stored negative (money leaving the paying
      // account) — their magnitude offsets debt the same direction an is_payment item does.
      const paymentsTotal = payments.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);
      const periodTotal = itemsTotal + paymentsTotal;
      const openingBalance = runningBalance;
      const closingBalance = openingBalance + periodTotal;
      result[inv.id] = { openingBalance, periodTotal, closingBalance };
      runningBalance = inv.status === 'paid' ? 0 : closingBalance;
    }
  }
  return result;
};

// Nothing ever transitions an invoice from 'open' to 'closed' in the
// database — there's no cron/trigger for it, status is only ever written by
// user actions (create/edit forms, linking a payment). So once an invoice's
// billing cycle has actually ended (closing_date has passed), derive
// 'closed' for display instead of trusting the stale stored value. 'paid'
// and an explicit manual 'closed' are left alone — this only ever promotes
// 'open' forward, never reverts a status the user (or a payment link) set.
export const getEffectiveInvoiceStatus = (invoice) => {
  if (!invoice) return 'open';
  if (invoice.status !== 'open') return invoice.status;
  if (invoice.closing_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closing = new Date(`${invoice.closing_date}T00:00:00`);
    if (closing <= today) return 'closed';
  }
  return 'open';
};
