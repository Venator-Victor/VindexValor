import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSignUp = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => ({ signUp: mockSignUp, loading: false }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

function renderSignup() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignupPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all form fields', () => {
    renderSignup();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
  });

  it('renders submit and login link', () => {
    renderSignup();
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument();
  });

  it('calls signUp when form is valid', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    renderSignup();

    await userEvent.type(screen.getByLabelText(/^email$/i), 'new@user.com');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'strongpass');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'strongpass');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(mockSignUp).toHaveBeenCalledWith('new@user.com', 'strongpass');
  });

  it('shows error toast when passwords do not match', async () => {
    renderSignup();

    await userEvent.type(screen.getByLabelText(/^email$/i), 'new@user.com');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'pass1234');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'different');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows error toast when password is shorter than 8 characters', async () => {
    renderSignup();

    await userEvent.type(screen.getByLabelText(/^email$/i), 'new@user.com');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard after successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    renderSignup();

    await userEvent.type(screen.getByLabelText(/^email$/i), 'new@user.com');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'strongpass');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'strongpass');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('does not navigate when signup returns an error', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already taken' } });
    renderSignup();

    await userEvent.type(screen.getByLabelText(/^email$/i), 'dup@user.com');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'strongpass');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'strongpass');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
