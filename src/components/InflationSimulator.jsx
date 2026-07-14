import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { GridLines, Equal, TrendingDown } from '@/components/BxIcon';
import { SUCCESS, DANGER, chartGrid, chartText, chartCursor } from '@/utils/colors';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formatYAxis = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

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

// Same card shell/icon/header pattern as the dashboard charts (AssetLiabilityChart,
// BudgetConsumptionChart, etc.) — GridLines toggles axis labels, Equal swaps the two
// default series (needed/invested) for a single combined "gain" line.
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
              onClick={() => setShowGain(v => !v)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
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

      {/* Title */}
      <div className="text-center pt-2 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          {t('inflation.simulator_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('inflation.simulator_subtitle')}
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('inflation.current_value')}</label>
          <input
            type="number" min="0" value={currentValue}
            onChange={(e) => setCurrentValue(Number(e.target.value))}
            className={inputClass}
          />
        </div>

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
      </div>

      {/* Header Stats */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: DANGER }}></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.will_need')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {formatCurrency(finalNeeded)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SUCCESS }}></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('inflation.will_be_worth')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {formatCurrency(finalInvested)}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNeeded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DANGER} stopOpacity={0.3} />
                <stop offset="95%" stopColor={DANGER} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SUCCESS} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={beatsInflation ? SUCCESS : DANGER} stopOpacity={0.3} />
                <stop offset="95%" stopColor={beatsInflation ? SUCCESS : DANGER} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showAxis && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
            <XAxis
              dataKey="year"
              tickLine={false} axisLine={false}
              interval={xAxisInterval}
              dy={10}
              tick={showAxis ? { fontSize: 10, fill: textColor } : false}
            />
            <YAxis
              tickLine={false} axisLine={false}
              tickFormatter={formatYAxis}
              width={showAxis ? 40 : 0}
              tick={showAxis ? { fontSize: 10, fill: textColor } : false}
            />
            <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
            {showGain ? (
              <Area type="monotone" dataKey="gain" stroke={beatsInflation ? SUCCESS : DANGER} strokeWidth={2} fill="url(#gradGain)" dot={false} activeDot={{ r: 4 }} />
            ) : (
              <>
                <ReferenceLine y={currentValue} stroke={textColor} strokeDasharray="4 4" strokeOpacity={0.35}>
                  <Label value={t('inflation.today_label')} position="insideTopRight" fontSize={10} fill={textColor} opacity={0.5} />
                </ReferenceLine>
                <Area type="monotone" dataKey="needed" stroke={DANGER} strokeWidth={2} fill="url(#gradNeeded)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="invested" stroke={SUCCESS} strokeWidth={2} fill="url(#gradInvested)" dot={false} activeDot={{ r: 4 }} />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default InflationSimulator;