import { PRIMARY, DANGER, DANGER_DARK, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposedChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { getDateFilterRange, matchesDateFilter } from '@/utils/dateFilter';
import { MONTH_YEAR_THRESHOLD_DAYS, formatDayMonth, formatMonthYear } from '@/utils/chartDateFormat';
import { GridLines, Equal } from '@/components/BxIcon';
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
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'income' ? t('transactions.type_income')
                : entry.dataKey === 'expense' ? t('transactions.type_expense')
                : t('transactions.type_balance')}
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

// `transactions` is expected filtered by everything the page applies *except* date
// (account/category/type/search) — date is applied internally here via `dateFilter`.
// The cumulative line/tooltip and the header totals both derive from the same
// date-scoped `periodTransactions`, so the line's last point always equals the header
// number instead of drifting from a separate full-history running total.
const TransactionsBalanceChart = ({ transactions = [], dateFilter }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAxis, setShowAxis] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  // Both the header totals and the chart's cumulative line derive from this same
  // date-scoped set — keeps the line's last point and the header number identical.
  const periodTransactions = useMemo(
    () => (Array.isArray(transactions) ? transactions : []).filter(tx => tx && matchesDateFilter(tx.date, dateFilter)),
    [transactions, dateFilter]
  );

  const { data, xAxisTicks } = useMemo(() => {
    const safeTransactions = periodTransactions;

    const txByDate = {};
    safeTransactions.forEach(tx => {
      if (!tx || !tx.date) return;
      const d = tx.date;
      if (!txByDate[d]) txByDate[d] = { income: 0, expense: 0 };
      if (tx.type === 'income') {
        txByDate[d].income += Math.abs(Number(tx.amount));
      } else if (tx.type === 'expense') {
        txByDate[d].expense += Math.abs(Number(tx.amount));
      }
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
      const newStartDate = new Date(endDate);
      newStartDate.setDate(endDate.getDate() - (MAX_CHART_DAYS - 1));
      startDate = newStartDate;
      totalDays = MAX_CHART_DAYS;
    }

    // When the range is capped (> MAX_CHART_DAYS), everything strictly before the
    // truncated window still needs to count towards the running total — otherwise the
    // line (and the header totals read off periodTransactions) would silently drop
    // that slice of the selected period instead of just not drawing it.
    const startDateStr = startDate.toISOString().slice(0, 10);
    let seedIncome = 0;
    let seedExpense = 0;
    safeTransactions.forEach(tx => {
      if (!tx?.date || tx.date >= startDateStr) return;
      if (tx.type === 'income') seedIncome += Math.abs(Number(tx.amount));
      else if (tx.type === 'expense') seedExpense += Math.abs(Number(tx.amount));
    });

    // Running totals, not per-day amounts — most days have no transactions at all, so a
    // per-day series is mostly zeroes; accumulating keeps the line flat between
    // transactions instead of collapsing back to zero (same as AssetLiabilityChart).
    const useMonthYearLabels = totalDays > MONTH_YEAR_THRESHOLD_DAYS;
    let accIncome = seedIncome;
    let accExpense = seedExpense;
    const chartData = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayData = txByDate[dateStr] || { income: 0, expense: 0 };
      accIncome += dayData.income;
      accExpense += dayData.expense;

      chartData.push({
        xKey: i,
        displayDate: useMonthYearLabels ? formatMonthYear(d, i18n.language) : formatDayMonth(d, i18n.language),
        income: accIncome,
        expense: accExpense,
        balance: accIncome - accExpense,
      });
    }

    const ticks = useMonthYearLabels
      ? chartData
          .filter((d, i) => i === 0 || chartData[i - 1].displayDate !== d.displayDate)
          .map(d => d.xKey)
      : undefined;

    return { data: chartData, xAxisTicks: ticks };
  }, [periodTransactions, dateFilter, i18n.language]);

  // Computed from the same `periodTransactions` the chart itself uses, so these can
  // never drift from what's actually plotted (the line's last point matches this).
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    periodTransactions.forEach(tx => {
      if (tx?.type === 'income') income += Math.abs(Number(tx.amount));
      else if (tx?.type === 'expense') expense += Math.abs(Number(tx.amount));
    });
    return { totalIncome: income, totalExpense: expense };
  }, [periodTransactions]);
  const hasData = totalIncome > 0 || totalExpense > 0;
  // Colored off the running balance's last plotted point (what it's actually carrying
  // by the end of the visible period), not just this period's own income/expense —
  // matches how a cumulative line reads.
  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const isBalanceNegative = currentBalance < 0;
  const balanceColor = isBalanceNegative ? (isDark ? DANGER_DARK : DANGER) : PRIMARY;

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
              onClick={() => setShowBalance(v => !v)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
                showBalance
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
              }`}
          >
              <Equal size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showBalance ? t('transactions.chart_hide_balance') : t('transactions.chart_show_balance')}</TooltipContent>
      </UiTooltip>

      <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('transactions.type_income')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: isDark ? DANGER_DARK : DANGER }} />
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('transactions.type_expense')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalExpense)}
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full">
        {!hasData ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {t('transactions.chart_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="tbcIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tbcExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? DANGER_DARK : DANGER} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isDark ? DANGER_DARK : DANGER} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tbcBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={balanceColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={balanceColor} stopOpacity={0} />
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
                tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={showAxis ? 40 : 0}
              />
              {showBalance ? (
                <Area
                  type="natural"
                  dataKey="balance"
                  stroke={balanceColor}
                  strokeWidth={2}
                  fill="url(#tbcBalanceGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ) : (
                <>
                  <Area
                    type="natural"
                    dataKey="income"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#tbcIncomeGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="natural"
                    dataKey="expense"
                    stroke={isDark ? DANGER_DARK : DANGER}
                    strokeWidth={2}
                    fill="url(#tbcExpenseGradient)"
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

export default TransactionsBalanceChart;
