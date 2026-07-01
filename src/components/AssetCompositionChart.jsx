import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, isCryptoCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { DoughnutChart } from '@/components/BxIcon';

const CustomTooltip = ({ active, payload, data, t }) => {
  if (active && payload && payload.length && !data.isEmpty) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {((payload[0].value / (data.totalAssets + data.totalLiabilities)) * 100).toFixed(1)}{t('dashboard.percent_of_total')}
        </p>
      </div>
    );
  }
  return null;
};

const AssetCompositionChart = ({ accounts = [], investments = [], recurring = [], exchangeRates = {}, selectedPeriod }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    const liquidAssets = accounts.reduce((sum, acc) => {
      if (isCryptoCurrency(acc.currency)) return sum;
      const currency = acc.currency || 'BRL';
      const rate = exchangeRates[currency] || 1;
      const balance = Number(acc.balance) * (currency === 'BRL' ? 1 : rate);
      return balance > 0 ? sum + balance : sum;
    }, 0);

    const cryptoAssets = accounts.reduce((sum, acc) => {
      if (!isCryptoCurrency(acc.currency)) return sum;
      // Convert the raw cryptocurrency amount to BRL equivalent using fetched exchange rate
      // Fallback to manual expected_return if exchangeRates is missing
      const rate = exchangeRates[acc.currency] || acc.expected_return || 1;
      const balanceInBRL = Number(acc.balance) * rate;
      return balanceInBRL > 0 ? sum + balanceInBRL : sum;
    }, 0);

    let liabilities = accounts.reduce((sum, acc) => {
      const currency = acc.currency || 'BRL';
      const rate = exchangeRates[currency] || 1;
      const balance = Number(acc.balance) * (currency === 'BRL' ? 1 : rate);
      return balance < 0 ? sum + Math.abs(balance) : sum;
    }, 0);

    recurring.forEach(r => {
      if (r.status === 'active') {
        liabilities += Math.abs(Number(r.amount || 0));
      }
    });

    const totalInvestments = investments.reduce((sum, inv) => {
      return sum + Number(inv.current_amount || inv.invested_amount || 0);
    }, 0);

    const chartData = [
      { name: t('dashboard.cash_balance'), value: liquidAssets, color: INFO }, // Blue
      { name: t('dashboard.cryptocurrencies'), value: cryptoAssets, color: '#f59e0b' }, // Amber/Gold
      { name: t('nav.investments'), value: totalInvestments, color: SUCCESS }, // Green
      { name: t('dashboard.liabilities_debts'), value: liabilities, color: DANGER } // Red
    ].filter(item => item.value > 0);

    return { 
      chartData, 
      totalAssets: liquidAssets + cryptoAssets + totalInvestments, 
      totalLiabilities: liabilities,
      isEmpty: liquidAssets === 0 && cryptoAssets === 0 && liabilities === 0 && totalInvestments === 0
    };
  }, [accounts, investments, recurring, exchangeRates, t]);

  const emptyData = [{ name: t('dashboard.no_data'), value: 1, color: isDark ? '#374151' : '#E5E7EB' }];
  
  const renderData = data.isEmpty ? emptyData : data.chartData;
  const totalNetWorth = data.totalAssets - data.totalLiabilities;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
           <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <DoughnutChart size={20} className="text-purple-500" />
            {t('dashboard.composition_title')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
             {t('dashboard.assets_vs_liabilities', { period: t(`period.${selectedPeriod}`) })}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={renderData}
              cx="50%"
              cy="50%"
              innerRadius={data.isEmpty ? 50 : 60}
              outerRadius={data.isEmpty ? 70 : 80}
              paddingAngle={data.isEmpty ? 0 : 5}
              dataKey="value"
              stroke="none"
              isAnimationActive={!data.isEmpty}
            >
              {renderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            
            {!data.isEmpty && (
              <>
                <Tooltip content={<CustomTooltip data={data} t={t} />} />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-gray-600 dark:text-gray-300 text-sm ml-2">{value}</span>
                  )}
                  wrapperStyle={{ paddingLeft: "20px" }}
                />
              </>
            )}
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" 
             style={!data.isEmpty ? { transform: 'translate(-50%, -50%)', marginLeft: '-15%' } : {}}
        >
             <span className="text-xs text-gray-500 dark:text-gray-400 block whitespace-nowrap">
               {data.isEmpty ? t('dashboard.no_data') : t('accounts.net_worth')}
             </span>
             {!data.isEmpty && (
               <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block">
                  {formatCurrency(totalNetWorth)}
               </span>
             )}
        </div>
      </div>
    </motion.div>
  );
};

export default AssetCompositionChart;