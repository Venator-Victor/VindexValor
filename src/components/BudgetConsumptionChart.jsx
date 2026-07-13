import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/calculations';
import { RefreshCw as Loader2 } from '@/components/BxIcon';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getDateFilterRange, getDateFilterLabel } from '@/utils/dateFilter';

// Beyond ~2 months, day-level labels ("13/07") are too dense to be useful — switch to
// short month+day labels instead.
const MONTH_LABEL_THRESHOLD_DAYS = 60;

const BudgetConsumptionChart = ({ dateFilter, filteredTransactions }) => {
  const { t, i18n } = useTranslation();
  const { categories, isLoading } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 1. Calculate Total Planned Budget proportional to the selected period's day span
  const { totalPeriodBudget, periodDays } = useMemo(() => {
    // Sum monthly limits
    const monthlyTotal = categories.reduce((sum, cat) => sum + (cat.budget_enabled ? Number(cat.spending_limit || 0) : 0), 0);

    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 30);
    const { startDate, endDate } = getDateFilterRange(dateFilter, fallbackStart);
    const days = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    return { totalPeriodBudget: monthlyTotal * (days / 30), periodDays: days };
  }, [categories, dateFilter]);

  // 2. Generate Trend Data based on Filtered Transactions and Period
  const data = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) return [];

    // Sort transactions by date ascending
    const sortedTx = [...filteredTransactions]
        .filter(t => t.type === 'expense')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedTx.length === 0) return [];

    // Group by date unit based on period
    const grouped = {};
    let startDate = new Date(sortedTx[0].date);
    let endDate = new Date(); // Today

    // Create a time series
    const result = [];
    let accum = 0;
    
    // For smaller periods, show daily accumulation
    // For larger periods (Anual), could show monthly, but sticking to daily is fine if efficient, 
    // or maybe simple aggregation. 
    // Let's keep it simple: Aggregate daily for smooth lines.

    // Map all relevant dates in the range
    // We'll use the sorted transactions to determine the range if it's dynamic, 
    // but ideally we respect the "Period" boundaries.
    
    // Iterate through transactions and accumulate
    sortedTx.forEach(tx => {
        const dateKey = tx.date; // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = 0;
        grouped[dateKey] += Math.abs(Number(tx.amount));
    });

    const dates = Object.keys(grouped).sort();
    
    dates.forEach(dateStr => {
        accum += grouped[dateStr];
        const dateObj = new Date(dateStr + 'T12:00:00');
        
        let label = '';
        if (periodDays > MONTH_LABEL_THRESHOLD_DAYS) {
             label = dateObj.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
        } else {
             label = dateObj.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' });
        }

        result.push({
            name: label,
            date: dateStr,
            accumulated: accum,
            budgetLine: totalPeriodBudget // Simplified: flat line target
        });
    });

    return result;
  }, [filteredTransactions, periodDays, totalPeriodBudget, i18n.language]);

  const currentConsumption = data.length > 0 ? data[data.length - 1].accumulated : 0;
  const remaining = totalPeriodBudget - currentConsumption;

  let chartColor = INFO; // Default Blue
  if (totalPeriodBudget > 0) {
    const ratio = currentConsumption / totalPeriodBudget;
    if (ratio > 1) {
      chartColor = DANGER; // Red (Over budget)
    } else if (ratio >= 0.99) {
      chartColor = WARNING; // Yellow (At budget)
    } else {
      chartColor = "#22c55e"; // Green (Under budget)
    }
  }

  const tooltipBg = isDark ? "#0b122d" : "#ffffff";
  const tooltipBorder = isDark ? "#283768" : "#e2e8f0";
  const textColor = isDark ? "#f3f4f6" : "#111827";

  if (isLoading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-[350px] w-full bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden flex flex-col"
    >
      {/* Centered Text Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center pt-8 pointer-events-none">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
           {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
           <span className="text-lg font-normal text-gray-500 dark:text-gray-400"> {remaining >= 0 ? t('dashboard.remaining_label') : t('dashboard.exceeded_label')}</span>
        </h3>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
           {t('dashboard.budgeted_label', { amount: formatCurrency(totalPeriodBudget), period: getDateFilterLabel(dateFilter, t, i18n) })}
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 80, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <Tooltip
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                borderColor: tooltipBorder, 
                borderRadius: '0.75rem',
                color: isDark ? '#fff' : '#000',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'budgetLine' ? t('categories.total_budget') : t('dashboard.accumulated_spending')
              ]}
              labelStyle={{ color: textColor, marginBottom: '0.5rem' }}
              cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            
            {/* Planned Budget Line (Dashed) */}
            <Line
              type="monotone"
              dataKey="budgetLine"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            {/* Actual Spending Area */}
            <Area
              type="monotone"
              dataKey="accumulated"
              stroke={chartColor}
              strokeWidth={3}
              fill="url(#colorAccumulated)"
              fillOpacity={1}
              activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default BudgetConsumptionChart;