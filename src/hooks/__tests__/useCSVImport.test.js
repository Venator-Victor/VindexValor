/**
 * Tests for CSV import parsing logic.
 *
 * We mock Papa.parse at the top level and configure its behaviour per-test
 * using mockImplementation, so each test controls what "parsed CSV" looks like.
 *
 * The hook exposes parsing in two steps (matching the UI's confirm-mapping flow):
 * parseMultipleCSVsRaw() -> autoDetectMapping() -> applyColumnMapping().
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSVImport } from '../useCSVImport';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/context/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'uid-1' } }),
}));

vi.mock('@/context/FinanceContext', () => ({
  useFinance: () => ({ categories: [] }),
}));

vi.mock('@/hooks/useCustomCategoryMappings', () => ({
  useCustomCategoryMappings: () => ({ mappings: [] }),
}));

const mockSupabaseInsert = vi.fn().mockResolvedValue({ data: [], error: null });
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn(() => mockSupabaseInsert()),
    }),
  },
}));

// Mutable Papa.parse implementation — overridden per test
let papaParseFn = vi.fn();
vi.mock('papaparse', () => ({
  default: { parse: (...args) => papaParseFn(...args) },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_FIELDS = ['date', 'valor', 'descricao'];

function fakePapa(fields, rows) {
  papaParseFn.mockImplementation((_file, { complete }) =>
    complete({ meta: { fields }, data: rows })
  );
}

function makeFile(name = 'test.csv') {
  return { name };
}

function useHook() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- renderHook's callback runs inside a React test renderer, so this is a safe hook call.
  return renderHook(() => useCSVImport()).result;
}

// Mirrors the app's own flow: raw parse -> auto-detect mapping -> apply mapping
async function parseAndMap(result, files) {
  const { headers, data } = await result.current.parseMultipleCSVsRaw(files);
  const mapping = result.current.autoDetectMapping(headers);
  return result.current.applyColumnMapping(data, mapping);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCSVImport – column auto-detection', () => {
  it('leaves date unmapped when the date column is missing', () => {
    const result = useHook();
    const mapping = result.current.autoDetectMapping(['valor', 'descricao']);
    expect(mapping.date).toBe('');
  });

  it('leaves amount unmapped when the amount column is missing', () => {
    const result = useHook();
    const mapping = result.current.autoDetectMapping(['date', 'descricao']);
    expect(mapping.amount).toBe('');
  });

  it('leaves description unmapped when the description column is missing', () => {
    const result = useHook();
    const mapping = result.current.autoDetectMapping(['date', 'valor']);
    expect(mapping.description).toBe('');
  });
});

describe('useCSVImport – row parsing', () => {
  it('returns the correct shape for a valid row', async () => {
    fakePapa(VALID_FIELDS, [
      { date: '2024-06-10', valor: '-50', descricao: 'Almoço' },
    ]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      description: 'Almoço',
      amount: -50,
      type: 'expense',
      date: '2024-06-10',
    });
  });

  it('infers type=income for positive amounts', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-01', valor: '200', descricao: 'Freelance' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].type).toBe('income');
  });

  it('infers type=expense for negative amounts', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-01', valor: '-80', descricao: 'Mercado' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].type).toBe('expense');
  });
});

describe('useCSVImport – date format conversion', () => {
  it('converts dd/mm/yyyy to yyyy-mm-dd', async () => {
    fakePapa(VALID_FIELDS, [{ date: '15/06/2024', valor: '100', descricao: 'Test' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].date).toBe('2024-06-15');
  });

  it('leaves yyyy-mm-dd dates unchanged', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-15', valor: '100', descricao: 'Test' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].date).toBe('2024-06-15');
  });
});

describe('useCSVImport – BRL amount parsing', () => {
  it('parses 1.500,75 (thousands dot, decimal comma) as 1500.75', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-01', valor: '1.500,75', descricao: 'Salário' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].amount).toBeCloseTo(1500.75);
  });

  it('parses a simple comma decimal (500,50) as 500.5', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-01', valor: '500,50', descricao: 'Test' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].amount).toBeCloseTo(500.5);
  });

  it('strips currency symbols (R$) before parsing', async () => {
    fakePapa(VALID_FIELDS, [{ date: '2024-06-01', valor: 'R$ -120,00', descricao: 'Conta' }]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].amount).toBeCloseTo(-120);
  });
});

describe('useCSVImport – header normalisation', () => {
  it('accepts "descrição" (with cedilla) as the description column', async () => {
    fakePapa(['date', 'valor', 'descrição'], [
      { date: '2024-06-01', valor: '10', descrição: 'Pizza' },
    ]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].description).toBe('Pizza');
  });

  it('accepts "Data" (capitalised) as the date column', async () => {
    fakePapa(['Data', 'valor', 'descricao'], [
      { Data: '2024-06-01', valor: '10', descricao: 'X' },
    ]);
    const result = useHook();
    let rows;
    await act(async () => { rows = await parseAndMap(result, [makeFile()]); });
    expect(rows[0].date).toBe('2024-06-01');
  });
});

describe('useCSVImport – multiple files', () => {
  it('concatenates rows from two files', async () => {
    let call = 0;
    const allRows = [
      [{ date: '2024-06-01', valor: '-10', descricao: 'A' }],
      [{ date: '2024-06-02', valor: '-20', descricao: 'B' }],
    ];
    papaParseFn.mockImplementation((_f, { complete }) =>
      complete({ meta: { fields: VALID_FIELDS }, data: allRows[call++] })
    );

    const result = useHook();
    let rows;
    await act(async () => {
      rows = await parseAndMap(result, [makeFile('a.csv'), makeFile('b.csv')]);
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].description).toBe('A');
    expect(rows[1].description).toBe('B');
  });
});