import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FinanceProvider, useFinance } from '../FinanceContext';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockBuilder, mockSupabase } = vi.hoisted(() => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  // Make builder thenable for Promise.all / await
  Object.defineProperty(builder, 'then', {
    get: () => (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej),
  });
  return { mockBuilder: builder, mockSupabase: { from: vi.fn().mockReturnValue(builder) } };
});

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: mockSupabase,
  customSupabaseClient: mockSupabase,
}));

vi.mock('@/contexts/SupabaseAuthContext', () => {
  // Provide user (so CRUD guards pass) but NO session.
  // FinanceProvider only calls fetchAllData when BOTH user AND session are truthy,
  // so omitting session prevents the initial data load from resetting state in tests.
  const user = { id: 'uid-1', email: 'test@test.com' };
  return { useAuth: () => ({ user, session: null, loading: false }) };
});

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rates: {}, fetchRates: vi.fn(), isLoading: false }),
}));

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapper({ children }) {
  return (
    <MemoryRouter>
      <FinanceProvider>{children}</FinanceProvider>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FinanceContext – transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);
  });

  it('createTransaction adds the transaction to state', async () => {
    const tx = { id: 'tx-1', description: 'Lunch', amount: -50, type: 'saida', date: '2024-06-10', categorias: null, contas: null, conta_destino: null, faturas: null };
    mockBuilder.single.mockResolvedValueOnce({ data: tx, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => {
      await result.current.createTransaction({ tipo: 'saida', descricao: 'Lunch', valor: -50, data: '2024-06-10', conta_id: 'acc-1' });
    });

    expect(result.current.transactions).toContainEqual(tx);
  });

  it('updateTransaction replaces the transaction in state', async () => {
    const original = { id: 'tx-1', description: 'Old', amount: -50, type: 'saida', date: '2024-06-10', categorias: null, contas: null, conta_destino: null, faturas: null };
    const updated  = { ...original, description: 'New' };

    mockBuilder.single
      .mockResolvedValueOnce({ data: original, error: null })
      .mockResolvedValueOnce({ data: updated, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });

    await act(async () => {
      await result.current.createTransaction({ tipo: 'saida', descricao: 'Old', valor: -50, data: '2024-06-10', conta_id: 'acc-1' });
    });
    await act(async () => {
      await result.current.updateTransaction('tx-1', { description: 'New' });
    });

    expect(result.current.transactions.find(t => t.id === 'tx-1')?.description).toBe('New');
  });

  it('deleteTransaction removes the transaction from state', async () => {
    const tx = { id: 'tx-del', description: 'To delete', amount: -30, type: 'saida', date: '2024-06-01', categorias: null, contas: null, conta_destino: null, faturas: null };
    mockBuilder.single.mockResolvedValueOnce({ data: tx, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });

    await act(async () => {
      await result.current.createTransaction({ tipo: 'saida', descricao: 'To delete', valor: -30, data: '2024-06-01', conta_id: 'acc-1' });
    });
    await act(async () => {
      await result.current.deleteTransaction('tx-del');
    });

    expect(result.current.transactions.some(t => t.id === 'tx-del')).toBe(false);
  });
});

describe('FinanceContext – accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);
  });

  it('createAccount adds the account to state', async () => {
    const acc = { id: 'acc-1', name: 'Test Bank', type: 'Conta Corrente', initial_balance: 0 };
    mockBuilder.single.mockResolvedValueOnce({ data: acc, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => {
      await result.current.createAccount({ name: 'Test Bank', type: 'Conta Corrente', account_subtype: 'checking', currency: 'BRL' });
    });

    expect(result.current.accounts.some(a => a.id === 'acc-1')).toBe(true);
  });

  it('removeAccount removes the account from state', async () => {
    const acc = { id: 'acc-del', name: 'Remove Me', type: 'Conta Corrente', initial_balance: 0 };
    mockBuilder.single.mockResolvedValueOnce({ data: acc, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });

    await act(async () => {
      await result.current.createAccount({ name: 'Remove Me', type: 'Conta Corrente', account_subtype: 'checking', currency: 'BRL' });
    });
    await act(async () => {
      await result.current.removeAccount('acc-del');
    });

    expect(result.current.accounts.some(a => a.id === 'acc-del')).toBe(false);
  });

  it('createAccount validates credit-card fields and throws on invalid data', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });
    await expect(
      act(async () => {
        await result.current.createAccount({ name: 'Card', type: 'Cartão de Crédito', account_subtype: 'credit_card', credit_limit: 0, currency: 'BRL' });
      })
    ).rejects.toThrow();
  });
});

describe('FinanceContext – categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);
  });

  it('createCategory adds the category to state', async () => {
    const cat = { id: 'cat-1', name: 'Travel', color: '#0ff', icon: 'bx bx-plane' };
    mockBuilder.single.mockResolvedValueOnce({ data: cat, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => {
      await result.current.createCategory({ name: 'Travel', color: '#0ff', icon: 'bx bx-plane' });
    });

    expect(result.current.categories).toContainEqual(cat);
  });

  it('updateCategory updates the category in state', async () => {
    const cat     = { id: 'cat-u', name: 'Old', color: '#f00', icon: 'bx bx-x' };
    const updated = { ...cat, name: 'New' };
    mockBuilder.single
      .mockResolvedValueOnce({ data: cat, error: null })
      .mockResolvedValueOnce({ data: updated, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => { await result.current.createCategory(cat); });
    await act(async () => { await result.current.updateCategory('cat-u', { name: 'New' }); });

    expect(result.current.categories.find(c => c.id === 'cat-u')?.name).toBe('New');
  });

  it('removeCategory removes the category from state', async () => {
    const cat = { id: 'cat-del', name: 'Del', color: '#000', icon: 'bx bx-trash' };
    mockBuilder.single.mockResolvedValueOnce({ data: cat, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => { await result.current.createCategory(cat); });
    await act(async () => { await result.current.removeCategory('cat-del'); });

    expect(result.current.categories.some(c => c.id === 'cat-del')).toBe(false);
  });
});

describe('FinanceContext – settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);
  });

  it('saveSettings applies an optimistic update to local settings state', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: { id: 's-1' }, error: null });
    mockBuilder.single.mockResolvedValueOnce({ data: { currency: 'USD' }, error: null });

    const { result } = renderHook(() => useFinance(), { wrapper });
    await act(async () => { await result.current.saveSettings({ currency: 'USD' }); });

    expect(result.current.settings.currency).toBe('USD');
  });
});
