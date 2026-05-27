import React from 'react';

const GaugeChart = ({ value, max, label, size = 200, strokeWidth = 15, className = "my-4" }) => {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  
  // Calculate percentage (0 to 100)
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const displayPercentage = max > 0 ? (value / max) * 100 : 0;
  
  // Convert polar to cartesian
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Create SVG path for arc
  const createArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Determine color based on usage
  const getColor = (percent) => {
    if (percent < 80) return '#10B981'; // Green
    if (percent < 100) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  };

  // Gauge spans 180 degrees (from 0 to 180)
  const startAngle = 0;
  const endAngle = 180;
  const currentAngle = (percentage / 100) * 180;

  const color = getColor(displayPercentage);

  return (
    <div className={`flex flex-col items-center justify-center relative ${className}`} style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + strokeWidth}>
        {/* Background Arc */}
        <path
          d={createArc(cx, cy, radius, startAngle, endAngle)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-gray-200 dark:text-gray-700 opacity-30"
        />
        {/* Progress Arc */}
        <path
          d={createArc(cx, cy, radius, startAngle, currentAngle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-end" style={{ bottom: '0px', height: size/2 }}>
        <span className={`text-2xl font-bold ${displayPercentage > 100 ? 'text-red-500' : 'text-gray-900 dark:text-vindex-text'}`}>
           {displayPercentage.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500 dark:text-vindex-text/60 mt-1">Utilização</span>
      </div>
      
      {/* Label at bottom */}
      {label && <div className="mt-2 text-sm font-medium text-gray-600 dark:text-vindex-text/80">{label}</div>}
    </div>
  );
};

export default GaugeChart;