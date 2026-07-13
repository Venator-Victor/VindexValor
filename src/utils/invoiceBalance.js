// Credit card statements settle one billing cycle late: an invoice's payment line
// (if the bank includes one) pays off the *previous* invoice, not its own purchases.
// So an invoice's real "amount owed" isn't just the sum of its own items — it's the
// previous invoice's carried balance plus this period's activity, same as how account
// balances are computed client-side from transaction history rather than stored.
//
// Walks each account's invoices in chronological order (by closing_date) and returns,
// per invoice: the balance carried in, this period's raw item sum, and the resulting
// balance carried out (which becomes the next invoice's opening balance).
export const computeInvoiceBalances = (invoices, itemsByInvoiceId) => {
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
      const periodTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const openingBalance = runningBalance;
      const closingBalance = openingBalance + periodTotal;
      result[inv.id] = { openingBalance, periodTotal, closingBalance };
      runningBalance = closingBalance;
    }
  }
  return result;
};
