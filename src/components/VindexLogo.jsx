import React from 'react';

const VindexLogo = ({ className, collapsed, textColor = "text-white" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Task 2: Proper VindexValor branding logo */}
      <img 
        src="https://horizons-cdn.hostinger.com/2a249bc4-344a-46af-9dec-bb8c9e46ed73/5249fd8daaf81ca40360b2d3e3ff3ab7.png" 
        alt="VindexValor Logo" 
        className="w-10 h-10 object-contain drop-shadow-sm"
      />
      
      {!collapsed && (
        // Task 2: Logo text in white
        <span className={`font-bold text-2xl tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${textColor}`}>
          VindexValor
        </span>
      )}
    </div>
  );
};

export default VindexLogo;