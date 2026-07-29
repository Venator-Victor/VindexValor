import { PRIMARY, DANGER, DANGER_DARK, SUCCESS, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ComposedChart, Area, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle, RefreshCw, GridLines, Equal, Landmark } from '@/components/BxIcon';
const Loader2 = RefreshCw;
import { Button } from '@/components/ui/button';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ECONOMIC_REGIONS,
  regionForCurrency,
  ensureBackfilled,
  fetchSeries,
  buildCumulativeIndex,
} from '@/utils/economicRegions';

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

const CURRENT_YEAR = new Date().getFullYear();

const CustomTooltip = ({ active, payload, t }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{data?.name}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'm2Index' ? t('m2.m2_growth_label')
                : entry.dataKey === 'inflationIndex' ? t('m2.inflation_growth_label')
                : t('m2.implied_gap_label')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              +{entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Quantity-theory-of-money framing: money creation (M2) is treated as the
// real driver of inflation, and the officially published index (IPCA/CPI/
// HICP) is treated as an underreporting of it. Cumulative M2 growth and
// cumulative official inflation are indexed to 100 at the start of the
// selected window and plotted together; the "gap" between them is read as
// how much the official number is underreporting real (M2-driven) inflation
// — not a guarantee, just the mechanical readout of the two series. Region
// (Brazil/BCB, Eurozone/ECB, US/FRED) is driven by the user's Preferences
// currency (see src/utils/economicRegions.js) rather than a toggle on this
// chart, so it stays in sync with InflationCard and IncomeVsInflationChart.
const M2VsInflationChart = () => {
  const { t } = useTranslation();
  const { settings } = useFinance();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  const region = regionForCurrency(settings?.currency);
  const regionConfig = ECONOMIC_REGIONS[region];

  const [m2Data, setM2Data] = useState([]);
  const [inflationData, setInflationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showAxis, setShowAxis] = useState(true);
  const [showGap, setShowGap] = useState(false);

  // 'period' | 'range' | 'all'
  const [mode, setMode] = useState('period');
  const [selectedMonths, setSelectedMonths] = useState(60);
  const [rangeStart, setRangeStart] = useState(String(CURRENT_YEAR - 5));
  const [rangeEnd, setRangeEnd] = useState(String(CURRENT_YEAR));

  const ALL_YEARS = useMemo(
    () => Array.from({ length: CURRENT_YEAR - regionConfig.m2.firstYear + 1 }, (_, i) => String(regionConfig.m2.firstYear + i)),
    [regionConfig.m2.firstYear]
  );

  const PERIOD_OPTIONS = [
    { label: t('inflation.period_1y'), months: 12 },
    { label: t('inflation.period_2y'), months: 24 },
    { label: t('inflation.period_5y'), months: 60 },
    { label: t('inflation.period_10y'), months: 120 },
    { label: t('inflation.period_20y'), months: 240 },
  ];

  const textColor = chartText(isDark);
  const gridColor = chartGrid(isDark);

  useEffect(() => {
    // No setState here: the comingSoon JSX branch renders unconditionally
    // whenever regionConfig.comingSoon is true, before loading/error are
    // ever read, so leaving that state untouched is safe.
    if (regionConfig.comingSoon) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        setSyncing(true);
        await Promise.all([ensureBackfilled(regionConfig.m2), ensureBackfilled(regionConfig.inflation)]);
        if (isMounted) setSyncing(false);

        const [m2Rows, inflationRows] = await Promise.all([
          fetchSeries(regionConfig.m2),
          fetchSeries(regionConfig.inflation),
        ]);

        if (!isMounted) return;
        setM2Data(m2Rows);
        setInflationData(inflationRows);
      } catch (err) {
        if (isMounted) setError(err.message || t('m2.load_error'));
      } finally {
        if (isMounted) {
          setLoading(false);
          setSyncing(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [region, retryCount, t, regionConfig]);

  const filteredPeriods = useMemo(() => {
    if (!m2Data.length) return [];
    const allPeriods = m2Data.map(r => r.period);
    if (mode === 'all') return allPeriods;
    if (mode === 'period') return allPeriods.slice(-selectedMonths);
    return allPeriods.filter(p => p >= `${rangeStart}-01` && p <= `${rangeEnd}-12`);
  }, [m2Data, mode, selectedMonths, rangeStart, rangeEnd]);

  const { chartData, currentM2Index, currentInflationIndex } = useMemo(() => {
    if (!filteredPeriods.length) return { chartData: [], currentM2Index: 100, currentInflationIndex: 100 };

    const inflationByPeriod = new Map(inflationData.map(r => [r.period, r.value]));
    const m2ByPeriod = new Map(m2Data.map(r => [r.period, r.value]));

    const m2Indices = buildCumulativeIndex(filteredPeriods, m2ByPeriod, regionConfig.m2.isRate);
    const inflationIndices = buildCumulativeIndex(filteredPeriods, inflationByPeriod, regionConfig.inflation.isRate);

    const data = filteredPeriods.map((period, index) => {
      const [year, month] = period.split('-');
      const m2Index = m2Indices[index];
      const inflationIndex = inflationIndices[index];

      return {
        name: `${month}/${year}`,
        m2Index,
        inflationIndex,
        gap: (m2Index !== null && inflationIndex !== null) ? m2Index - inflationIndex : null,
      };
    });

    const last = data[data.length - 1];
    return { chartData: data, currentM2Index: last?.m2Index ?? 100, currentInflationIndex: last?.inflationIndex ?? 100 };
  }, [filteredPeriods, m2Data, inflationData, regionConfig]);

  const gapValue = currentM2Index - currentInflationIndex;
  const gapColor = gapValue > 0 ? DANGER : SUCCESS;
  const dangerColor = isDark ? DANGER_DARK : DANGER;

  const isShortPeriod = chartData.length <= 36;
  const isVeryLongPeriod = chartData.length > 60;

  const xAxisTicks = useMemo(() => {
    if (isShortPeriod) return undefined;
    const yearStep = isVeryLongPeriod ? (isMobile ? 10 : 5) : 1;
    return chartData
      .filter(d => d.name.startsWith('01/') && parseInt(d.name.substring(3)) % yearStep === 0)
      .map(d => d.name);
  }, [chartData, isShortPeriod, isVeryLongPeriod, isMobile]);

  const xAxisTickFormatter = (value) => (isShortPeriod ? value : value.substring(3));

  const modeButtonClass = (m) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      mode === m
        ? 'bg-primary text-white font-medium'
        : 'text-gray-500 dark:text-vindex-text/60 hover:text-gray-800 dark:hover:text-vindex-text'
    }`;

  const handleRetry = () => setRetryCount(prev => prev + 1);

  if (regionConfig.comingSoon) {
    return (
      <div className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col items-center justify-center h-[300px] mb-6 text-center">
        <Landmark className="w-10 h-10 text-gray-300 dark:text-vindex-text/30 mb-3" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">{t(regionConfig.titleKey)}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{t('m2.region_us_coming_soon')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col items-center justify-center h-[300px]">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-gray-900 dark:text-white font-medium mb-2">{t('common.error_loading')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
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
            onClick={() => setShowGap(v => !v)}
            className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
              showGap
                ? 'text-primary hover:bg-primary/10'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
            }`}
          >
            <Equal size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showGap ? t('m2.chart_hide_gap') : t('m2.chart_show_gap')}</TooltipContent>
      </UiTooltip>

      <div className="text-center pt-2 mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          {t(regionConfig.titleKey)}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl mx-auto">
          {t(regionConfig.subtitleKey)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 my-6">
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
              {ALL_YEARS.filter(y => y >= rangeStart).map(y => <option key={y} value={y}>{y}</option>)}
            </StyledSelect>
          </div>
        )}

        {mode === 'all' && (
          <span className="text-xs text-gray-400 dark:text-vindex-text/40">{regionConfig.m2.firstYear} – {CURRENT_YEAR}</span>
        )}
      </div>

      {loading ? (
        <div className="h-[250px] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          {syncing && <p className="text-sm text-gray-400 dark:text-vindex-text/50">{t('m2.syncing', { source: t(regionConfig.sourceLabelKey) })}</p>}
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[250px] w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          {t('dashboard.chart_no_data')}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('m2.m2_growth_label')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                +{(currentM2Index - 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: dangerColor }}></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('m2.inflation_growth_label')}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                +{(currentInflationIndex - 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: gapColor }}></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('m2.implied_gap_label')}</span>
              </div>
              <div className="text-3xl font-bold mb-2 tracking-tight" style={{ color: gapColor }}>
                {gapValue > 0 ? '+' : ''}{gapValue.toFixed(1)}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-vindex-text/50 mb-6 max-w-lg mx-auto">
            {gapValue > 0 ? t('m2.gap_positive_hint') : t('m2.gap_negative_hint')}
          </p>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="m2GapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gapColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={gapColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="m2IndexGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="m2InflationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dangerColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={dangerColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {showAxis && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />}
                <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
                <XAxis
                  dataKey="name"
                  tick={showAxis ? { fontSize: 10, fill: textColor } : false}
                  axisLine={false}
                  tickLine={false}
                  interval={isShortPeriod ? 'preserveStartEnd' : 0}
                  ticks={xAxisTicks}
                  tickFormatter={xAxisTickFormatter}
                  dy={10}
                />
                <YAxis
                  tick={showAxis ? { fontSize: 10, fill: textColor } : false}
                  axisLine={false}
                  tickLine={false}
                  width={showAxis ? 40 : 0}
                  unit="%"
                />

                {showGap ? (
                  <Area type="monotone" dataKey="gap" stroke={gapColor} strokeWidth={2} fill="url(#m2GapGradient)" dot={false} activeDot={{ r: 4 }} />
                ) : (
                  <>
                    <ReferenceLine y={100} stroke={textColor} strokeDasharray="4 4" strokeOpacity={0.35} />
                    <Area type="monotone" dataKey="m2Index" stroke={PRIMARY} strokeWidth={2} fill="url(#m2IndexGradient)" dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="inflationIndex" stroke={dangerColor} strokeWidth={2} fill="url(#m2InflationGradient)" dot={false} activeDot={{ r: 4 }} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default M2VsInflationChart;
