import React, { useMemo } from 'react';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { Calendar as CalendarClock } from '@/components/BxIcon';
import { CalendarCheck } from '@/components/BxIcon';

const UpcomingRecurrencesSection = ({ recurrences, selectedPeriod }) => {
  
  // Filter recurrences based on selected period window
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Define end date based on period
    const endDate = new Date(today);
    switch(selectedPeriod) {
        case 'Diário': endDate.setDate(today.getDate() + 1); break;
        case 'Semanal': endDate.setDate(today.getDate() + 7); break;
        case 'Quinzenal': endDate.setDate(today.getDate() + 15); break;
        case 'Mensal': endDate.setMonth(today.getMonth() + 1); break;
        case 'Trimestral': endDate.setMonth(today.getMonth() + 3); break;
        case 'Semestral': endDate.setMonth(today.getMonth() + 6); break;
        case 'Anual': endDate.setFullYear(today.getFullYear() + 1); break;
        default: endDate.setMonth(today.getMonth() + 1);
    }

    return recurrences
      .filter(r => {
        if (r.status !== 'Ativo') return false;
        if (!r.next_date) return false;
        
        const nextDate = new Date(r.next_date + 'T12:00:00');
        // Show if next date is valid AND within range (or if it's late, i.e., before today)
        return nextDate <= endDate;
      })
      .sort((a, b) => new Date(a.next_date) - new Date(b.next_date))
      .slice(0, 5);
  }, [recurrences, selectedPeriod]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Data indefinida';
    const date = new Date(dateString + 'T12:00:00'); 
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateString + 'T12:00:00');
    target.setHours(0,0,0,0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Atrasado';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    return `Em ${diffDays} dias`;
  };

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-500" />
            Próximas Recorrências
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {selectedPeriod}
        </span>
      </div>

      <div className="space-y-4">
        {upcoming.length > 0 ? (
          upcoming.map((item, index) => {
            const daysText = getDaysUntil(item.next_date);
            const isLate = daysText === 'Atrasado';
            const isToday = daysText === 'Hoje';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                {/* Status Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                  isLate ? 'bg-red-500' : isToday ? 'bg-orange-500' : 'bg-blue-500'
                }`} />

                <div className="pl-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.description}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                      {item.frequency}
                    </span>
                    <span className={`text-xs font-medium ${
                      isLate ? 'text-red-500' : isToday ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {daysText}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(item.next_date)}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <CalendarCheck size={40} className="mb-2" />
            <p className="text-sm">Sem recorrências previstas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingRecurrencesSection;