import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BxIcon, { Plus } from '@/components/BxIcon';

const CATEGORIES = [
  { id: 'emergency', name: 'Fundo de Emergência', icon: 'bx-shield-quarter', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'retirement', name: 'Aposentadoria', icon: 'bx-user-voice', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'car', name: 'Carro', icon: 'bx-car', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'home', name: 'Casa', icon: 'bx-home', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'travel', name: 'Viagem', icon: 'bx-plane', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'education', name: 'Educação', icon: 'bx-graduation', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'medical', name: 'Gastos Médicos', icon: 'bx-pulse', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { id: 'event', name: 'Evento', icon: 'bx-calendar-event', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'debt', name: 'Dívida', icon: 'bx-credit-card', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
];

const MetaCategorySelector = ({ onSelect, onCustomSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">O que você deseja conquistar?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Escolha uma categoria para começar sua meta</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(cat)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 text-center h-[110px] gap-3 group
              ${cat.bg} border-transparent hover:border-gray-200 dark:hover:border-gray-700
            `}
          >
            <div className={`text-3xl ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
              <BxIcon iconClass={`bx ${cat.icon}`} size={28} />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button 
          variant="outline" 
          onClick={onCustomSelect}
          className="w-full h-12 border-dashed border-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 gap-2"
        >
          <Plus size={18} />
          Crie uma nova meta personalizada
        </Button>
      </div>
    </div>
  );
};

export default MetaCategorySelector;