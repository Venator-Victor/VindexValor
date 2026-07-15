import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/calculations';
import { differenceInDays, isPast, parseISO } from 'date-fns';
import BxIcon from '@/components/BxIcon';

const MetaProgressCard = ({ goal, index = 0, onClick }) => {
  const { t } = useTranslation();
  const isTargetMode = goal.goal_type === 'target_value';

  // Calculate percentage
  const accumulated = Number(goal.accumulated_amount) || 0;
  const target = Number(isTargetMode ? goal.targetAmount : goal.contributionValue) || 0;
  // The ring itself can't visually exceed a full circle, so its fill stays capped —
  // but the printed number shouldn't lie about it, otherwise a goal overshot at
  // 150% would silently read as a flat "100%".
  const displayPercentage = target > 0 ? (accumulated / target) * 100 : 0;
  const percentage = Math.min(displayPercentage, 100);

  const isAchieved = isTargetMode && percentage >= 100;
  const isOverdue = goal.deadline && isPast(parseISO(goal.deadline)) && !isAchieved;
  const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;

  // Colors for gauge
  const getGaugeColor = (pct) => {
    if (pct < 30) return DANGER; // Red
    if (pct < 80) return WARNING; // Yellow
    return SUCCESS; // Green
  };

  const color = getGaugeColor(displayPercentage);
  
  // SVG config — sized to match CircularProgressBar's 48px/stroke-4 gauge on category cards.
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onClick && onClick(goal)}
      onMouseEnter={e => { if (!isOverdue) e.currentTarget.style.borderColor = PRIMARY; }}
      onMouseLeave={e => { if (!isOverdue) e.currentTarget.style.borderColor = ''; }}
      className={`bg-white dark:bg-vindex-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer
        ${isOverdue ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-vindex-border'}
      `}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Left Side Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0"
            style={{
                backgroundColor: goal.color + '22',
                color: goal.color,
                borderColor: goal.color + '44'
            }}
          >
            <BxIcon iconClass={`bx ${goal.icon || 'bx-target-lock'}`} size={20} />
          </div>
          <div className="text-left flex-grow overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={goal.name}>
                {goal.name}
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
                {goal.goal_type === 'monthly_value' ? t('goals.type_recurring') : t('goals.type_fixed_badge')}
            </p>
            {goal.deadline && isTargetMode && (
                <p className={`text-xs truncate ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isOverdue ? t('goals.overdue_card') : t('goals.days_left_full', { count: daysLeft })}
                </p>
            )}
          </div>
        </div>

        {/* Right Side Gauge */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">
                    {displayPercentage.toFixed(0)}%
                </span>
            </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
        <div className="text-left">
           <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('goals.accumulated')}</span>
           <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block truncate" title={formatCurrency(goal.accumulated_amount)}>
             {formatCurrency(goal.accumulated_amount)}
           </span>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-gray-700 dark:text-gray-300 block">
              {isTargetMode ? t('goals.target_total') : t('goals.target_period')}
           </span>
           <span className="text-lg font-bold text-gray-900 dark:text-gray-50 block truncate" title={isTargetMode ? formatCurrency(goal.targetAmount) : formatCurrency(goal.contributionValue)}>
             {isTargetMode ? formatCurrency(goal.targetAmount) : formatCurrency(goal.contributionValue)}
           </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MetaProgressCard;