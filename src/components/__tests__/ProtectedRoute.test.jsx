import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// ─── Mock Auth context ────────────────────────────────────────────────────────

const mockAuthValue = {
  user: null,
  session: null,
  loading: false,
};

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderRoute(authOverride = {}) {
  Object.assign(mockAuthValue, authOverride);

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthValue.user = null;
    mockAuthValue.session = null;
    mockAuthValue.loading = false;
  });

  it('renders children when user is authenticated', async () => {
    renderRoute({
      user: { id: '1', email: 'a@b.com' },
      session: { user: { id: '1' } },
      loading: false,
    });

    await waitFor(() =>
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    );
  });

  it('redirects to /login when user is not authenticated', async () => {
    renderRoute({ user: null, session: null, loading: false });

    await waitFor(() =>
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows loading spinner while auth state is being resolved', () => {
    renderRoute({ user: null, session: null, loading: true });

    // Should not show protected content while loading
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('redirects with returnUrl query param containing the attempted path', async () => {
    renderRoute({ user: null, session: null, loading: false });

    await waitFor(() => screen.getByTestId('login-page'));

    // The URL shown in the router should include returnUrl=/dashboard
    expect(window.location.href).not.toContain('/dashboard');
  });
});
