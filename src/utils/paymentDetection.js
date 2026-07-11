// Suggests whether an imported invoice line looks like the credit-card "payment
// received" settlement line (as opposed to a purchase or a genuine refund). This is
// only ever a *suggestion* — the CSV import flow shows it to the user as a pre-checked
// box they confirm or override, since neither signal alone is reliable across banks.
const PAYMENT_NAME_PATTERN = /pagamento|payment received/i;

export const suggestIsPayment = (row, previousBalance) => {
  const amount = Number(row.amount);
  if (!(amount > 0)) return false;

  if (PAYMENT_NAME_PATTERN.test(row.description || '')) return true;

  // Amount closely matches what was owed on the previous invoice (R$1 or 2%,
  // whichever is larger, to absorb rounding on the bank's side).
  if (previousBalance < 0) {
    const owed = Math.abs(previousBalance);
    const tolerance = Math.max(1, owed * 0.02);
    if (Math.abs(amount - owed) <= tolerance) return true;
  }

  return false;
};
