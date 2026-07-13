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
