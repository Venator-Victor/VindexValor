import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, isProfitability }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isProfitability
              ? `${payload[0].value.toFixed(2)}%`
              : formatCurrency(payload[0].value)
            }
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const InvestmentsChart = ({ data, displayMode }) => {
  const isProfitability = displayMode === 'rentabilidade';

  // Calculate current value (last point) or default to 0
  const lastPoint = data && data.length > 0 ? data[data.length - 1] : { value: 0 };
  const currentValue = lastPoint.value || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-[400px] bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border p-4 shadow-sm relative"
    >
      {/* Centered Value Header */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {isProfitability ? 'Rentabilidade' : 'Valor Total'}
          </span>
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
             {isProfitability 
                ? `${currentValue >= 0 ? '+' : ''}${currentValue.toFixed(2)}%`
                : formatCurrency(currentValue)
             }
          </span>
      </div>

      <div className="h-full w-full pt-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={SUCCESS} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700/30" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
              minTickGap={40}
            />
            <YAxis 
              hide={true} 
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip isProfitability={isProfitability} />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isProfitability ? SUCCESS : PRIMARY} 
              strokeWidth={3}
              strokeDasharray="5 5" // Dashed line style
              fillOpacity={1} 
              fill={isProfitability ? "url(#colorProfit)" : "url(#colorValue)"} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default InvestmentsChart;