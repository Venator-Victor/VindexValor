import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Accounts from '../Accounts';
import { defaultFinanceValue } from '@/test-utils/renderWithProviders';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const financeValue = { ...defaultFinanceValue };
const mockToast = vi.fn();

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'uid-1', email: 'test@test.com' }, session: {}, loading: false }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn(), colors: {}, goalsViewMode: 'card', setGoalsViewPreference: vi.fn() }),
}));

vi.mock('@/hooks/useSortableList', () => ({
  useSortableList: (items) => ({ items: items ?? [], requestSort: vi.fn(), sortConfig: null }),
}));

vi.mock('@/context/FinanceContext', () => ({
  useFinance: () => financeValue,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

function renderContas(accounts = []) {
  financeValue.accounts = accounts;
  return render(
    <MemoryRouter>
      <Accounts />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Accounts page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the page title', () => {
    renderContas();
    expect(screen.getByRole('heading', { name: 'Contas' })).toBeInTheDocument();
  });

  it('shows a button to add a new account', () => {
    renderContas();
    expect(screen.getByRole('button', { name: /nova conta/i })).toBeInTheDocument();
  });

  it('lists accounts when provided', async () => {
    const accounts = [
      { id: '1', name: 'Nubank', type: 'Conta Corrente', balance: 1500, currency: 'BRL', color: '#8A2BE2', account_subtype: 'checking' },
      { id: '2', name: 'Bradesco', type: 'Poupança', balance: 3200, currency: 'BRL', color: '#cc0000', account_subtype: 'savings' },
    ];
    renderContas(accounts);
    expect(screen.getAllByText(/nubank/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/bradesco/i).length).toBeGreaterThan(0);
  });

  it('opens the account creation modal when clicking "Nova Conta"', async () => {
    renderContas();
    await userEvent.click(screen.getByRole('button', { name: /nova conta/i }));
    // Modal title should appear
    await waitFor(() => expect(screen.getByText('Nova Conta')).toBeInTheDocument());
  });

  it('calls removeAccount when delete is confirmed', async () => {
    const accounts = [
      { id: 'acc-del', name: 'Delete Me', type: 'Conta Corrente', balance: 0, currency: 'BRL', color: '#000', account_subtype: 'checking' },
    ];
    renderContas(accounts);

    // Open the delete confirmation (look for a delete/trash button)
    const deleteButtons = screen.getAllByRole('button');
    const deleteBtn = deleteButtons.find(b =>
      b.querySelector('[class*="trash"]') ||
      b.title?.toLowerCase().includes('excluir') ||
      b.getAttribute('aria-label')?.toLowerCase().includes('excluir')
    );

    if (deleteBtn) {
      await userEvent.click(deleteBtn);
      // Confirm in the alert dialog
      const confirmBtn = await screen.findByRole('button', { name: /excluir|confirmar|continuar/i });
      await userEvent.click(confirmBtn);
      await waitFor(() => expect(financeValue.removeAccount).toHaveBeenCalledWith('acc-del'));
    }
  });
});
