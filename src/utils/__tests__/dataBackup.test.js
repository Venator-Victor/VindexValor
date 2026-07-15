import { describe, it, expect, vi } from 'vitest';
import { isValidBackupShape, buildBackupPayload, importBackupData } from '../dataBackup';

const makeSupabaseMock = () => {
  const calls = [];
  const supabase = {
    from: (table) => ({
      insert: vi.fn(async (rows) => {
        calls.push({ table, rows });
        return { error: null };
      }),
    }),
  };
  return { supabase, calls };
};

describe('isValidBackupShape', () => {
  it('accepts an object with at least one known entity array', () => {
    expect(isValidBackupShape({ transactions: [] })).toBe(true);
    expect(isValidBackupShape({ goals: [{ id: '1' }] })).toBe(true);
  });

  it('rejects null, non-objects, and objects with no known arrays', () => {
    expect(isValidBackupShape(null)).toBe(false);
    expect(isValidBackupShape('not an object')).toBe(false);
    expect(isValidBackupShape({})).toBe(false);
    expect(isValidBackupShape({ transactions: 'not an array' })).toBe(false);
  });
});

describe('buildBackupPayload', () => {
  it('includes every entity, not just the original transactions/accounts/categories subset', () => {
    const payload = buildBackupPayload({
      transactions: [1], accounts: [2], categories: [3], investments: [4],
      recurring: [5], parcels: [6], goals: [7], invoices: [8], invoiceItems: [9],
      settings: { currency: 'BRL' }
    });

    expect(payload.goals).toEqual([7]);
    expect(payload.invoices).toEqual([8]);
    expect(payload.invoiceItems).toEqual([9]);
    expect(payload.parcels).toEqual([6]);
    expect(payload.version).toBeDefined();
    expect(payload.exportDate).toBeDefined();
  });
});

describe('importBackupData', () => {
  it('inserts tables in FK dependency order', async () => {
    const { supabase, calls } = makeSupabaseMock();
    await importBackupData(supabase, 'user-1', {
      categories: [{ id: 'c1', name: 'Food' }],
      accounts: [{ id: 'a1', name: 'Checking' }],
      invoices: [{ id: 'i1', account_id: 'a1' }],
      investments: [{ id: 'inv1', account_id: 'a1' }],
      recurring: [{ id: 'r1', category_id: 'c1' }],
      transactions: [{ id: 't1', category_id: 'c1', account_id: 'a1', invoice_id: 'i1' }],
      invoiceItems: [{ id: 'ii1', invoice_id: 'i1', transaction_id: 't1' }],
      parcels: [{ id: 'p1', recurring_item_id: 'r1' }],
      goals: [{ id: 'g1', reserved_account_id: 'a1' }],
    });

    const tableOrder = calls.map(c => c.table);
    expect(tableOrder).toEqual([
      'categories', 'accounts', 'invoices', 'investments', 'recurring_items',
      'transactions', 'invoice_items', 'recurring_installments', 'goals'
    ]);
  });

  it('stamps every row with the current user, overriding whatever user_id it was exported with', async () => {
    const { supabase, calls } = makeSupabaseMock();
    await importBackupData(supabase, 'current-user', {
      accounts: [{ id: 'a1', name: 'Checking', user_id: 'someone-elses-id' }],
    });

    const accountsCall = calls.find(c => c.table === 'accounts');
    expect(accountsCall.rows[0].user_id).toBe('current-user');
  });

  it('strips joined/computed fields that are not real columns', async () => {
    const { supabase, calls } = makeSupabaseMock();
    await importBackupData(supabase, 'user-1', {
      accounts: [{ id: 'a1', name: 'Nubank', current_fatura_value: 500, balance: 100 }],
      transactions: [{ id: 't1', description: 'x', categories: { name: 'Food' }, account: { name: 'Nubank' } }],
    });

    const accountsRow = calls.find(c => c.table === 'accounts').rows[0];
    expect(accountsRow.current_fatura_value).toBeUndefined();
    expect(accountsRow.balance).toBe(100);

    const txRow = calls.find(c => c.table === 'transactions').rows[0];
    expect(txRow.categories).toBeUndefined();
    expect(txRow.account).toBeUndefined();
    expect(txRow.description).toBe('x');
  });

  it('inserts categories in waves so a child never lands in the same insert call as an unresolved parent', async () => {
    const { supabase, calls } = makeSupabaseMock();
    await importBackupData(supabase, 'user-1', {
      categories: [
        { id: 'child', name: 'Restaurants', parent_id: 'parent' },
        { id: 'parent', name: 'Food', parent_id: null },
      ],
    });

    const categoryCalls = calls.filter(c => c.table === 'categories');
    expect(categoryCalls).toHaveLength(2);
    expect(categoryCalls[0].rows).toEqual([{ id: 'parent', name: 'Food', parent_id: null, user_id: 'user-1' }]);
    expect(categoryCalls[1].rows).toEqual([{ id: 'child', name: 'Restaurants', parent_id: 'parent', user_id: 'user-1' }]);
  });

  it('falls back to nulling parent_id when a category points outside the export instead of looping forever', async () => {
    const { supabase, calls } = makeSupabaseMock();
    await importBackupData(supabase, 'user-1', {
      categories: [
        { id: 'orphan', name: 'Mystery', parent_id: 'does-not-exist-in-this-export' },
      ],
    });

    const categoryCalls = calls.filter(c => c.table === 'categories');
    expect(categoryCalls).toHaveLength(1);
    expect(categoryCalls[0].rows[0].parent_id).toBeNull();
  });

  it('surfaces which table failed when an insert errors', async () => {
    const supabase = {
      from: (table) => ({
        insert: vi.fn(async () => {
          if (table === 'accounts') return { error: { message: 'duplicate key value violates unique constraint' } };
          return { error: null };
        }),
      }),
    };

    await expect(importBackupData(supabase, 'user-1', {
      categories: [],
      accounts: [{ id: 'a1', name: 'Checking' }],
    })).rejects.toThrow('accounts: duplicate key value violates unique constraint');
  });
});
