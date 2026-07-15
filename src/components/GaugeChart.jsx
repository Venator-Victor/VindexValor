import { SUCCESS, DANGER, WARNING, TEXT_SUCCESS, TEXT_WARNING, TEXT_DANGER } from '@/utils/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';

const GaugeChart = ({ value, max, label, size = 200, strokeWidth = 15, className = "my-4", mode = 'usage' }) => {
  const { t } = useTranslation();
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const displayPercentage = max > 0 ? (value / max) * 100 : 0;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const createArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const getColor = (percent) => {
    if (mode === 'progress') {
      if (percent >= 80) return SUCCESS;
      if (percent >= 30) return WARNING;
      return DANGER;
    }
    if (percent <= 50) return SUCCESS;
    if (percent < 90) return WARNING;
    return DANGER;
  };

  const getCenterTextClass = (percent) => {
    if (mode === 'progress') {
      if (percent >= 80) return TEXT_SUCCESS;
      if (percent >= 30) return TEXT_WARNING;
      return TEXT_DANGER;
    }
    if (percent <= 50) return TEXT_SUCCESS;
    if (percent < 90) return TEXT_WARNING;
    return TEXT_DANGER;
  };

  const startAngle = 0;
  const endAngle = 180;
  const currentAngle = (percentage / 100) * 180;

  const color = getColor(displayPercentage);
  const centerTextClass = getCenterTextClass(displayPercentage);

  return (
    <div className={`flex flex-col items-center justify-center relative ${className}`} style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + strokeWidth}>
        <path
          d={createArc(cx, cy, radius, startAngle, endAngle)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-gray-200 dark:text-gray-700 opacity-30"
        />
        <path
          d={createArc(cx, cy, radius, startAngle, currentAngle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-end" style={{ bottom: '0px', height: size/2 }}>
        <span className={`text-2xl font-bold ${centerTextClass}`}>
           {displayPercentage.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500 dark:text-vindex-text/60 mt-1">
          {mode === 'progress' ? t('common.progress') : t('common.usage')}
        </span>
      </div>

      {label && <div className="mt-2 text-sm font-medium text-gray-600 dark:text-vindex-text/80">{label}</div>}
    </div>
  );
};

export default GaugeChart;