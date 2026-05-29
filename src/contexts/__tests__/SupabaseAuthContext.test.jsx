import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../SupabaseAuthContext';

// ─── Hoisted mocks (available inside vi.mock factories) ───────────────────────

const mockAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { auth: mockAuth },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Test consumer ────────────────────────────────────────────────────────────

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user?.email ?? 'no-user'}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <button onClick={() => auth.signIn('a@b.com', 'pass123')}>sign-in</button>
      <button onClick={() => auth.signUp('a@b.com', 'pass123')}>sign-up</button>
      <button onClick={() => auth.signOut()}>sign-out</button>
      <button onClick={() => auth.resetPasswordForEmail('a@b.com')}>reset</button>
      <button onClick={() => auth.updatePassword('newpass')}>update-pw</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SupabaseAuthContext – initial state', () => {
  it('starts with no user when session is null', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('restores user from an existing session', async () => {
    const session = { user: { id: '1', email: 'user@test.com' } };
    mockAuth.getSession.mockResolvedValue({ data: { session }, error: null });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('user@test.com'));
  });
});

describe('SupabaseAuthContext – signIn', () => {
  beforeEach(() => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('calls signInWithPassword with the given credentials', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => screen.getByText('sign-in'));
    await userEvent.click(screen.getByText('sign-in'));
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass123' });
  });

  it('still calls signInWithPassword when credentials are wrong (error returned, not thrown)', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid' } });
    renderAuth();
    await waitFor(() => screen.getByText('sign-in'));
    await userEvent.click(screen.getByText('sign-in'));
    expect(mockAuth.signInWithPassword).toHaveBeenCalled();
  });
});

describe('SupabaseAuthContext – signUp', () => {
  beforeEach(() => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('calls supabase.auth.signUp', async () => {
    mockAuth.signUp.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => screen.getByText('sign-up'));
    await userEvent.click(screen.getByText('sign-up'));
    expect(mockAuth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass123', options: undefined });
  });
});

describe('SupabaseAuthContext – signOut', () => {
  beforeEach(() => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('navigates to /login after sign out', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => screen.getByText('sign-out'));
    await userEvent.click(screen.getByText('sign-out'));
    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('still navigates to /login on a 403 sign-out error', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { status: 403 } });
    renderAuth();
    await waitFor(() => screen.getByText('sign-out'));
    await userEvent.click(screen.getByText('sign-out'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

describe('SupabaseAuthContext – resetPasswordForEmail', () => {
  beforeEach(() => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('calls resetPasswordForEmail with a redirect URL', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => screen.getByText('reset'));
    await userEvent.click(screen.getByText('reset'));
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      'a@b.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
    );
  });
});

describe('SupabaseAuthContext – updatePassword', () => {
  beforeEach(() => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('calls supabase.auth.updateUser', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => screen.getByText('update-pw'));
    await userEvent.click(screen.getByText('update-pw'));
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
  });
});

describe('SupabaseAuthContext – auth state listener', () => {
  it('unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const { unmount } = renderAuth();
    await waitFor(() => screen.getByTestId('loading'));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
