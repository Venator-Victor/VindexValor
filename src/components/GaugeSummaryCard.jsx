import React from 'react';
import { motion } from 'framer-motion';
import GaugeChart from './GaugeChart';
import { TEXT_SUCCESS, TEXT_WARNING, TEXT_DANGER, TEXT_PRIMARY } from '@/utils/colors';

const getDynamicLeftColor = (pct, mode) => {
  if (mode === 'progress') {
    if (pct >= 80) return TEXT_SUCCESS;
    if (pct >= 30) return TEXT_WARNING;
    return TEXT_DANGER;
  }
  if (pct <= 50) return TEXT_SUCCESS;
  if (pct < 90) return TEXT_WARNING;
  return TEXT_DANGER;
};

const GaugeSummaryCard = ({
  leftLabel,
  leftValue,
  leftClassName,
  rightLabel,
  rightValue,
  rightClassName = 'text-gray-900 dark:text-vindex-text',
  gaugeValue,
  gaugeMax,
  title,
  motionKey,
  mode = 'usage',
}) => {
  const pct = gaugeMax > 0 ? (gaugeValue / gaugeMax) * 100 : 0;
  const resolvedLeftClass = leftClassName ?? (gaugeMax <= 0 && mode === 'progress'
    ? TEXT_PRIMARY
    : getDynamicLeftColor(pct, mode));

  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm"
    >
      <div className="flex flex-col md:flex-row justify-around items-center gap-6">
        <div className="text-center min-w-[120px]">
          <p className="text-sm font-medium text-gray-500 dark:text-vindex-text/70">{leftLabel}</p>
          <p className={`text-2xl font-bold ${resolvedLeftClass}`}>{leftValue}</p>
        </div>

        <div className="flex flex-col items-center">
          {title && (
            <p className="text-base font-semibold text-gray-700 dark:text-vindex-text mb-1">{title}</p>
          )}
          <GaugeChart
            value={gaugeValue}
            max={gaugeMax > 0 ? gaugeMax : 100}
            size={160}
            strokeWidth={16}
            className="my-0"
            mode={mode}
          />
        </div>

        <div className="text-center min-w-[120px]">
          <p className="text-sm font-medium text-gray-500 dark:text-vindex-text/70">{rightLabel}</p>
          <p className={`text-2xl font-bold ${rightClassName}`}>{rightValue}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default GaugeSummaryCard;