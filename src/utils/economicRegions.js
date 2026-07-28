import { supabase } from '@/lib/customSupabaseClient';

// Single source of truth for which country's central-bank data backs the
// inflation-related charts (InflationCard, IncomeVsInflationChart,
// M2VsInflationChart). Driven by the user's Preferences currency instead of
// a per-chart toggle, so switching currency once changes all of them.
export const CURRENCY_TO_REGION = { BRL: 'BR', USD: 'US', EUR: 'EU' };

export const regionForCurrency = (currency) => CURRENCY_TO_REGION[currency] || 'BR';

// Each region has two "metric" series (m2, inflation), independently
// configured since they can come from different tables/columns and have
// different earliest-available dates even within the same region — e.g.
// BR's IPCA (inflation_data) starts 1995 but BCB M2 (monetary_aggregates)
// only starts 2002.
export const ECONOMIC_REGIONS = {
  BR: {
    currency: 'BRL',
    comingSoon: false,
    titleKey: 'm2.card_title_br',
    subtitleKey: 'm2.card_subtitle_br',
    sourceLabelKey: 'm2.source_bcb',
    m2: {
      table: 'monetary_aggregates',
      column: 'value',
      isRate: false,
      firstYear: 2002,
      probePeriod: '2002-06',
      syncFunction: 'fetch-m2-data',
      filters: {},
    },
    inflation: {
      table: 'inflation_data',
      column: 'inflation_value',
      // IPCA is a monthly % rate, so its cumulative index has to be compounded.
      isRate: true,
      firstYear: 1995,
      probePeriod: '1995-03',
      syncFunction: 'fetch-inflation-data',
      filters: {},
    },
  },
  US: {
    currency: 'USD',
    // Requires a FRED_API_KEY secret that isn't set up yet — gated off in the UI.
    comingSoon: true,
    titleKey: 'm2.card_title_us',
    subtitleKey: 'm2.card_subtitle_us',
    sourceLabelKey: 'm2.source_fred',
    m2: {
      table: 'foreign_economic_indicators',
      column: 'value',
      isRate: false,
      firstYear: 1959,
      probePeriod: '1959-06',
      syncFunction: 'fetch-fred-data',
      filters: { country: 'US', indicator: 'M2' },
    },
    inflation: {
      table: 'foreign_economic_indicators',
      column: 'value',
      // CPIAUCSL is already an index level, indexed the same way as M2.
      isRate: false,
      firstYear: 1959,
      probePeriod: '1959-06',
      syncFunction: 'fetch-fred-data',
      filters: { country: 'US', indicator: 'CPI' },
    },
  },
  EU: {
    currency: 'EUR',
    comingSoon: false,
    titleKey: 'm2.card_title_eu',
    subtitleKey: 'm2.card_subtitle_eu',
    sourceLabelKey: 'm2.source_ecb',
    m2: {
      table: 'foreign_economic_indicators',
      column: 'value',
      isRate: false,
      firstYear: 1996,
      probePeriod: '1996-06',
      syncFunction: 'fetch-ecb-data',
      filters: { country: 'EU', indicator: 'M2' },
    },
    inflation: {
      table: 'foreign_economic_indicators',
      column: 'value',
      // HICP is already an index level, indexed the same way as M2.
      isRate: false,
      firstYear: 1996,
      probePeriod: '1996-06',
      syncFunction: 'fetch-ecb-data',
      filters: { country: 'EU', indicator: 'CPI' },
    },
  },
};

const applyFilters = (query, filters) =>
  Object.entries(filters).reduce((q, [key, value]) => q.eq(key, value), query);

// Best-effort: kicks off a backfill sync if the metric has no data yet.
// Never throws — a failed/unavailable sync just means the chart shows
// whatever's already in the table (or nothing, handled by the caller).
export const ensureBackfilled = async (metric) => {
  const probeQuery = applyFilters(
    supabase.from(metric.table).select('period').lte('period', metric.probePeriod).limit(1),
    metric.filters
  );
  const { data: probe } = await probeQuery;
  if (probe?.length) return;

  try {
    const { error } = await supabase.functions.invoke(metric.syncFunction, { body: { syncAll: true } });
    if (error) console.warn(`${metric.syncFunction} backfill skipped:`, error.message);
  } catch (e) {
    console.warn(`${metric.syncFunction} backfill exception:`, e);
  }
};

// Fetches a metric's series, normalized to {period, value} regardless of
// which table/column it actually lives in.
export const fetchSeries = async (metric, { gtePeriod } = {}) => {
  let query = supabase
    .from(metric.table)
    .select(`period, value:${metric.column}`)
    .gte('period', gtePeriod ?? `${metric.firstYear}-01`)
    .order('period', { ascending: true });
  query = applyFilters(query, metric.filters);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => ({ period: r.period, value: Number(r.value) }));
};

// Builds a cumulative index anchored to 100 at periods[0]. Rate series
// (e.g. IPCA's monthly %) are compounded month over month; level series
// (M2, CPI, HICP) are indexed directly against the base period's value.
export const buildCumulativeIndex = (periods, valueByPeriod, isRate) => {
  if (isRate) {
    return periods.reduce((acc, period, index) => {
      if (index === 0) return acc.concat(100);
      const rate = valueByPeriod.get(period) || 0;
      return acc.concat(acc[acc.length - 1] * (1 + rate / 100));
    }, []);
  }
  const base = valueByPeriod.get(periods[0]);
  return periods.map((period) => {
    const value = valueByPeriod.get(period);
    return base && value !== undefined ? (value / base) * 100 : null;
  });
};
