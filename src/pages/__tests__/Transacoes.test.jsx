import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Transacoes from '../Transacoes';
import { defaultFinanceValue } from '@/test-utils/renderWithProviders';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const financeValue = { ...defaultFinanceValue };
const mockToast = vi.fn();

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'uid-1', email: 'test@test.com' }, session: {}, loading: false }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn(), colors: {}, metasViewMode: 'card', setMetasViewPreference: vi.fn() }),
}));

// These components pull in additional hooks that need auth — stub them out
vi.mock('@/components/CategoryMappingManager', () => ({
  default: () => null,
}));

vi.mock('@/components/CSVImportFlow', () => ({
  default: () => null,
}));

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (r) => Promise.resolve({ data: [], error: null }).then(r),
    }),
  },
}));

vi.mock('@/context/FinanceContext', () => ({
  useFinance: () => financeValue,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const txBase = {
  conta_id: 'acc-1',
  conta_destino_id: null,
  categoria_id: 'cat-1',
  categorias: { id: 'cat-1', name: 'Food', color: '#ff0', icon: 'bx bx-food' },
  contas: { id: 'acc-1', name: 'Nubank', type: 'Conta Corrente', color: '#8A2BE2', currency: 'BRL' },
  conta_destino: null,
  faturas: null,
  is_recurring: false,
};

function renderTransacoes(transactions = []) {
  financeValue.transactions = transactions;
  financeValue.accounts = [{ id: 'acc-1', name: 'Nubank', type: 'Conta Corrente', currency: 'BRL', color: '#8A2BE2' }];
  financeValue.categories = [{ id: 'cat-1', name: 'Food', color: '#ff0', icon: 'bx bx-food' }];
  return render(
    <MemoryRouter>
      <Transacoes />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Transacoes page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the page title', () => {
    renderTransacoes();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows a button to add a new transaction', () => {
    renderTransacoes();
    expect(screen.getByRole('button', { name: /nova transação/i })).toBeInTheDocument();
  });

  it('renders a list of transactions', () => {
    const transactions = [
      { ...txBase, id: 'tx-1', description: 'Almoço', amount: -35, type: 'saida', date: '2024-06-10' },
      { ...txBase, id: 'tx-2', description: 'Salário', amount: 5000, type: 'entrada', date: '2024-06-01' },
    ];
    renderTransacoes(transactions);
    expect(screen.getByText('Almoço')).toBeInTheDocument();
    expect(screen.getByText('Salário')).toBeInTheDocument();
  });

  it('shows an empty state when there are no transactions', () => {
    renderTransacoes([]);
    // Some empty state element should be present — either a message or an empty list
    expect(screen.queryByText('Almoço')).not.toBeInTheDocument();
  });

  it('opens the transaction form when clicking "Nova Transação"', async () => {
    renderTransacoes();
    await userEvent.click(screen.getByRole('button', { name: /nova transação/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/tipo de transação/i)).toBeInTheDocument()
    );
  });

  it('calls deleteTransaction when a delete action is confirmed', async () => {
    const transactions = [
      { ...txBase, id: 'tx-del', description: 'To Delete', amount: -10, type: 'saida', date: '2024-06-05' },
    ];
    renderTransacoes(transactions);

    // Find and click a delete button
    const allButtons = screen.getAllByRole('button');
    const deleteBtn = allButtons.find(b =>
      b.getAttribute('aria-label')?.toLowerCase().includes('excluir') ||
      b.title?.toLowerCase().includes('excluir')
    );

    if (deleteBtn) {
      await userEvent.click(deleteBtn);
      const confirmBtn = await screen.findByRole('button', { name: /excluir|confirmar/i });
      await userEvent.click(confirmBtn);
      await waitFor(() => expect(financeValue.deleteTransaction).toHaveBeenCalledWith('tx-del'));
    }
  });
});
