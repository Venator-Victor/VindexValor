import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountModal from '../AccountModal';
import { defaultFinanceValue } from '@/test-utils/renderWithProviders';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const financeValue = { ...defaultFinanceValue };
const mockToast = vi.fn();

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'uid-1', email: 'test@test.com' }, session: {}, loading: false }),
}));

vi.mock('@/context/FinanceContext', () => ({
  useFinance: () => financeValue,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderModal(props = {}) {
  const defaults = { isOpen: true, onClose: vi.fn(), accountToEdit: null, initialData: null };
  return render(<AccountModal {...defaults} {...props} />);
}

/**
 * SelectInput renders a <button> showing the currently-selected option's label.
 * Click it to open the dropdown, then click the desired option text.
 */
async function selectOption(currentDisplayText, newOptionText) {
  await userEvent.click(screen.getByText(currentDisplayText));
  await userEvent.click(screen.getByText(newOptionText));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AccountModal – rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the modal when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Nova Conta')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Nova Conta')).not.toBeInTheDocument();
  });

  it('shows "Editar Conta" title when editing', () => {
    renderModal({ accountToEdit: { id: '1', name: 'My Bank', type: 'Conta Corrente', account_subtype: 'checking' } });
    expect(screen.getByText('Editar Conta')).toBeInTheDocument();
  });

  it('shows credit-card fields when Cartão de Crédito is selected', async () => {
    renderModal();
    // The SelectInput trigger shows the currently selected option label
    await selectOption('Conta Corrente', 'Cartão de Crédito');
    expect(screen.getByText('Limite do Cartão *')).toBeInTheDocument();
  });

  it('does not show credit-limit field for checking accounts', () => {
    renderModal();
    expect(screen.queryByText('Limite do Cartão *')).not.toBeInTheDocument();
  });
});

describe('AccountModal – validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not call createAccount when name is empty', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(financeValue.createAccount).not.toHaveBeenCalled();
  });

  it('shows validation toast when credit card has no credit limit', async () => {
    renderModal();
    await userEvent.type(screen.getByLabelText('Nome da Conta *'), 'My Card');
    await selectOption('Conta Corrente', 'Cartão de Crédito');
    // Submit without filling credit limit
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
    );
    expect(financeValue.createAccount).not.toHaveBeenCalled();
  });
});

describe('AccountModal – submission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls createAccount for a new checking account', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await userEvent.type(screen.getByLabelText('Nome da Conta *'), 'Nubank');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() =>
      expect(financeValue.createAccount).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nubank', type: 'Conta Corrente' })
      )
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('calls updateAccount (not createAccount) when editing an existing account', async () => {
    const account = {
      id: 'acc-1', name: 'Old Name', type: 'Conta Corrente',
      account_subtype: 'checking', color: '#000', icon: 'bx bx-wallet', currency: 'BRL',
    };
    renderModal({ accountToEdit: account });
    const nameInput = screen.getByLabelText('Nome da Conta *');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(financeValue.updateAccount).toHaveBeenCalled());
    expect(financeValue.createAccount).not.toHaveBeenCalled();
  });
});
