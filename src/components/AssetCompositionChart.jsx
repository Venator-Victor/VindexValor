import { PRIMARY, SUCCESS, DANGER, DANGER_DARK } from '@/utils/colors';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, isCryptoCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { DoughnutChart } from '@/components/BxIcon';

const CustomTooltip = ({ active, payload, isEmpty }) => {
  if (active && payload && payload.length && !isEmpty) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Same card shell as AccountsSummarySection (rounded-xl, plain header) — this and the
// accounts card sit side by side at 50/50 width on the dashboard. Unlike the earlier
// version of this component, `totalLiabilities` is still taken as a prop (the same
// value AssetLiabilityChart shows), since a credit card's real debt comes from its
// invoice ledger, not its raw balance — that nuance only needs to live in one place.
// The asset side, though, is broken down here into where it actually sits (cash,
// crypto, investments) rather than collapsed into a single "assets" number.
const AssetCompositionChart = ({ accounts = [], investments = [], exchangeRates = {}, totalLiabilities = 0 }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { chartData, totalAssets, isEmpty } = useMemo(() => {
    const liquidAssets = accounts.reduce((sum, acc) => {
      if (isCryptoCurrency(acc.currency)) return sum;
      const currency = acc.currency || 'BRL';
      const rate = exchangeRates[currency] || 1;
      const balance = Number(acc.balance) * (currency === 'BRL' ? 1 : rate);
      return balance > 0 ? sum + balance : sum;
    }, 0);

    const cryptoAssets = accounts.reduce((sum, acc) => {
      if (!isCryptoCurrency(acc.currency)) return sum;
      // Convert the raw cryptocurrency amount to BRL equivalent using fetched exchange rate.
      // Fallback to manual expected_return if exchangeRates is missing.
      const rate = exchangeRates[acc.currency] || acc.expected_return || 1;
      const balanceInBRL = Number(acc.balance) * rate;
      return balanceInBRL > 0 ? sum + balanceInBRL : sum;
    }, 0);

    const totalInvestments = investments.reduce((sum, inv) => {
      return sum + Number(inv.current_amount || inv.invested_amount || 0);
    }, 0);

    const data = [
      { name: t('dashboard.cash_balance'), value: liquidAssets, color: PRIMARY },
      { name: t('dashboard.cryptocurrencies'), value: cryptoAssets, color: '#f59e0b' },
      { name: t('nav.investments'), value: totalInvestments, color: SUCCESS },
      { name: t('dashboard.liabilities_debts'), value: totalLiabilities, color: isDark ? DANGER_DARK : DANGER }
    ].filter(item => item.value > 0);

    return {
      chartData: data,
      totalAssets: liquidAssets + cryptoAssets + totalInvestments,
      isEmpty: liquidAssets === 0 && cryptoAssets === 0 && totalInvestments === 0 && totalLiabilities === 0
    };
  }, [accounts, investments, exchangeRates, totalLiabilities, isDark, t]);

  const netWorth = totalAssets - totalLiabilities;

  const emptyData = [{ name: t('dashboard.no_data'), value: 1, color: isDark ? '#374151' : '#E5E7EB' }];
  const renderData = isEmpty ? emptyData : chartData;

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <DoughnutChart size={20} className="text-purple-500" />
            {t('dashboard.composition_title')}
        </h3>
      </div>

      <div className="flex-1 min-h-[180px] flex flex-col">
        <div className="shrink-0 text-center mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 block whitespace-nowrap">
            {isEmpty ? t('dashboard.no_data') : t('accounts.net_worth')}
          </span>
          {!isEmpty && (
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-50 block whitespace-nowrap">
              {formatCurrency(netWorth)}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={renderData}
                cx="50%"
                cy="50%"
                innerRadius={isEmpty ? 50 : 55}
                outerRadius={isEmpty ? 70 : 80}
                paddingAngle={isEmpty ? 0 : 3}
                dataKey="value"
                stroke="none"
                isAnimationActive={!isEmpty}
              >
                {renderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>

              {!isEmpty && (
                <>
                  <Tooltip content={<CustomTooltip isEmpty={isEmpty} />} />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-gray-600 dark:text-gray-300 text-xs ml-1">{value}</span>
                    )}
                  />
                </>
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AssetCompositionChart;
