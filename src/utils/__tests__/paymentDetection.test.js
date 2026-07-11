import { describe, it, expect } from 'vitest';
import { suggestIsPayment } from '../paymentDetection';

describe('suggestIsPayment', () => {
  it('matches by description name', () => {
    expect(suggestIsPayment({ amount: 324, description: 'Pagamento recebido' }, 0)).toBe(true);
    expect(suggestIsPayment({ amount: 324, description: 'Payment received' }, 0)).toBe(true);
  });

  it('matches by amount close to the previous invoice balance', () => {
    expect(suggestIsPayment({ amount: 324, description: 'Credito' }, -323.99)).toBe(true);
  });

  it('does not match a genuine refund with unrelated amount and no payment wording', () => {
    expect(suggestIsPayment({ amount: 48.58, description: 'Estorno de "Dm*Hostingercomb"' }, -323.99)).toBe(false);
  });

  it('never suggests negative or zero amounts', () => {
    expect(suggestIsPayment({ amount: -324, description: 'Pagamento recebido' }, -323.99)).toBe(false);
    expect(suggestIsPayment({ amount: 0, description: 'Pagamento recebido' }, -323.99)).toBe(false);
  });

  it('does not match when there was no previous balance and no name match', () => {
    expect(suggestIsPayment({ amount: 50, description: 'Cashback' }, 0)).toBe(false);
  });
});
