import { PRIMARY, SUCCESS, DANGER, DANGER_DARK, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateMonthlyIncome } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { RefreshCw, AlertCircle, GridLines, Equal, TrendingUp } from '@/components/BxIcon';
const Loader2 = RefreshCw;
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const CustomTooltip = ({ active, payload, t }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;

    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
          {data?.fullName}
          {data?.isEstimated && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-normal">{t('inflation.estimated_badge')}</span>
          )}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'incomeIndex' ? t('inflation.income_index_label')
                : entry.dataKey === 'inflationIndex' ? t('inflation.inflation_index_label')
                : t('inflation.gap_label')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {entry.value.toFixed(1)}
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

// Candidate replacement for InflationBudgetChart — indexes cumulative IPCA inflation
// and the user's own monthly income to a common base of 100 at the start of the
// 12-month window, so the two series (different natural units) share one axis
// instead of a dual-axis chart. GridLines toggles axis labels, Equal toggles the
// single "gap" area (income index - inflation index).
const IncomeVsInflationChart = () => {
  const { t, i18n } = useTranslation();
  const { transactions, isLoading: isFinanceLoading } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAxis, setShowAxis] = useState(true);
  const [showGap, setShowGap] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchHistoricalData = async () => {
      if (isFinanceLoading) return;

      setLoading(true);
      setError(null);

      const months = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          name: d.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', ''),
          fullName: d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
        });
      }

      try {
        const startDateObj = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

        const monthlyIncomes = months.map(m => calculateMonthlyIncome(transactions, m.key));
        const baseIncome = monthlyIncomes.find(v => v > 0) || 0;

        let currentInflationIndex = 100;

        const data = months.map((m, index) => {
          const match = inflationData.find(item => item.period === m.key);
          const inflationRate = match ? Number(match.inflation_value) : 0;
          const isEstimated = !match;

          if (index > 0) {
            currentInflationIndex = currentInflationIndex * (1 + (inflationRate / 100));
          }

          const income = monthlyIncomes[index];
          const incomeIndex = baseIncome > 0 ? (income / baseIncome) * 100 : null;

          return {
            name: m.name,
            fullName: m.fullName,
            income,
            incomeIndex,
            inflationIndex: currentInflationIndex,
            gap: incomeIndex !== null ? incomeIndex - currentInflationIndex : null,
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
  }, [transactions, isFinanceLoading, retryCount, i18n.language, t]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const hasIncomeData = chartData.some(d => d.incomeIndex !== null);

  const currentValues = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { incomeIndex: 100, inflationIndex: 100 };
    }
    const lastPoint = chartData[chartData.length - 1];
    return {
      incomeIndex: lastPoint.incomeIndex ?? 100,
      inflationIndex: lastPoint.inflationIndex
    };
  }, [chartData]);

  const beatsInflation = currentValues.incomeIndex >= currentValues.inflationIndex;
  const gapColor = beatsInflation ? SUCCESS : DANGER;
  const dangerColor = isDark ? DANGER_DARK : DANGER;

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
        <Button onClick={handleRetry} variant="outline" className="gap-2">
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
        <TooltipContent>{showGap ? t('inflation.chart_hide_impact') : t('inflation.chart_show_impact')}</TooltipContent>
      </UiTooltip>

      <div className="text-center pt-2 mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('inflation.income_vs_inflation_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('inflation.income_vs_inflation_subtitle')}
        </p>
      </div>

      {hasIncomeData && (
        <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-4 mt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.income_index_label')}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {currentValues.incomeIndex.toFixed(1)}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: dangerColor }}></div>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.inflation_index_label')}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {currentValues.inflationIndex.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {!hasIncomeData && (
        <div className="flex justify-center mb-4 -mt-2">
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
            <AlertCircle className="w-3 h-3" />
            <span>{t('inflation.no_income_data')}</span>
          </div>
        </div>
      )}

      <div className="h-[250px] w-full">
        {!hasIncomeData ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {t('dashboard.chart_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="ivicGapGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gapColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={gapColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ivicIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ivicInflationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dangerColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={dangerColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              {showAxis && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />}
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
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
                width={showAxis ? 36 : 0}
              />

              {showGap ? (
                <Area
                  type="monotone"
                  dataKey="gap"
                  stroke={gapColor}
                  strokeWidth={2}
                  fill="url(#ivicGapGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ) : (
                <>
                  <ReferenceLine y={100} stroke={chartText(isDark)} strokeDasharray="4 4" strokeOpacity={0.35} />
                  <Area
                    type="monotone"
                    dataKey="incomeIndex"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#ivicIncomeGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflationIndex"
                    stroke={dangerColor}
                    strokeWidth={2}
                    fill="url(#ivicInflationGradient)"
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

export default IncomeVsInflationChart;
