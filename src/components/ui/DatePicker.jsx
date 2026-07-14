import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from '@/components/BxIcon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const DatePicker = ({ value, onChange, label, labelClassName, className, required }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Sync internal calendar state when the `value` prop changes (adjust state during render, per React docs).
  const [syncedValue, setSyncedValue] = useState(undefined);
  if (value && value !== syncedValue) {
    setSyncedValue(value);
    const date = new Date(value);
    // Adjust for timezone offset to ensure correct day display
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    setSelectedDate(adjustedDate);
    setCurrentDate(adjustedDate);
  }

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(i18n.language, { month: 'long' })
  );

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format YYYY-MM-DD for standard input compatibility
    const formatted = newDate.toISOString().split('T')[0];
    onChange({ target: { value: formatted } }); // Mock event object
    setIsOpen(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          type="button"
          className={cn(
            "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all hover:scale-110",
            isSelected
              ? "bg-primary text-primary-foreground font-bold shadow-md"
              : isToday
                ? "bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary font-semibold"
                : "hover:bg-gray-100 dark:hover:bg-vindex-bg text-gray-700 dark:text-vindex-text"
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const weekDayHeaders = Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, i + 2).toLocaleDateString(i18n.language, { weekday: 'narrow' })
  );

  return (
    <div className={cn("w-full", className)}>
      {label && <label className={cn("mb-2 block text-sm font-medium text-gray-700 dark:text-vindex-text/80", labelClassName)}>{label}</label>}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <input
              type="text"
              readOnly
              required={required}
              value={selectedDate ? selectedDate.toLocaleDateString(i18n.language) : ''}
              placeholder={t('common.select_date_placeholder')}
              className={cn(
                "h-10 w-full pl-10 pr-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text outline-none cursor-pointer transition-colors",
                "hover:border-primary focus:border-primary",
                isOpen && "border-primary"
              )}
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-vindex-text/50" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="z-50 w-[280px] p-4 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border rounded-xl shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <Button type="button" variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-vindex-bg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-bold text-gray-900 dark:text-vindex-text">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-vindex-bg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDayHeaders.map((d, i) => (
              <div key={`header-${d}-${i}`} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-vindex-text/50">
                {d}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
