import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn, loading: false }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders a link to the signup page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /cadastre-se/i })).toBeInTheDocument();
  });

  it('renders forgot-password link', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /esqueceu/i })).toBeInTheDocument();
  });

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'secret123');
  });

  it('navigates to /dashboard on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('does not navigate when login fails', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
