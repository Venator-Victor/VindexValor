import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../TransactionForm';
import { defaultFinanceValue } from '@/test-utils/renderWithProviders';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const financeValue = {
  ...defaultFinanceValue,
  accounts: [
    { id: 'acc-1', name: 'Nubank', type: 'Conta Corrente', currency: 'BRL' },
    { id: 'acc-2', name: 'Bradesco', type: 'Conta Corrente', currency: 'BRL' },
  ],
  categories: [
    { id: 'cat-1', name: 'Alimentação', color: '#ff0', icon: 'bx bx-food' },
  ],
};

const mockToast = vi.fn();

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'uid-1', email: 'test@test.com' }, session: {}, loading: false }),
}));

vi.mock('@/context/FinanceContext', () => ({
  useFinance: () => financeValue,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/hooks/useAutoMappingCategories', () => ({
  useAutoMappingCategories: () => ({
    saveCategoryMapping: vi.fn(),
    getSuggestedCategory: vi.fn().mockReturnValue(null),
  }),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderForm(props = {}) {
  const defaults = { onSuccess: vi.fn(), onCancel: vi.fn(), initialData: null };
  return render(<TransactionForm {...defaults} {...props} />);
}

/**
 * SelectInput renders a <button> whose text is the currently-selected option's
 * label. Click that button to open the dropdown, then click the desired option.
 */
async function selectOption(currentDisplayText, newOptionText) {
  await userEvent.click(screen.getByText(currentDisplayText));
  await userEvent.click(screen.getByText(newOptionText));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionForm – rendering', () => {
  it('renders description and submit button', () => {
    renderForm();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
  });

  it('renders the Tipo de Transação selector', () => {
    renderForm();
    expect(screen.getByText('Tipo de Transação')).toBeInTheDocument();
  });

  it('renders a Categoria field for saida transactions', () => {
    renderForm();
    // Default type is saida; category selector should be visible
    expect(screen.getByText('Categoria')).toBeInTheDocument();
  });
});

describe('TransactionForm – type switching', () => {
  it('shows destination account for transferencia', async () => {
    renderForm();
    // SelectInput trigger shows the currently selected option label ("Saída")
    await selectOption('Saída', 'Transferência');
    expect(screen.getByText(/conta destino/i)).toBeInTheDocument();
  });

  it('hides category selector for transferencia', async () => {
    renderForm();
    await selectOption('Saída', 'Transferência');
    expect(screen.queryByText(/^Categoria$/)).not.toBeInTheDocument();
  });
});

describe('TransactionForm – editing', () => {
  it('pre-fills description from initialData', () => {
    renderForm({
      initialData: {
        id: 'tx-1', type: 'entrada', description: 'Salário',
        amount: 3000, date: '2024-06-01', conta_id: 'acc-1', categoria_id: null,
      },
    });
    expect(screen.getByLabelText('Descrição')).toHaveValue('Salário');
  });

  it('calls updateTransaction when editing an existing transaction', async () => {
    renderForm({
      initialData: {
        id: 'tx-1', type: 'saida', description: 'Old',
        amount: -100, date: '2024-06-01', conta_id: 'acc-1', categoria_id: null,
      },
    });
    const desc = screen.getByLabelText('Descrição');
    await userEvent.clear(desc);
    await userEvent.type(desc, 'New Desc');
    await userEvent.click(screen.getByRole('button', { name: /atualizar/i }));
    await waitFor(() => expect(financeValue.updateTransaction).toHaveBeenCalled());
    expect(financeValue.createTransaction).not.toHaveBeenCalled();
  });
});
