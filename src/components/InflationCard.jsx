import { DANGER, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle, RefreshCw, GridLines, Equal, TrendingDown } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
const Loader2 = RefreshCw;
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const REFERENCE_AMOUNT = 1000;

const formatYAxisValue = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

const CustomTooltip = ({ active, payload, label, showValue, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {showValue ? t('inflation.purchasing_power_loss') : t('inflation.cumulative_tooltip')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {showValue ? formatCurrency(entry.value) : `${entry.value.toFixed(2)}%`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StyledSelect = ({ className = '', ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`appearance-none bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg pl-3 pr-7 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 disabled:opacity-50 cursor-pointer ${className}`}
    />
    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-vindex-text/40" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </div>
);

const FIRST_YEAR = 1995;
const CURRENT_YEAR = new Date().getFullYear();

const ALL_YEARS = Array.from(
  { length: CURRENT_YEAR - FIRST_YEAR + 1 },
  (_, i) => String(FIRST_YEAR + i)
);

// Same card shell/icon/header pattern as the dashboard charts (AssetLiabilityChart,
// BudgetConsumptionChart, etc.) — GridLines toggles axis labels, Equal swaps the
// cumulative-% line for its R$ purchasing-power-loss equivalent.
const InflationCard = ({ currentBalance }) => {
  const { t } = useTranslation();
  const PERIOD_OPTIONS = [
    { label: t('inflation.period_3m'), months: 3 },
    { label: t('inflation.period_6m'), months: 6 },
    { label: t('inflation.period_1y'), months: 12 },
    { label: t('inflation.period_2y'), months: 24 },
    { label: t('inflation.period_5y'), months: 60 },
    { label: t('inflation.period_10y'), months: 120 },
    { label: t('inflation.period_20y'), months: 240 },
  ];
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [showAxis, setShowAxis] = useState(true);
  const [showValue, setShowValue] = useState(false);

  // 'period' | 'range' | 'all'
  const [mode, setMode] = useState('period');
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [rangeStart, setRangeStart] = useState(String(CURRENT_YEAR - 5));
  const [rangeEnd, setRangeEnd] = useState(String(CURRENT_YEAR));

  const textColor = chartText(isDark);
  const gridColor = chartGrid(isDark);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if we already have historical data going back to 1995
        const { data: probe } = await supabase
          .from('inflation_data')
          .select('period')
          .lte('period', '1995-03')
          .limit(1);

        if (!probe?.length) {
          // Backfill from BCB: Jan 1995 → today (best-effort; non-fatal if function unavailable)
          setSyncing(true);
          try {
            const { data: syncResult, error: syncError } = await supabase.functions.invoke(
              'fetch-inflation-data',
              { body: { syncAll: true } }
            );
            if (syncError) console.warn('Inflation backfill skipped:', syncError.message);
            else if (syncResult?.error) console.warn('Inflation backfill error:', syncResult.error);
          } catch (e) {
            console.warn('Inflation backfill exception:', e);
          } finally {
            setSyncing(false);
          }
        }

        const { data, error: dbError } = await supabase
          .from('inflation_data')
          .select('period, inflation_value')
          .gte('period', `${FIRST_YEAR}-01`)
          .order('period', { ascending: true });

        if (dbError) throw dbError;
        setAllData(data ?? []);
      } catch (err) {
        setError(err.message || t('inflation.load_data_error'));
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    };

    loadData();
  }, [t]);

  const filteredData = useMemo(() => {
    if (!allData.length) return [];
    if (mode === 'all') return allData;
    if (mode === 'period') return allData.slice(-selectedMonths);
    // range
    return allData.filter(
      r => r.period >= `${rangeStart}-01` && r.period <= `${rangeEnd}-12`
    );
  }, [allData, mode, selectedMonths, rangeStart, rangeEnd]);

  const { chartData, totalCumulative } = useMemo(() => {
    if (!filteredData.length) return { chartData: [], totalCumulative: 0 };

    const compounds = filteredData.reduce(
      (acc, item) => acc.concat(acc[acc.length - 1] * (1 + Number(item.inflation_value) / 100)),
      [1]
    ).slice(1);

    const data = filteredData.map((item, i) => {
      const [year, month] = item.period.split('-');
      const cumulative = parseFloat(((compounds[i] - 1) * 100).toFixed(2));
      return {
        name: `${month}/${year}`,
        cumulative,
        worth: parseFloat((REFERENCE_AMOUNT / (1 + cumulative / 100)).toFixed(2)),
      };
    });

    return {
      chartData: data,
      totalCumulative: data.length ? data[data.length - 1].cumulative : 0,
    };
  }, [filteredData]);

  const currentWorth = REFERENCE_AMOUNT / (1 + totalCumulative / 100);

  const isShortPeriod = chartData.length <= 36;
  const isVeryLongPeriod = chartData.length > 60;

  // Explicit tick list: always land on January entries so labels never disappear
  // regardless of what month the slice starts on.
  const xAxisTicks = useMemo(() => {
    if (isShortPeriod) return undefined;
    const yearStep = isVeryLongPeriod ? (isMobile ? 10 : 5) : 1;
    return chartData
      .filter(d => d.name.startsWith('01/') && parseInt(d.name.substring(3)) % yearStep === 0)
      .map(d => d.name);
  }, [chartData, isShortPeriod, isVeryLongPeriod, isMobile]);

  const xAxisTickFormatter = (value) =>
    isShortPeriod ? value : value.substring(3);

  const modeButtonClass = (m) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      mode === m
        ? 'bg-red-400 text-white font-medium'
        : 'text-gray-500 dark:text-vindex-text/60 hover:text-gray-800 dark:hover:text-vindex-text'
    }`;

  if (error) {
    return (
      <div className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col items-center justify-center h-[300px]">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-gray-900 dark:text-white font-medium mb-2">{t('common.error_loading')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" /> {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm mb-6 relative"
    >
      <UiTooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
              type="button"
              onClick={() => setShowAxis(v => !v)}
              className={`absolute top-4 left-4 p-1.5 rounded-md transition-colors z-10 ${
                showAxis
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
              }`}
          >
              <GridLines size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showAxis ? t('common.hide_axis_labels') : t('common.show_axis_labels')}</TooltipContent>
      </UiTooltip>
      <UiTooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
              type="button"
              onClick={() => setShowValue(v => !v)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
                showValue
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
              }`}
          >
              <Equal size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showValue ? t('inflation.chart_hide_value') : t('inflation.chart_show_value')}</TooltipContent>
      </UiTooltip>

      {/* Title */}
      <div className="text-center pt-2 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          {t('inflation.card_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('inflation.card_tooltip')}
        </p>
      </div>

      {/* Mode + range controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-vindex-bg rounded-lg p-1">
          <button className={modeButtonClass('period')} onClick={() => setMode('period')}>{t('inflation.mode_period')}</button>
          <button className={modeButtonClass('range')} onClick={() => setMode('range')}>{t('inflation.mode_range')}</button>
          <button className={modeButtonClass('all')} onClick={() => setMode('all')}>{t('inflation.mode_all')}</button>
        </div>

        {mode === 'period' && (
          <StyledSelect value={selectedMonths} onChange={(e) => setSelectedMonths(Number(e.target.value))}>
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.months} value={opt.months}>{t('inflation.last_period', { period: opt.label })}</option>
            ))}
          </StyledSelect>
        )}

        {mode === 'range' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-vindex-text/60">{t('inflation.range_from')}</span>
            <StyledSelect
              value={rangeStart}
              onChange={(e) => {
                setRangeStart(e.target.value);
                if (e.target.value > rangeEnd) setRangeEnd(e.target.value);
              }}
            >
              {ALL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </StyledSelect>
            <span className="text-sm text-gray-500 dark:text-vindex-text/60">{t('inflation.range_to')}</span>
            <StyledSelect value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)}>
              {ALL_YEARS.filter(y => y >= rangeStart).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </StyledSelect>
          </div>
        )}

        {mode === 'all' && (
          <span className="text-xs text-gray-400 dark:text-vindex-text/40">
            {FIRST_YEAR} – {CURRENT_YEAR}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[250px] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
          {syncing && (
            <p className="text-sm text-gray-400 dark:text-vindex-text/50">
              {t('inflation.syncing_bcb')}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Header Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: DANGER }}></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.period_inflation_label')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                +{totalCumulative.toFixed(2)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: DANGER }}></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.purchasing_power_loss')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                {formatCurrency(currentWorth)}
              </div>
              <p className="text-xs text-gray-400 dark:text-vindex-text/50">{t('inflation.per_amount_hint', { amount: formatCurrency(REFERENCE_AMOUNT) })}</p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[250px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                {t('dashboard.chart_no_data')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={DANGER} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={DANGER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {showAxis && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={isShortPeriod ? 'preserveStartEnd' : 0}
                    ticks={xAxisTicks}
                    tickFormatter={xAxisTickFormatter}
                    dy={10}
                    tick={showAxis ? { fontSize: 10, fill: textColor } : false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    unit={showValue ? undefined : '%'}
                    tickFormatter={showValue ? formatYAxisValue : undefined}
                    width={showAxis ? 40 : 0}
                    tick={showAxis ? { fontSize: 10, fill: textColor } : false}
                  />
                  <Tooltip content={<CustomTooltip showValue={showValue} t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
                  <Area type="monotone" dataKey={showValue ? 'worth' : 'cumulative'} stroke={DANGER} strokeWidth={2} fillOpacity={1} fill="url(#colorInflation)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default InflationCard;