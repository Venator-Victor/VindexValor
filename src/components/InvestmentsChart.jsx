import { PRIMARY, SUCCESS, DANGER, DANGER_DARK, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useState } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GridLines, Equal } from '@/components/BxIcon';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formatValueAxis = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

const formatPercentAxis = (v) => `${v.toFixed(0)}%`;

const CustomTooltip = ({ active, payload, t }) => {
  if (active && payload && payload.length) {
    const displayDate = payload[0]?.payload?.displayDate;
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{displayDate}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'invested' ? t('investments.col_invested')
                : entry.dataKey === 'currentValue' ? t('investments.display_current_value')
                : t('investments.display_return')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {entry.dataKey === 'profitability' ? `${entry.value.toFixed(2)}%` : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const InvestmentsChart = ({ data = [] }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAxis, setShowAxis] = useState(true);
  const [showCurrentValue, setShowCurrentValue] = useState(false);

  // Current values (last point) or default to 0
  const lastPoint = data.length > 0 ? data[data.length - 1] : { invested: 0, profitability: 0 };
  const currentInvested = lastPoint.invested || 0;
  const currentProfitability = lastPoint.profitability || 0;
  const isPositive = currentProfitability >= 0;
  const profitColor = isPositive ? SUCCESS : (isDark ? DANGER_DARK : DANGER);
  const hasData = data.some(d => Math.abs(d.invested) > 0 || Math.abs(d.profitability) > 0);

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
              onClick={() => setShowCurrentValue(v => !v)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors z-10 ${
                showCurrentValue
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg'
              }`}
          >
              <Equal size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{showCurrentValue ? t('investments.chart_hide_current_value') : t('investments.chart_show_current_value')}</TooltipContent>
      </UiTooltip>

      {/* Header Stats */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('investments.col_invested')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {formatCurrency(currentInvested)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: profitColor }}></div>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('investments.display_return')}</span>
          </div>
          <div className="text-3xl font-bold mb-2 tracking-tight" style={{ color: profitColor }}>
            {isPositive ? '+' : ''}{currentProfitability.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[250px] w-full">
        {!hasData ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {t('investments.chart_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="investValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="investProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={profitColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={profitColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              {showAxis && <CartesianGrid yAxisId="value" strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />}
              <XAxis
                dataKey="xKey"
                tickFormatter={(xKey) => data[xKey]?.displayDate ?? ''}
                axisLine={false}
                tickLine={false}
                tick={showAxis ? { fill: chartText(isDark), fontSize: 10 } : false}
                dy={10}
                minTickGap={40}
              />
              <YAxis
                yAxisId="value"
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={showAxis ? { fill: chartText(isDark), fontSize: 10 } : false}
                tickFormatter={formatValueAxis}
                width={showAxis ? 40 : 0}
              />
              {!showCurrentValue && (
                <YAxis
                  yAxisId="profitability"
                  orientation="right"
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={showAxis ? { fill: chartText(isDark), fontSize: 10 } : false}
                  tickFormatter={formatPercentAxis}
                  width={showAxis ? 40 : 0}
                />
              )}
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
              {showCurrentValue ? (
                <Area
                  yAxisId="value"
                  type="natural"
                  dataKey="currentValue"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  fill="url(#investValueGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ) : (
                <>
                  <Area
                    yAxisId="value"
                    type="natural"
                    dataKey="invested"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#investValueGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="profitability"
                    type="natural"
                    dataKey="profitability"
                    stroke={profitColor}
                    strokeWidth={2}
                    fill="url(#investProfitGradient)"
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

export default InvestmentsChart;
