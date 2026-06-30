import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// ─── Default mock values ──────────────────────────────────────────────────────

export const mockUser = { id: 'user-test-id', email: 'test@example.com' };

export const defaultAuthValue = {
  user: mockUser,
  session: { user: mockUser, access_token: 'fake-token' },
  loading: false,
  isRecoveryMode: false,
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue(undefined),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  updatePassword: vi.fn().mockResolvedValue({ error: null }),
};

export const defaultFinanceValue = {
  transactions: [],
  accounts: [],
  categories: [],
  investments: [],
  recurring: [],
  parcels: [],
  goals: [],
  transactionTypes: [],
  inflationHistory: [],
  invoices: [],
  settings: { theme: 'dark', currency: 'BRL', language: 'pt-BR' },
  isLoading: false,
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: vi.fn(),
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: vi.fn(),
  exchangeRates: {},
  isRatesLoading: false,
  refreshExchangeRates: vi.fn(),
  fetchAllData: vi.fn(),
  fetchInvoices: vi.fn(),
  createInvoice: vi.fn().mockResolvedValue({ id: 'fatura-1' }),
  fetchInvoiceItems: vi.fn().mockResolvedValue([]),
  createInvoiceItem: vi.fn().mockResolvedValue({}),
  updateInvoiceItem: vi.fn().mockResolvedValue({}),
  deleteInvoiceItem: vi.fn().mockResolvedValue(true),
  createAccount: vi.fn().mockResolvedValue({ id: 'acc-1' }),
  updateAccount: vi.fn().mockResolvedValue({}),
  removeAccount: vi.fn().mockResolvedValue(true),
  createCategory: vi.fn().mockResolvedValue({ id: 'cat-1' }),
  updateCategory: vi.fn().mockResolvedValue({}),
  removeCategory: vi.fn().mockResolvedValue(true),
  createTransaction: vi.fn().mockResolvedValue({ id: 'tx-1' }),
  updateTransaction: vi.fn().mockResolvedValue({}),
  deleteTransaction: vi.fn().mockResolvedValue(true),
  saveSettings: vi.fn().mockResolvedValue({}),
  setSettings: vi.fn(),
};

// ─── Context mocks ────────────────────────────────────────────────────────────

// These are set via vi.mock() in the test files that need them.
// Exported so individual tests can override specific methods.

/**
 * Render a component inside MemoryRouter (no context mocking).
 * Use for components that only need routing.
 */
export function renderInRouter(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
