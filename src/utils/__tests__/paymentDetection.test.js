import { describe, it, expect } from 'vitest';
import { suggestIsPayment, suggestIsCarryover } from '../paymentDetection';

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

describe('suggestIsCarryover', () => {
  it('matches a restated previous balance by name and amount', () => {
    expect(suggestIsCarryover({ amount: -323.99, description: 'Valor pendente do mês anterior' }, -323.99)).toBe(true);
    expect(suggestIsCarryover({ amount: -324, description: 'Saldo anterior' }, -323.99)).toBe(true);
  });

  it('does not match a genuine purchase with unrelated amount and no carryover wording', () => {
    expect(suggestIsCarryover({ amount: -189, description: 'Agropecuaria Venturini' }, -323.99)).toBe(false);
  });

  it('does not match an unlabeled line whose amount does not match the previous balance', () => {
    expect(suggestIsCarryover({ amount: -50, description: 'Débito não identificado' }, -323.99)).toBe(false);
  });

  it('never suggests positive or zero amounts', () => {
    expect(suggestIsCarryover({ amount: 324, description: 'Valor pendente do mês anterior' }, -323.99)).toBe(false);
    expect(suggestIsCarryover({ amount: 0, description: 'Valor pendente do mês anterior' }, -323.99)).toBe(false);
  });

  it('matches by name alone even when the rolling reference balance is stale/non-negative', () => {
    // A multi-file batch import rolls its reference balance forward without replaying
    // each invoice's own 'paid' reset, so by a later month in the batch that estimate
    // can drift to zero/positive even though the line's wording is unambiguous.
    expect(suggestIsCarryover({ amount: -324, description: 'Valor pendente do mês anterior' }, 0)).toBe(true);
    expect(suggestIsCarryover({ amount: -324, description: 'Valor pendente do mês anterior' }, 50)).toBe(true);
  });
});
