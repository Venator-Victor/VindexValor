import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from '@/components/BxIcon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DatePicker = ({ value, onChange, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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

  const weekDayHeaders = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-vindex-text/80">{label}</label>}
      
      <div className="relative">
        <input
          type="text"
          readOnly
          value={selectedDate ? selectedDate.toLocaleDateString('pt-BR') : ''}
          placeholder="Selecione uma data"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full pl-10 pr-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text outline-none cursor-pointer transition-colors",
            "focus:ring-2 focus:ring-vindex-success/50",
            isOpen && "border-green-500 dark:border-vindex-success"
          )}
        />
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-vindex-text/50" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 mt-2 p-4 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border rounded-xl shadow-xl w-[280px]"
          >
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-vindex-bg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-bold text-gray-900 dark:text-vindex-text">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-vindex-bg">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;