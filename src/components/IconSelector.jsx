import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import 'boxicons/css/boxicons.min.css';

const IconSelector = ({ selectedIcon, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // A curated list of useful Boxicons
  const icons = [
    'bx-target-lock', 'bx-money', 'bx-trophy', 'bx-home', 'bx-car', 
    'bx-plane', 'bx-book', 'bx-graduation', 'bx-briefcase', 'bx-gift',
    'bx-heart', 'bx-star', 'bx-diamond', 'bx-mobile', 'bx-laptop',
    'bx-camera', 'bx-music', 'bx-video', 'bx-joystick', 'bx-dumbbell',
    'bx-first-aid', 'bx-building', 'bx-store', 'bx-cart', 'bx-wallet',
    'bx-credit-card', 'bx-dollar', 'bx-euro', 'bx-bitcoin', 'bx-pie-chart',
    'bx-bar-chart', 'bx-line-chart', 'bx-cloud', 'bx-sun', 'bx-moon',
    'bx-water', 'bx-bulb', 'bx-restaurant', 'bx-coffee', 'bx-bed'
  ];

  const filteredIcons = icons.filter(icon => 
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Buscar ícone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text text-sm focus:outline-none focus:ring-1 focus:ring-vindex-success"
      />
      
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-vindex-border rounded-lg bg-gray-50 dark:bg-vindex-bg/50">
        {filteredIcons.length > 0 ? filteredIcons.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={`
              aspect-square flex items-center justify-center rounded-lg transition-all text-xl
              ${selectedIcon === icon 
                ? 'bg-primary text-primary-foreground scale-110 shadow-md' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-vindex-border/50'}
            `}
            title={icon.replace('bx-', '')}
          >
            <i className={`bx ${icon}`}></i>
          </button>
        )) : (
          <div className="col-span-full text-center text-sm text-gray-500 py-4">
            Nenhum ícone encontrado
          </div>
        )}
      </div>
      
      {selectedIcon && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Selecionado:</span>
          <i className={`bx ${selectedIcon} text-lg text-primary`}></i>
          <span className="font-mono">{selectedIcon}</span>
        </div>
      )}
    </div>
  );
};

export default IconSelector;