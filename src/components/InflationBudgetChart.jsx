import { PRIMARY, SUCCESS, DANGER, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCw, AlertCircle, GridLines, Equal } from '@/components/BxIcon';
const Loader2 = RefreshCw;
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formatYAxis = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

const CustomTooltip = ({ active, payload, isDark, t }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;

    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
          {data?.fullName || t('inflation.data_label_fallback')}
          {data?.isEstimated && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-normal">{t('inflation.estimated_badge')}</span>
          )}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'nominal' ? t('inflation.budget_nominal')
                : entry.dataKey === 'corrected' ? t('inflation.budget_corrected')
                : t('inflation.impact_label')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          {t('inflation.rate_this_month')} <span className="font-medium text-gray-600 dark:text-gray-300">{typeof data?.inflationRate === 'number' ? data.inflationRate.toFixed(2) : 'N/A'}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Same card shell/icon/header pattern as the other dashboard charts (AssetLiabilityChart,
// BudgetConsumptionChart, etc.) — GridLines toggles axis labels, Equal toggles a single
// combined line (here: the inflation "impact", corrected - nominal).
const InflationBudgetChart = () => {
  const { t, i18n } = useTranslation();
  const { categories, isLoading: isFinanceLoading } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAxis, setShowAxis] = useState(true);
  const [showImpact, setShowImpact] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 1. Calculate Base Nominal Budget (Sum of current category limits)
  const totalNominalBudget = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.budget_enabled ? Number(cat.spending_limit || 0) : 0), 0);
  }, [categories]);

  // 2. Generate Last 12 Months & Fetch Data
  useEffect(() => {
    let isMounted = true;

    const fetchHistoricalData = async () => {
      // Don't fetch until we have category data
      if (isFinanceLoading) return;

      setLoading(true);
      setError(null);

      const months = [];
      const now = new Date();

      // Generate last 12 months structure
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          name: d.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', ''),
          fullName: d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
        });
      }

      try {
        // Calculate date range, expressed as 'YYYY-MM' to match inflation_data.period —
        // read straight from the stored IPCA table (same source InflationCard uses)
        // instead of invoking the fetch-inflation-data edge function, which only exists
        // to backfill/sync that table from BCB, not to serve reads.
        const startDateObj = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

        const toPeriod = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const { data: rows, error: dbError } = await supabase
          .from('inflation_data')
          .select('period, inflation_value')
          .gte('period', toPeriod(startDateObj))
          .lte('period', toPeriod(endDateObj))
          .order('period', { ascending: true });

        if (dbError) throw new Error(dbError.message || t('inflation.communication_error'));

        const inflationData = rows || [];

        if (!isMounted) return;

        // Calculate cumulative inflation
        let currentCorrected = totalNominalBudget;

        const data = months.map((m, index) => {
          // Find matching data point
          const periodKey = `${m.year}-${String(m.month).padStart(2, '0')}`;
          const match = inflationData.find(item => item.period === periodKey);

          // If data is unavailable, assume 0% inflation but mark as estimated
          const inflationRate = match ? Number(match.inflation_value) : 0;
          const isEstimated = !match;

          // Apply inflation accumulation (compound interest formula)
          // We apply inflation of the previous month to adjust current month's value,
          // or apply current month's inflation to get end-of-month value.
          // Here we assume we want to see how much we need at the END of the month.
          if (index > 0) {
             currentCorrected = currentCorrected * (1 + (inflationRate / 100));
          }

          return {
            name: m.name,
            fullName: m.fullName,
            nominal: totalNominalBudget,
            corrected: currentCorrected,
            impact: currentCorrected - totalNominalBudget,
            inflationRate,
            isEstimated
          };
        });

        setChartData(data);

      } catch (err) {
        if (isMounted) {
          setError(err.message || t('inflation.load_error_desc'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistoricalData();

    return () => {
      isMounted = false;
    };
  }, [totalNominalBudget, isFinanceLoading, retryCount, i18n.language, t]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Determine current (latest) values for the header
  const currentValues = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { nominal: totalNominalBudget, corrected: totalNominalBudget };
    }
    const lastPoint = chartData[chartData.length - 1];
    return {
      nominal: lastPoint.nominal,
      corrected: lastPoint.corrected
    };
  }, [chartData, totalNominalBudget]);

  const currentImpact = currentValues.corrected - currentValues.nominal;
  const impactColor = currentImpact > 0 ? DANGER : SUCCESS;
  // With no budget-enabled categories, every point is a flat 0 — that's not a real
  // series, it just traces a line along the chart's bottom edge. Treat it as no data.
  const hasData = chartData.some(d => d.nominal > 0 || d.corrected > 0);

  if (error) {
    return (
      <div className="h-full min-h-[400px] w-full bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('common.error_loading')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
          {error}
        </p>
        <Button
          onClick={handleRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (loading || isFinanceLoading) {
    return (
       <div className="h-full min-h-[400px] w-full bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border p-6 flex items-center justify-center">
         <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">{t('inflation.calculating')}</p>
         </div>
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
              onClick={() => setShowImpact(v => !v)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
                showImpact
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
              }`}
          >
              <Equal size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showImpact ? t('inflation.chart_hide_impact') : t('inflation.chart_show_impact')}</TooltipContent>
      </UiTooltip>

      {/* Header Stats */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: PRIMARY }}></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.budget_nominal')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {formatCurrency(currentValues.nominal)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: DANGER }}></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.budget_corrected')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {formatCurrency(currentValues.corrected)}
          </div>
        </div>
      </div>

      {/* Partial Data Warning */}
      {chartData.some(d => d.isEstimated) && (
        <div className="flex justify-center mb-4 -mt-2">
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="w-3 h-3" />
              <span>{t('inflation.partial_data_warning')}</span>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="h-[250px] w-full">
        {!hasData ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {t('dashboard.chart_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="ibcImpactGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={impactColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={impactColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              {showAxis && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />}
              <Tooltip content={<CustomTooltip isDark={isDark} t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
              <XAxis
                dataKey="name"
                tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={showAxis ? 40 : 0}
              />

              {showImpact ? (
                /* Inflation Impact Area (Adjusted - Nominal) */
                <Area
                  type="monotone"
                  dataKey="impact"
                  stroke={impactColor}
                  strokeWidth={2}
                  fill="url(#ibcImpactGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ) : (
                <>
                  {/* Nominal Budget Line (Dashed) */}
                  <Line
                    type="monotone"
                    dataKey="nominal"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  {/* Corrected Budget Line (Dashed) */}
                  <Line
                    type="monotone"
                    dataKey="corrected"
                    stroke={DANGER}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default InflationBudgetChart;
