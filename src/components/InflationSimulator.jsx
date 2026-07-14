import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { TrendingDown, TrendingUp, GridLines, Equal } from '@/components/BxIcon';
import { SUCCESS, DANGER, chartGrid, chartText, chartCursor } from '@/utils/colors';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'needed' ? t('inflation.needed_label')
                : entry.dataKey === 'invested' ? t('inflation.return_investment_label')
                : t('inflation.balance_vs_inflation')}
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

const InflationSimulator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentValue, setCurrentValue] = useState(1000);
  const [inflationRate, setInflationRate] = useState(4.5);
  const [returnRate, setReturnRate] = useState(8.0);
  const [years, setYears] = useState(10);
  const [showAxis, setShowAxis] = useState(true);
  const [showGain, setShowGain] = useState(false);

  const textColor = chartText(isDark);
  const gridColor = chartGrid(isDark);

  const chartData = useMemo(() => {
    return Array.from({ length: years }, (_, i) => {
      const y = i + 1;
      const needed = parseFloat((currentValue * Math.pow(1 + inflationRate / 100, y)).toFixed(2));
      const invested = parseFloat((currentValue * Math.pow(1 + returnRate / 100, y)).toFixed(2));
      return {
        year: `${y}${t('investment_sim.year_unit')}`,
        needed,
        invested,
        gain: parseFloat((invested - needed).toFixed(2)),
      };
    });
  }, [currentValue, inflationRate, returnRate, years, t]);

  const finalNeeded = chartData.at(-1)?.needed ?? currentValue;
  const finalInvested = chartData.at(-1)?.invested ?? currentValue;
  const realGain = finalInvested - finalNeeded;
  const beatsInflation = realGain >= 0;

  const xAxisInterval = years > 15 ? Math.floor(years / 8) : 0;

  const inputClass =
    'w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-400 no-spinner';

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
                onClick={() => setShowGain(v => !v)}
                className={`p-1.5 rounded-md transition-colors ${
                  showGain
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
                }`}
            >
                <Equal size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{showGain ? t('inflation.chart_hide_impact') : t('inflation.chart_show_impact')}</TooltipContent>
        </UiTooltip>
      </div>

      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-400" />
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
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: DANGER }} />
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
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SUCCESS }} />
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
              className="w-full accent-red-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              <span>1a</span><span>50a</span><span>100a</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-gray-200 dark:border-vindex-border overflow-hidden text-sm">
            <div className="p-3 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" /> {t('inflation.will_need')}
              </span>
              <span className="font-semibold text-red-400">{formatCurrency(finalNeeded)}</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50 bg-green-50 dark:bg-green-900/10">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> {t('inflation.will_be_worth')}
              </span>
              <span className="font-semibold text-emerald-500">{formatCurrency(finalInvested)}</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-gray-100 dark:border-vindex-border/50">
              <span className="text-gray-500 dark:text-gray-400">{t('inflation.balance_vs_inflation')}</span>
              <span className={`font-bold ${beatsInflation ? 'text-emerald-500' : 'text-red-400'}`}>
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
                  <stop offset="5%" stopColor={DANGER} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={DANGER} stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={SUCCESS} stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={beatsInflation ? SUCCESS : DANGER} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={beatsInflation ? SUCCESS : DANGER} stopOpacity={0.4} />
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
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                tickMargin={8}
                width={showAxis ? 52 : 0}
                tick={showAxis ? { fontSize: 11, fill: textColor } : false}
              />
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
              {showGain ? (
                <Area type="monotone" dataKey="gain" stroke={beatsInflation ? SUCCESS : DANGER} fill="url(#gradGain)" strokeWidth={1.5} dot={false} />
              ) : (
                <>
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) =>
                      value === 'needed' ? t('inflation.needed_label') : t('inflation.return_investment_label')
                    }
                  />
                  <ReferenceLine y={currentValue} stroke={textColor} strokeDasharray="4 4" strokeOpacity={0.35}>
                    <Label value={t('inflation.today_label')} position="insideTopRight" fontSize={10} fill={textColor} opacity={0.5} />
                  </ReferenceLine>
                  <Area type="monotone" dataKey="needed" stroke={DANGER} fill="url(#gradNeeded)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="invested" stroke={SUCCESS} fill="url(#gradInvested)" strokeWidth={1.5} dot={false} />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default InflationSimulator;