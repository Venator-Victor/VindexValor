import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { TrendingDown, TrendingUp } from '@/components/BxIcon';
import { SUCCESS, DANGER_DARK } from '@/utils/colors';

const InflationSimulator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentValue, setCurrentValue] = useState(1000);
  const [inflationRate, setInflationRate] = useState(4.5);
  const [returnRate, setReturnRate] = useState(8.0);
  const [years, setYears] = useState(10);

  const textColor = isDark ? '#d1dcf0' : '#1f2937';
  const gridColor = isDark ? '#283768' : '#e5e7eb';
  const tooltipBg = isDark ? '#161e3b' : '#ffffff';
  const tooltipBorder = isDark ? '#283768' : '#e2e8f0';

  const chartData = useMemo(() => {
    return Array.from({ length: years }, (_, i) => {
      const y = i + 1;
      return {
        year: `${y}${t('investment_sim.year_unit')}`,
        needed: parseFloat((currentValue * Math.pow(1 + inflationRate / 100, y)).toFixed(2)),
        invested: parseFloat((currentValue * Math.pow(1 + returnRate / 100, y)).toFixed(2)),
      };
    });
  }, [currentValue, inflationRate, returnRate, years, t]);

  const finalNeeded = chartData.at(-1)?.needed ?? currentValue;
  const finalInvested = chartData.at(-1)?.invested ?? currentValue;
  const realGain = finalInvested - finalNeeded;
  const beatsInflation = realGain >= 0;

  const xAxisInterval = years > 15 ? Math.floor(years / 8) : 0;

  const inputClass =
    'w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-vindex-danger no-spinner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          {t('inflation.simulator_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('inflation.simulator_subtitle')}
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Inputs + Summary */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('inflation.current_value')}</label>
            <input
              type="number" min="0" value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-vindex-danger inline-block" />
                {t('inflation.inflation_rate')}
              </label>
              <input
                type="number" min="0" step="0.1" value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-vindex-success inline-block" />
                {t('inflation.return_rate')}
              </label>
              <input
                type="number" min="0" step="0.1" value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('inflation.years')} — <span className="text-gray-900 dark:text-vindex-text font-semibold">{t('investment_sim.years_count', { count: years })}</span>
            </label>
            <input
              type="range" min="1" max="100" value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-vindex-danger cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              <span>1a</span><span>50a</span><span>100a</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-gray-200 dark:border-vindex-border overflow-hidden text-sm">
            <div className="p-3 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-vindex-danger" /> {t('inflation.will_need')}
              </span>
              <span className="font-semibold text-vindex-danger">{formatCurrency(finalNeeded)}</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50 bg-green-50 dark:bg-green-900/10">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-vindex-success" /> {t('inflation.will_be_worth')}
              </span>
              <span className="font-semibold text-vindex-success">{formatCurrency(finalInvested)}</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50">
              <span className="text-gray-500 dark:text-gray-400">{t('inflation.balance_vs_inflation')}</span>
              <span className={`font-bold ${beatsInflation ? 'text-vindex-success' : 'text-vindex-danger'}`}>
                {beatsInflation ? '+' : ''}{formatCurrency(realGain)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="md:col-span-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="gradNeeded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DANGER_DARK} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={DANGER_DARK} stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SUCCESS} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="year"
                stroke={textColor} fontSize={11}
                tickLine={false} axisLine={false}
                interval={xAxisInterval}
                tickMargin={10}
              />
              <YAxis
                stroke={textColor} fontSize={11}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                tickMargin={8}
                width={52}
              />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }}
                itemStyle={{ color: textColor }}
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === 'needed' ? t('inflation.needed_label') : t('inflation.return_investment_label'),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === 'needed' ? t('inflation.needed_label') : t('inflation.return_investment_label')
                }
              />
              <ReferenceLine y={currentValue} stroke={textColor} strokeDasharray="4 4" strokeOpacity={0.35}>
                <Label value={t('inflation.today_label')} position="insideTopRight" fontSize={10} fill={textColor} opacity={0.5} />
              </ReferenceLine>
              <Area type="monotone" dataKey="needed" stroke={DANGER_DARK} fill="url(#gradNeeded)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="invested" stroke={SUCCESS} fill="url(#gradInvested)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default InflationSimulator;