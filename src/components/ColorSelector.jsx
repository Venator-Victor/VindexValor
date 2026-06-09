import React from 'react';
import { Label } from '@/components/ui/label';
import { Check, Plus } from '@/components/BxIcon';

const ColorSelector = ({ selectedColor, onSelect }) => {
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
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 dark:text-vindex-text/80">Cor de Identificação</Label>
      
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 items-center">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className={`
              w-6 h-6 rounded-lg transition-all relative border border-gray-200 dark:border-transparent mx-auto
              ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-vindex-card ring-gray-900 dark:ring-vindex-text scale-110' : 'hover:scale-110'}
            `}
            style={{ backgroundColor: color }}
            title={color}
          >
            {selectedColor === color && (
              <Check size={12} className="text-white absolute inset-0 m-auto font-bold" />
            )}
          </button>
        ))}

        {/* Custom Color Picker Button */}
        <div className={`
          relative w-6 h-6 rounded-lg overflow-hidden transition-all group cursor-pointer mx-auto
          bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
          shadow-sm hover:shadow-md hover:scale-110
          ${!colors.includes(selectedColor) ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-vindex-card ring-gray-900 dark:ring-vindex-text scale-110' : ''}
        `}>
           <input 
              type="color" 
              value={selectedColor}
              onChange={(e) => onSelect(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              title="Cor Personalizada"
           />
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!colors.includes(selectedColor) ? (
                 <div className="w-full h-full" style={{ backgroundColor: selectedColor }}>
                    <Check size={12} className="text-white absolute inset-0 m-auto font-bold" />
                 </div>
              ) : (
                 <Plus size={12} className="text-white font-bold drop-shadow-md" />
              )}
           </div>
        </div>
      </div>
      
      {/* Helper text showing selected value */}
      <div className="flex items-center gap-2 mt-1">
         <span className="text-xs text-gray-400 dark:text-vindex-text/50 font-mono uppercase tracking-wider">{selectedColor}</span>
      </div>
    </div>
  );
};

export default ColorSelector;