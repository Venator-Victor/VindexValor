import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, GridLines, Equal } from '@/components/BxIcon';
import { PRIMARY, SUCCESS, chartGrid, chartText, chartCursor } from '@/utils/colors';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'invested' ? t('investment_sim.invested_label')
                : entry.dataKey === 'interest' ? t('investment_sim.interest_label')
                : t('investment_sim.total_label')}
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

const InvestmentSimulator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [initialDeposit, setInitialDeposit] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [years, setYears] = useState(20);
  const [showAxis, setShowAxis] = useState(true);
  const [showTotal, setShowTotal] = useState(false);

  const textColor = chartText(isDark);
  const gridColor = chartGrid(isDark);

  const chartData = useMemo(() => {
    const monthlyRate = annualReturn / 100 / 12;

    return Array.from({ length: years }, (_, i) => {
      const y = i + 1;
      const n = y * 12;

      const fvInitial = initialDeposit * Math.pow(1 + monthlyRate, n);
      const fvMonthly = monthlyRate === 0
        ? monthlyAmount * n
        : monthlyAmount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);

      const total = fvInitial + fvMonthly;
      const invested = initialDeposit + monthlyAmount * n;
      const interest = total - invested;

      const clampedInterest = Math.max(0, interest);
      return {
        year: `${y}${t('investment_sim.year_unit')}`,
        invested: parseFloat(invested.toFixed(2)),
        interest: parseFloat(clampedInterest.toFixed(2)),
        total: parseFloat((invested + clampedInterest).toFixed(2)),
      };
    });
  }, [initialDeposit, monthlyAmount, annualReturn, years, t]);

  // Find year where compound interest first overtakes total capital
  const crossoverPoint = chartData.find(d => d.interest >= d.invested);

  const lastPoint = chartData.at(-1);
  const totalInvested = lastPoint?.invested ?? 0;
  const totalInterest = lastPoint?.interest ?? 0;
  const totalAccumulated = totalInvested + totalInterest;
  const interestRatio = totalAccumulated > 0
    ? ((totalInterest / totalAccumulated) * 100).toFixed(1)
    : '0.0';

  const xAxisInterval = years <= 10 ? 0 : years <= 30 ? 4 : 9;

  const formatYAxis = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return v;
  };

  const inputClass =
    'w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-sm text-gray-900 dark:text-gray-100 outline-none hover:border-primary focus:border-primary no-spinner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-2xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden relative"
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <UiTooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
                type="button"
                onClick={() => setShowAxis(v => !v)}
                className={`p-1.5 rounded-md transition-colors ${
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
                onClick={() => setShowTotal(v => !v)}
                className={`p-1.5 rounded-md transition-colors ${
                  showTotal
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
                }`}
            >
                <Equal size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{showTotal ? t('investment_sim.chart_hide_total') : t('investment_sim.chart_show_total')}</TooltipContent>
        </UiTooltip>
      </div>

      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          {t('investment_sim.title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('investment_sim.subtitle')}
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Inputs + Summary */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('investment_sim.initial_deposit')}
            </label>
            <input
              type="number" min="0" value={initialDeposit}
              onChange={(e) => setInitialDeposit(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('investment_sim.monthly_amount')}
            </label>
            <input
              type="number" min="0" value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('investment_sim.annual_return')}
            </label>
            <input
              type="number" min="0" step="0.1" value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('investment_sim.years')} —{' '}
              <span className="text-gray-900 dark:text-vindex-text font-semibold">
                {t('investment_sim.years_count', { count: years })}
              </span>
            </label>
            <input
              type="range" min="1" max="100" value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              <span>{`1${t('investment_sim.year_unit')}`}</span><span>{`50${t('investment_sim.year_unit')}`}</span><span>{`100${t('investment_sim.year_unit')}`}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-gray-200 dark:border-vindex-border overflow-hidden text-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('investment_sim.total_label')}</p>
              <p className="text-2xl font-bold text-emerald-500 mt-0.5">
                {formatCurrency(totalAccumulated)}
              </p>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: PRIMARY }} />
                {t('investment_sim.invested_label')}
              </span>
              <span className="font-semibold text-gray-900 dark:text-vindex-text">
                {formatCurrency(totalInvested)}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SUCCESS }} />
                {t('investment_sim.interest_label')}
              </span>
              <span className="font-bold text-emerald-500">+{formatCurrency(totalInterest)}</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50">
              <span className="text-gray-500 dark:text-gray-400">{t('investment_sim.interest_ratio', { ratio: interestRatio })}</span>
            </div>
            {crossoverPoint && (
              <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50 bg-emerald-50/50 dark:bg-emerald-900/5">
                <span className="text-gray-500 dark:text-gray-400">{t('investment_sim.interest_overtakes')}</span>
                <span className="font-semibold text-emerald-500">{t('investment_sim.year_label', { year: crossoverPoint.year.replace(t('investment_sim.year_unit'), '') })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="md:col-span-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="gradCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="gradJuros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={SUCCESS} stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              {showAxis && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
              <XAxis
                dataKey="year"
                stroke={textColor} fontSize={11}
                tickLine={false} axisLine={false}
                interval={xAxisInterval}
                tickMargin={10}
                tick={showAxis ? { fontSize: 11, fill: textColor } : false}
              />
              <YAxis
                stroke={textColor} fontSize={11}
                tickLine={false} axisLine={false}
                tickFormatter={formatYAxis}
                tickMargin={8}
                width={showAxis ? 56 : 0}
                tick={showAxis ? { fontSize: 11, fill: textColor } : false}
              />
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
              {showTotal ? (
                <Area
                  type="monotone" dataKey="total"
                  stroke={PRIMARY} fill="url(#gradTotal)" strokeWidth={1.5}
                />
              ) : (
                <>
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) =>
                      value === 'invested' ? t('investment_sim.invested_label') : t('investment_sim.interest_label')
                    }
                  />
                  {crossoverPoint && (
                    <ReferenceLine
                      x={crossoverPoint.year}
                      stroke={SUCCESS} strokeDasharray="4 4" strokeOpacity={0.8}
                    >
                      <Label
                        value={t('investment_sim.interest_over_capital')}
                        position="insideTopRight"
                        fontSize={10}
                        fill={SUCCESS}
                        opacity={0.9}
                        offset={4}
                      />
                    </ReferenceLine>
                  )}
                  <Area
                    type="monotone" dataKey="invested" stackId="1"
                    stroke={PRIMARY} fill="url(#gradCapital)" strokeWidth={1.5}
                  />
                  <Area
                    type="monotone" dataKey="interest" stackId="1"
                    stroke={SUCCESS} fill="url(#gradJuros)" strokeWidth={1.5}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentSimulator;