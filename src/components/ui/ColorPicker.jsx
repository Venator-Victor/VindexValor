import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const ColorPicker = ({ value, onChange, label = "Cor de Identificação", className }) => {
  const [customColor, setCustomColor] = useState('#000000');
  
  // Organized from Warm to Cool, ending with Neutrals
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#283768', // Vindex Dark Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#64748B', // Slate
    '#71717A', // Zinc
    '#000000', // Black
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium text-gray-700 dark:text-vindex-text/80">{label}</Label>
      
      {/* 
         Grid Layout:
         sm:grid-cols-8 ensures 8 items per row on larger screens (16 items total = 2 rows).
         grid-cols-5 fallback for smaller screens.
      */}
      <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 items-center bg-gray-50 dark:bg-vindex-bg/50 p-4 rounded-xl border border-gray-100 dark:border-vindex-border/50 place-items-center">
        {colors.map((color) => (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "w-8 h-8 rounded-lg transition-all relative flex items-center justify-center shadow-sm", // Changed to rounded-lg
              value === color ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-vindex-card ring-gray-900 dark:ring-vindex-text scale-110" : "hover:shadow-md"
            )}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <Check className="w-4 h-4 text-white drop-shadow-md" />
            )}
          </motion.button>
        ))}

        <div className="relative group">
          <motion.div
             whileHover={{ scale: 1.15 }}
             whileTap={{ scale: 0.95 }}
             className={cn(
                "w-8 h-8 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center shadow-sm", // Changed to rounded-lg
                "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                !colors.includes(value) && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-vindex-card ring-gray-900 dark:ring-vindex-text scale-110"
             )}
          >
             {!colors.includes(value) ? (
                 <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: value }}>
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                 </div>
             ) : (
                <Plus className="w-4 h-4 text-white drop-shadow-md" />
             )}
          </motion.div>
          <input 
              type="color" 
              value={!colors.includes(value) ? value : customColor}
              onChange={(e) => {
                  setCustomColor(e.target.value);
                  onChange(e.target.value);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              title="Cor Personalizada"
           />
        </div>
      </div>
      
      {/* Preview and Value Display */}
      <div className="flex items-center gap-2 px-1">
         <div className="w-4 h-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" style={{ backgroundColor: value }} />
         <span className="text-xs text-gray-400 dark:text-vindex-text/50 font-mono uppercase tracking-wider">{value}</span>
      </div>
    </div>
  );
};

export default ColorPicker;