import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

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

const AssetLiabilityChart = ({
  totalAssets,
  totalLiabilities,
  selectedPeriod,
  filteredTransactions = [], 
  showNetWorth = true
}) => {
  const { t } = useTranslation();
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

    let daysToShow = 30;
    if (selectedPeriod === 'daily') daysToShow = 1;
    else if (selectedPeriod === 'weekly') daysToShow = 7;
    else if (selectedPeriod === 'biweekly') daysToShow = 15;
    else if (selectedPeriod === 'quarterly') daysToShow = 90;
    else if (selectedPeriod === 'semiannual') daysToShow = 180;
    else if (selectedPeriod === 'yearly') daysToShow = 365;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const chartData = [];

    // Generate array of dates backwards
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        
        const dayData = txByDate[dateStr] || { assets: 0, liabilities: 0 };
        chartData.push({
            name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            assets: dayData.assets,
            liabilities: dayData.liabilities,
            netWorth: dayData.assets - dayData.liabilities
        });
    }

    return chartData;
  }, [filteredTransactions, selectedPeriod]);

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