import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { getDateFilterRange } from '@/utils/dateFilter';

// Custom 'period' ranges can span arbitrary years; cap bars so the chart stays readable/fast.
const MAX_CHART_DAYS = 400;

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
           <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {entry.dataKey === 'assets' ? t('dashboard.assets_income') : entry.dataKey === 'liabilities' ? t('dashboard.liabilities_expense') : t('accounts.net_worth_short')}
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

// Legacy rolling-window periods (still used by the Dashboard's own period selector).
const ROLLING_WINDOW_DAYS = {
  daily: 1,
  weekly: 7,
  biweekly: 15,
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  yearly: 365,
};

const AssetLiabilityChart = ({
  totalAssets,
  totalLiabilities,
  dateFilter,
  selectedPeriod,
  filteredTransactions = [],
  showNetWorth = true
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    const safeTransactions = Array.isArray(filteredTransactions) ? filteredTransactions : [];

    // Group transactions by date
    const txByDate = {};
    safeTransactions.forEach(tx => {
        if (!tx || !tx.date) return;
        const d = tx.date;
        if (!txByDate[d]) {
           txByDate[d] = { name: d, assets: 0, liabilities: 0 };
        }

        if (tx.type === 'income') {
           txByDate[d].assets += Math.abs(tx.amount);
        } else if (tx.type === 'expense') {
           txByDate[d].liabilities += Math.abs(tx.amount);
        }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate;

    if (dateFilter) {
      // Calendar-anchored range (Accounts page): 'all' falls back to the earliest transaction on record.
      const earliestTx = safeTransactions.reduce((earliest, tx) => {
          if (!tx?.date) return earliest;
          const d = new Date(`${tx.date}T00:00:00`);
          return !earliest || d < earliest ? d : earliest;
      }, null);
      const fallbackStart = earliestTx ?? new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      ({ startDate, endDate } = getDateFilterRange(dateFilter, fallbackStart));
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      if (endDate < startDate) endDate = startDate;
    } else {
      // Rolling window ending today (Dashboard page).
      const daysToShow = ROLLING_WINDOW_DAYS[selectedPeriod] ?? 30;
      endDate = today;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - (daysToShow - 1));
    }

    let totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays > MAX_CHART_DAYS) {
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - (MAX_CHART_DAYS - 1));
        totalDays = MAX_CHART_DAYS;
    }

    const chartData = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);

        const dayData = txByDate[dateStr] || { assets: 0, liabilities: 0 };
        chartData.push({
            name: d.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' }),
            assets: dayData.assets,
            liabilities: dayData.liabilities,
            netWorth: dayData.assets - dayData.liabilities
        });
    }

    return chartData;
  }, [filteredTransactions, dateFilter, selectedPeriod, i18n.language]);

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm mb-6 relative"
    >
        {/* Header Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.total_assets')}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {formatCurrency(totalAssets || 0)}
                </div>
            </div>

            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.total_liabilities')}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {formatCurrency(totalLiabilities || 0)}
                </div>
            </div>
        </div>

        {/* Chart Area */}
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: chartCursor(isDark) }} />
                    <XAxis 
                        dataKey="name" 
                        hide={data.length > 20} 
                        tick={{ fontSize: 10, fill: chartText(isDark) }} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    
                    {/* Assets Bar */}
                    <Bar 
                        dataKey="assets" 
                        fill={SUCCESS} 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                    
                    {/* Liabilities Bar */}
                    <Bar 
                        dataKey="liabilities" 
                        fill={DANGER} 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </motion.div>
  );
};

export default AssetLiabilityChart;