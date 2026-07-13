import { DANGER_DARK } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { InfoCircle as Info, AlertCircle, RefreshCw, TrendingDown } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
const Loader2 = RefreshCw;
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">{t('inflation.cumulative_tooltip')}</span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {entry.value.toFixed(2)}%
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
      className={`appearance-none bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg pl-3 pr-7 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-vindex-danger disabled:opacity-50 cursor-pointer ${className}`}
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

  // 'period' | 'range' | 'all'
  const [mode, setMode] = useState('period');
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [rangeStart, setRangeStart] = useState(String(CURRENT_YEAR - 5));
  const [rangeEnd, setRangeEnd] = useState(String(CURRENT_YEAR));

  const textColor = isDark ? "#d1dcf0" : "#1f2937";
  const gridColor = isDark ? "#283768" : "#e5e7eb";

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
      return {
        name: `${month}/${year}`,
        cumulative: parseFloat(((compounds[i] - 1) * 100).toFixed(2)),
      };
    });

    return {
      chartData: data,
      totalCumulative: data.length ? data[data.length - 1].cumulative : 0,
    };
  }, [filteredData]);

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

  const periodStartYear = filteredData.length
    ? filteredData[0].period.substring(0, 4)
    : String(FIRST_YEAR);

  const modeButtonClass = (m) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      mode === m
        ? 'bg-vindex-danger text-white font-medium'
        : 'text-gray-500 dark:text-vindex-text/60 hover:text-gray-800 dark:hover:text-vindex-text'
    }`;

  if (error) {
    return (
      <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-red-200 dark:border-vindex-danger/30 shadow-lg flex flex-col items-center justify-center h-[300px]">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
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
      className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-red-200 dark:border-vindex-danger/30 shadow-lg relative overflow-hidden group transition-colors duration-300"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
        <TrendingDown size={144} className="text-vindex-danger" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-vindex-text flex items-center gap-2">
          <TrendingDown size={20} className="text-vindex-danger" />
          {t('inflation.card_title')}
          <UiTooltip delayDuration={100}>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-500 dark:text-vindex-text/50" />
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border">
              <p className="text-gray-900 dark:text-vindex-text">{t('inflation.card_tooltip')}</p>
            </TooltipContent>
          </UiTooltip>
        </h2>

        {/* Mode toggle + controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Mode buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-vindex-bg rounded-lg p-1">
            <button className={modeButtonClass('period')} onClick={() => setMode('period')}>{t('inflation.mode_period')}</button>
            <button className={modeButtonClass('range')} onClick={() => setMode('range')}>{t('inflation.mode_range')}</button>
            <button className={modeButtonClass('all')} onClick={() => setMode('all')}>{t('inflation.mode_all')}</button>
          </div>

          {/* Controls per mode */}
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
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-vindex-danger" />
          {syncing && (
            <p className="text-sm text-gray-400 dark:text-vindex-text/50">
              {t('inflation.syncing_bcb')}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DANGER_DARK} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={DANGER_DARK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={isShortPeriod ? 'preserveStartEnd' : 0}
                  ticks={xAxisTicks}
                  tickFormatter={xAxisTickFormatter}
                  tickMargin={10}
                />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} unit="%" tickMargin={8} width={48} />
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: gridColor }} />
                <Area type="monotone" dataKey="cumulative" stroke={DANGER_DARK} fillOpacity={1} fill="url(#colorInflation)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-gray-50 dark:bg-vindex-bg/30 p-4 rounded-lg border border-gray-200 dark:border-vindex-border/30">
            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">{t('inflation.period_inflation_label')}</p>
              <p className="text-2xl font-bold text-vindex-danger">+{totalCumulative.toFixed(2)}%</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-vindex-text/70">{t('inflation.purchasing_power_loss')}</p>
              <p className="text-sm text-gray-400 dark:text-vindex-text/50 mb-1">{t('inflation.per_amount_hint', { amount: formatCurrency(1000) })}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-vindex-text">
                {t('inflation.today_worth_label')}{' '}
                <span className="text-vindex-danger">
                  {formatCurrency(1000 / (1 + totalCumulative / 100))}
                </span>
              </p>
            </div>

            <div className="text-xs text-gray-400 dark:text-vindex-text/50">
              {t('inflation.purchasing_power_desc', { percent: ((1 + totalCumulative / 100) * 100).toFixed(0), year: periodStartYear })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InflationCard;