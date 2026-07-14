import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarClock } from '@/components/BxIcon';
import { CalendarCheck } from '@/components/BxIcon';
import { getDateFilterRange, getDateFilterLabel } from '@/utils/dateFilter';
import { PRIMARY } from '@/utils/colors';

const UpcomingRecurrencesSection = ({ recurrences, dateFilter }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // "Upcoming" always looks forward from today — the calendar date filter can point at
  // a past or specific range, so we borrow only its *span length* as how far ahead to
  // look, rather than its literal start/end (which would often be behind today).
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const fallbackStart = new Date(today);
    fallbackStart.setDate(today.getDate() - 30);
    const { startDate: rangeStart, endDate: rangeEnd } = getDateFilterRange(dateFilter, fallbackStart);
    const spanDays = Math.max(1, Math.round((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + spanDays);

    return recurrences
      .filter(r => {
        if (r.status !== 'active') return false;
        if (!r.next_date) return false;
        
        const nextDate = new Date(r.next_date + 'T12:00:00');
        // Show if next date is valid AND within range (or if it's late, i.e., before today)
        return nextDate <= endDate;
      })
      .sort((a, b) => new Date(a.next_date) - new Date(b.next_date))
      .slice(0, 5);
  }, [recurrences, dateFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return t('dashboard.undefined_date');
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateString + 'T12:00:00');
    target.setHours(0,0,0,0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysUntil = (diffDays) => {
    if (diffDays < 0) return t('dashboard.overdue');
    if (diffDays === 0) return t('dashboard.today');
    if (diffDays === 1) return t('dashboard.tomorrow');
    return t('dashboard.in_days', { count: diffDays });
  };

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-500" />
            {t('dashboard.upcoming_recurrences_title')}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400">
            {getDateFilterLabel(dateFilter, t, i18n)}
        </span>
      </div>

      <div className="overflow-y-auto overflow-x-hidden flex-1 pr-2 -mr-2 space-y-2 custom-scrollbar">
        {upcoming.length > 0 ? (
          upcoming.map((item, index) => {
            const diffDays = getDaysUntil(item.next_date);
            const daysText = formatDaysUntil(diffDays);
            const isLate = diffDays < 0;
            const isToday = diffDays === 0;
            const statusColor = isLate ? '#ef4444' : isToday ? '#f97316' : PRIMARY;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate('/recurrences')}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: statusColor + '22', color: statusColor, borderColor: statusColor + '44' }}
                  >
                    <CalendarClock className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate max-w-[140px] sm:max-w-[180px]">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium opacity-80 truncate max-w-[80px]" style={{ backgroundColor: statusColor }}>
                        {t(`period.${item.frequency}`, item.frequency)}
                      </span>
                      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: statusColor }}>
                        {daysText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-[10px] text-gray-400 whitespace-nowrap">
                    {formatDate(item.next_date)}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-8">
            <CalendarCheck size={40} className="mb-2" />
            <p className="text-sm">{t('dashboard.no_recurrences')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingRecurrencesSection;