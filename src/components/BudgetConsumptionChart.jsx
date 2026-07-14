import { PRIMARY, DANGER, DANGER_DARK, SUCCESS, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposedChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { getDateFilterRange, matchesDateFilter } from '@/utils/dateFilter';
import { MONTH_YEAR_THRESHOLD_DAYS, formatDayMonth, formatMonthYear } from '@/utils/chartDateFormat';
import { GridLines, Equal, RefreshCw as Loader2 } from '@/components/BxIcon';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formatYAxis = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

// Custom 'period' ranges can span arbitrary years; cap bars so the chart stays readable/fast.
const MAX_CHART_DAYS = 400;

const CustomTooltip = ({ active, payload, t }) => {
  if (active && payload && payload.length) {
    const displayDate = payload[0]?.payload?.displayDate;
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{displayDate}</p>
        {payload.map((entry, index) => (
           <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {entry.dataKey === 'spent' ? t('dashboard.accumulated_spending') : t('dashboard.remaining_label')}
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
              </span>
           </div>
        ))}
      </div>
    );
  }
  return null;
};

// Same shape as AssetLiabilityChart: the cumulative spend/remaining line is scoped to
// `periodTransactions` (the selected `dateFilter` window), matching the header totals'
// own calculation — so picking "month" resets the line to that month.
const BudgetConsumptionChart = ({ dateFilter, filteredTransactions = [] }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { categories, isLoading } = useFinance();
  const [showAxis, setShowAxis] = useState(true);
  const [showRemaining, setShowRemaining] = useState(false);

  // Used both for the chart's empty state and as the basis for the cumulative line
  // below — scoped to the visible period, same as the header totals.
  const periodTransactions = useMemo(
    () => (Array.isArray(filteredTransactions) ? filteredTransactions : [])
      .filter(tx => tx && tx.type === 'expense' && matchesDateFilter(tx.date, dateFilter)),
    [filteredTransactions, dateFilter]
  );

  const { data, xAxisTicks, totalPeriodBudget } = useMemo(() => {
    const safeTransactions = periodTransactions;

    // Group transactions by date
    const txByDate = {};
    safeTransactions.forEach(tx => {
        if (!tx || !tx.date) return;
        if (!txByDate[tx.date]) txByDate[tx.date] = 0;
        txByDate[tx.date] += Math.abs(Number(tx.amount));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 'all' falls back to the earliest transaction on record.
    const earliestTx = safeTransactions.reduce((earliest, tx) => {
        if (!tx?.date) return earliest;
        const d = new Date(`${tx.date}T00:00:00`);
        return !earliest || d < earliest ? d : earliest;
    }, null);
    const fallbackStart = earliestTx ?? new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let { startDate, endDate } = getDateFilterRange(dateFilter, fallbackStart);
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (endDate < startDate) endDate = startDate;

    let totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays > MAX_CHART_DAYS) {
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - (MAX_CHART_DAYS - 1));
        totalDays = MAX_CHART_DAYS;
    }

    // Monthly category limits, prorated to the number of days actually being charted.
    const monthlyTotal = categories.reduce((sum, cat) => sum + (cat.budget_enabled ? Number(cat.spending_limit || 0) : 0), 0);
    const periodBudget = monthlyTotal * (totalDays / 30);

    // When the range is capped (> MAX_CHART_DAYS), everything strictly before the
    // truncated window still needs to count towards the running total — otherwise the
    // line would silently drop that slice of the selected period instead of just not
    // drawing it.
    const startDateStr = startDate.toISOString().slice(0, 10);
    let seedSpent = 0;
    safeTransactions.forEach(tx => {
        if (!tx?.date || tx.date >= startDateStr) return;
        seedSpent += Math.abs(Number(tx.amount));
    });

    // Running totals, not per-day amounts — most days have no transactions at
    // all, so a per-day series is mostly zeroes; accumulating keeps the line
    // flat between transactions instead of collapsing back to zero.
    const useMonthYearLabels = totalDays > MONTH_YEAR_THRESHOLD_DAYS;
    let accSpent = seedSpent;
    const chartData = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);

        accSpent += txByDate[dateStr] || 0;
        chartData.push({
            xKey: i,
            displayDate: useMonthYearLabels ? formatMonthYear(d, i18n.language) : formatDayMonth(d, i18n.language),
            spent: accSpent,
            remaining: periodBudget - accSpent
        });
    }

    // Recharts picks tick positions by index, not by calendar boundaries, so with one
    // point per day it can land two different ticks in the same month — printing that
    // month's label twice in a row. In month-year mode, force exactly one tick per
    // month (its first day) instead of leaving tick selection to Recharts.
    const ticks = useMonthYearLabels
      ? chartData
          .filter((d, i) => i === 0 || chartData[i - 1].displayDate !== d.displayDate)
          .map(d => d.xKey)
      : undefined;

    return { data: chartData, xAxisTicks: ticks, totalPeriodBudget: periodBudget };
  }, [periodTransactions, dateFilter, categories, i18n.language]);

  const currentSpent = data.length > 0 ? data[data.length - 1].spent : 0;
  const remaining = totalPeriodBudget - currentSpent;
  const budgetColor = PRIMARY;
  const spentColor = isDark ? DANGER_DARK : DANGER;
  const remainingColor = remaining < 0 ? (isDark ? DANGER_DARK : DANGER) : SUCCESS;

  if (isLoading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
                onClick={() => setShowRemaining(v => !v)}
                className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
                  showRemaining
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
                }`}
            >
                <Equal size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{showRemaining ? t('dashboard.chart_hide_remaining') : t('dashboard.chart_show_remaining')}</TooltipContent>
        </UiTooltip>

        {/* Header Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: budgetColor }}></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('categories.total_budget')}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {formatCurrency(totalPeriodBudget)}
                </div>
            </div>

            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: spentColor }}></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.accumulated_spending')}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {formatCurrency(currentSpent)}
                </div>
            </div>
        </div>

        {/* Chart Area */}
        <div className="h-[250px] w-full">
          {periodTransactions.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              {t('dashboard.chart_no_data')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                    <defs>
                        <linearGradient id="bccSpentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={spentColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={spentColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="bccRemainingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={remainingColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={remainingColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {showAxis && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />}
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
                    <XAxis
                        dataKey="xKey"
                        ticks={xAxisTicks}
                        tickFormatter={(xKey) => data[xKey]?.displayDate ?? ''}
                        tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        domain={showRemaining ? ['auto', 'auto'] : [0, 'auto']}
                        tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        width={showAxis ? 40 : 0}
                    />

                    {showRemaining ? (
                        /* Remaining Budget Area (Budget - Spent) */
                        <Area
                            type="natural"
                            dataKey="remaining"
                            stroke={remainingColor}
                            strokeWidth={2}
                            fill="url(#bccRemainingGradient)"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    ) : (
                        /* Accumulated Spending Area */
                        <Area
                            type="natural"
                            dataKey="spent"
                            stroke={spentColor}
                            strokeWidth={2}
                            fill="url(#bccSpentGradient)"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
    </motion.div>
  );
};

export default BudgetConsumptionChart;