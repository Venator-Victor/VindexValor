import { describe, it, expect } from 'vitest';
import { computeInvoiceBalances, getEffectiveInvoiceStatus } from '../invoiceBalance';

describe('computeInvoiceBalances', () => {
  it('carries the previous invoice balance into the next one', () => {
    const invoices = [
      { id: 'april', account_id: 'acc1', closing_date: '2024-05-01' },
      { id: 'may', account_id: 'acc1', closing_date: '2024-06-01' },
    ];
    const itemsByInvoiceId = {
      april: [
        { amount: -310.4 },
        { amount: -13.59 },
      ],
      may: [
        { amount: 324 },
        { amount: -166.8 },
      ],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId);

    expect(result.april.openingBalance).toBe(0);
    expect(result.april.periodTotal).toBeCloseTo(-323.99, 2);
    expect(result.april.closingBalance).toBeCloseTo(-323.99, 2);

    expect(result.may.openingBalance).toBeCloseTo(-323.99, 2);
    expect(result.may.periodTotal).toBeCloseTo(157.2, 2);
    expect(result.may.closingBalance).toBeCloseTo(-166.79, 2);
  });

  it('keeps separate accounts independent', () => {
    const invoices = [
      { id: 'a1', account_id: 'acc1', closing_date: '2024-05-01' },
      { id: 'b1', account_id: 'acc2', closing_date: '2024-05-01' },
    ];
    const itemsByInvoiceId = {
      a1: [{ amount: -100 }],
      b1: [{ amount: -50 }],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId);

    expect(result.a1.closingBalance).toBe(-100);
    expect(result.b1.closingBalance).toBe(-50);
  });

  it('carries an overpayment forward as a credit', () => {
    const invoices = [
      { id: 'i1', account_id: 'acc1', closing_date: '2024-05-01' },
      { id: 'i2', account_id: 'acc1', closing_date: '2024-06-01' },
    ];
    const itemsByInvoiceId = {
      i1: [{ amount: -100 }],
      i2: [{ amount: 150 }, { amount: -20 }],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId);

    expect(result.i1.closingBalance).toBe(-100);
    // paid 150 against a 100 debt, plus a new 20 charge -> 30 credit remaining
    expect(result.i2.closingBalance).toBe(30);
  });

  it('handles an invoice with no items', () => {
    const invoices = [{ id: 'empty', account_id: 'acc1', closing_date: '2024-05-01' }];
    const result = computeInvoiceBalances(invoices, {});
    expect(result.empty).toEqual({ openingBalance: 0, periodTotal: 0, closingBalance: 0 });
  });

  it('nets a linked payment transaction against the invoice it was paid through, carrying the reduced balance forward', () => {
    const invoices = [
      { id: 'i1', account_id: 'acc1', closing_date: '2024-05-01' },
      { id: 'i2', account_id: 'acc1', closing_date: '2024-06-01' },
    ];
    const itemsByInvoiceId = {
      i1: [{ amount: -100 }],
      i2: [{ amount: -40 }],
    };
    // App-linked payment: a transactions row (negative amount) attached via invoice_id,
    // not an invoice_items row — fully settles i1's 100 debt.
    const paymentsByInvoiceId = {
      i1: [{ amount: -100 }],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId, paymentsByInvoiceId);

    expect(result.i1.closingBalance).toBe(0);
    // i1 was fully paid, so i2 should start from 0, not from -100.
    expect(result.i2.openingBalance).toBe(0);
    expect(result.i2.closingBalance).toBe(-40);
  });

  it('does not carry a paid invoice\'s debt forward, even if its own items/payments do not net to zero', () => {
    // Three invoices marked paid (e.g. via a manual status edit, or paid by some means
    // outside the app) with no offsetting items/payments recorded at all — each still
    // reports its own historical -1000, but none of that should reach the last invoice.
    const invoices = [
      { id: 'jan', account_id: 'acc1', closing_date: '2024-01-01', status: 'paid' },
      { id: 'feb', account_id: 'acc1', closing_date: '2024-02-01', status: 'paid' },
      { id: 'mar', account_id: 'acc1', closing_date: '2024-03-01', status: 'paid' },
      { id: 'apr', account_id: 'acc1', closing_date: '2024-04-01', status: 'open' },
    ];
    const itemsByInvoiceId = {
      jan: [{ amount: -1000 }],
      feb: [{ amount: -1000 }],
      mar: [{ amount: -1000 }],
      apr: [{ amount: -1000 }],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId);

    // Each paid invoice still shows what it actually billed, historically.
    expect(result.jan.closingBalance).toBe(-1000);
    expect(result.feb.closingBalance).toBe(-1000);
    expect(result.mar.closingBalance).toBe(-1000);
    // But none of that carries forward — the last (unpaid) invoice only owes its own amount.
    expect(result.apr.openingBalance).toBe(0);
    expect(result.apr.closingBalance).toBe(-1000);
  });

  it('resumes carrying the balance forward again after an unpaid invoice breaks the paid streak', () => {
    const invoices = [
      { id: 'jan', account_id: 'acc1', closing_date: '2024-01-01', status: 'paid' },
      { id: 'feb', account_id: 'acc1', closing_date: '2024-02-01', status: 'open' },
      { id: 'mar', account_id: 'acc1', closing_date: '2024-03-01', status: 'open' },
    ];
    const itemsByInvoiceId = {
      jan: [{ amount: -1000 }],
      feb: [{ amount: -500 }],
      mar: [{ amount: -200 }],
    };

    const result = computeInvoiceBalances(invoices, itemsByInvoiceId);

    expect(result.feb.openingBalance).toBe(0);
    expect(result.feb.closingBalance).toBe(-500);
    // feb is unpaid, so mar carries feb's debt forward as usual.
    expect(result.mar.openingBalance).toBe(-500);
    expect(result.mar.closingBalance).toBe(-700);
  });
});

describe('getEffectiveInvoiceStatus', () => {
  it('promotes an open invoice to closed once its closing_date has passed', () => {
    const invoice = { status: 'open', closing_date: '2020-01-01' };
    expect(getEffectiveInvoiceStatus(invoice)).toBe('closed');
  });

  it('treats an open invoice closing today as closed', () => {
    const today = new Date().toISOString().slice(0, 10);
    const invoice = { status: 'open', closing_date: today };
    expect(getEffectiveInvoiceStatus(invoice)).toBe('closed');
  });

  it('leaves an open invoice open when its closing_date is in the future', () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 5);
    const invoice = { status: 'open', closing_date: farFuture.toISOString().slice(0, 10) };
    expect(getEffectiveInvoiceStatus(invoice)).toBe('open');
  });

  it('never reverts an already-closed or paid invoice', () => {
    expect(getEffectiveInvoiceStatus({ status: 'closed', closing_date: '2099-01-01' })).toBe('closed');
    expect(getEffectiveInvoiceStatus({ status: 'paid', closing_date: '2020-01-01' })).toBe('paid');
  });

  it('handles a missing closing_date gracefully', () => {
    expect(getEffectiveInvoiceStatus({ status: 'open', closing_date: null })).toBe('open');
    expect(getEffectiveInvoiceStatus(null)).toBe('open');
  });
});
