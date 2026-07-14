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

// Suggests whether an imported invoice line is the bank restating last invoice's
// already-owed balance as a new line on this statement (e.g. "Valor pendente do mês
// anterior", "Saldo anterior") — as opposed to a genuine new purchase. The debt itself
// already carries forward on its own via computeInvoiceBalances/the invoice's status,
// so counting this line as a fresh expense would double-book the same debt. Like
// suggestIsPayment, this is only ever a suggestion confirmed by the user in review.
const CARRYOVER_NAME_PATTERN = /valor pendente|saldo (devedor )?anterior|fatura anterior|previous balance|carried (forward|over)/i;

export const suggestIsCarryover = (row, previousBalance) => {
  const amount = Number(row.amount);
  // Only ever a negative (expense-shaped) line — a positive restatement would just be
  // a payment, already covered by suggestIsPayment.
  if (!(amount < 0)) return false;

  // Name match alone is trusted unconditionally, same precedence as
  // suggestIsPayment — a batch import rolls `previousBalance` forward file by file
  // without replaying each invoice's own 'paid' reset (that only happens once the
  // user confirms rows in review), so by the time a later month is suggested that
  // estimate can drift away from negative even though the wording is unambiguous.
  if (CARRYOVER_NAME_PATTERN.test(row.description || '')) return true;

  // Fallback for an unlabeled line: magnitude closely matches what was owed on the
  // previous invoice (R$1 or 2%, whichever is larger, to absorb rounding).
  if (previousBalance < 0) {
    const owed = Math.abs(previousBalance);
    const tolerance = Math.max(1, owed * 0.02);
    if (Math.abs(Math.abs(amount) - owed) <= tolerance) return true;
  }

  return false;
};
