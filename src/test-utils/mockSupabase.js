import { vi } from 'vitest';

/**
 * Creates a chainable Supabase query builder mock.
 * Call `setNextResult(data, error)` before each operation to control what it returns.
 */
export function createQueryBuilder(defaultResult = { data: [], error: null }) {
  let pendingResult = defaultResult;

  const builder = {
    _setResult: (data, error = null) => {
      pendingResult = { data, error };
      return builder;
    },
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve(pendingResult)),
    maybeSingle: vi.fn(() => Promise.resolve(pendingResult)),
    // Make the builder itself thenable so `await supabase.from().select()...` works
    then: (resolve, reject) => Promise.resolve(pendingResult).then(resolve, reject),
  };

  return builder;
}

/**
 * Returns a full Supabase client mock.
 *
 * Usage:
 *   const { supabaseMock, builder } = createSupabaseMock();
 *   vi.mock('@/lib/customSupabaseClient', () => ({ supabase: supabaseMock }));
 *   builder._setResult([{ id: 1 }]);       // before the call under test
 */
export function createSupabaseMock() {
  const builder = createQueryBuilder();

  const authMock = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const supabaseMock = {
    from: vi.fn().mockReturnValue(builder),
    auth: authMock,
  };

  return { supabaseMock, builder, authMock };
}
