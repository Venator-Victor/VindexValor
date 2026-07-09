import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import BxIcon, { Plus } from '@/components/BxIcon';

const CATEGORIES = [
  { id: 'emergency', name: 'Fundo de Emergência', description: 'Reserva para imprevistos', icon: 'bx-shield-quarter', color: '#EF4444' },
  { id: 'retirement', name: 'Aposentadoria', description: 'Planeje seu futuro', icon: 'bx-user-voice', color: '#3B82F6' },
  { id: 'car', name: 'Carro', description: 'Compra ou troca de veículo', icon: 'bx-car', color: '#F97316' },
  { id: 'home', name: 'Casa', description: 'Entrada ou reforma do imóvel', icon: 'bx-home', color: '#10B981' },
  { id: 'travel', name: 'Viagem', description: 'Economize para sua próxima viagem', icon: 'bx-plane', color: '#06B6D4' },
  { id: 'education', name: 'Educação', description: 'Cursos e capacitação', icon: 'bx-graduation', color: '#EAB308' },
  { id: 'medical', name: 'Gastos Médicos', description: 'Procedimentos e emergências de saúde', icon: 'bx-pulse', color: '#EC4899' },
  { id: 'event', name: 'Evento', description: 'Casamento, festa ou celebração', icon: 'bx-calendar-event', color: '#6366F1' },
  { id: 'debt', name: 'Dívida', description: 'Quite suas dívidas', icon: 'bx-credit-card', color: '#64748B' },
  { id: 'investment', name: 'Investimento', description: 'Invista uma quantia todo mês', icon: 'bx-trending-up', color: '#22C55E' },
  { id: 'business', name: 'Negócio Próprio', description: 'Empreenda ou abra um negócio', icon: 'bx-store', color: '#8B5CF6' },
  { id: 'electronics', name: 'Eletrônicos', description: 'Celular, notebook e gadgets', icon: 'bx-laptop', color: '#14B8A6' },
];

const MetaCategorySelector = ({ onSelect, onCustomSelect }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-vindex-border hover:border-primary hover:bg-gray-50 dark:hover:bg-vindex-bg transition-colors relative group bg-white dark:bg-vindex-card h-full min-h-[160px]"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 flex-shrink-0"
              style={{ backgroundColor: cat.color + '22', color: cat.color }}
            >
              <BxIcon iconClass={`bx ${cat.icon}`} size={24} />
            </div>
            <span className="font-semibold text-gray-900 dark:text-vindex-text text-sm sm:text-base text-center line-clamp-2 leading-tight h-[40px] flex items-center justify-center">{cat.name}</span>
            <span className="text-xs text-gray-500 dark:text-vindex-text/60 mt-1 text-center line-clamp-2 px-1">{cat.description}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-vindex-border mt-2">
        <Button
          onClick={onCustomSelect}
          variant="outline"
          className="w-full sm:w-auto border-dashed border-2 hover:bg-gray-50 dark:hover:bg-vindex-bg dark:text-vindex-text dark:border-vindex-border"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('goals.create_custom_action')}
        </Button>
      </div>
    </div>
  );
};

export default MetaCategorySelector;