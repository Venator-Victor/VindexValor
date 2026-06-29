import React from 'react';
import { motion } from 'framer-motion';
import GaugeChart from './GaugeChart';

const GaugeSummaryCard = ({
  leftLabel,
  leftValue,
  leftClassName = 'text-gray-900 dark:text-vindex-text',
  rightLabel,
  rightValue,
  rightClassName = 'text-gray-900 dark:text-vindex-text',
  gaugeValue,
  gaugeMax,
  title,
  motionKey,
}) => (
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
        <p className={`text-2xl font-bold ${leftClassName}`}>{leftValue}</p>
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
        />
      </div>

      <div className="text-center min-w-[120px]">
        <p className="text-sm font-medium text-gray-500 dark:text-vindex-text/70">{rightLabel}</p>
        <p className={`text-2xl font-bold ${rightClassName}`}>{rightValue}</p>
      </div>
    </div>
  </motion.div>
);

export default GaugeSummaryCard;