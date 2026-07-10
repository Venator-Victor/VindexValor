import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Plus, Search } from '@/components/BxIcon';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { normalizeText } from '@/utils/text';

const SelectInput = ({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  id,
  showCreateOption = false,
  onCreateNew,
  currencySymbol = null,
  searchable = false
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('common.select_placeholder');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Clear the search box once the dropdown closes (adjust state during render, per React docs).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setSearchTerm('');
  }

  const selectedOption = options.find(opt => opt.value === value);
  const visibleOptions = searchable && searchTerm
    ? options.filter(opt => normalizeText(opt.label).includes(normalizeText(searchTerm)))
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue, name: id } });
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateNew) onCreateNew();
  };

  const getDisplayLabel = () => {
    if (selectedOption) {
      return selectedOption.label;
    }
    return resolvedPlaceholder;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <Label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 dark:text-vindex-text/80">{label}</Label>}

      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all outline-none",
          "bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text",
          "hover:border-primary focus:border-primary",
          disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800",
          className
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", !selectedOption && "text-gray-400 dark:text-vindex-text/50")}>
          {currencySymbol && <span className="text-gray-500 crypto-symbol">{currencySymbol}</span>}
          {getDisplayLabel()}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 opacity-50 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card shadow-lg flex flex-col"
          >
            {searchable && (
              <div className="relative px-2 pt-2 pb-1 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-vindex-text/40" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('common.search_select_placeholder')}
                  className="w-full rounded-md border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-bg pl-8 pr-2 py-1.5 text-sm outline-none focus:border-primary text-gray-900 dark:text-vindex-text"
                />
              </div>
            )}
            <div className="max-h-60 overflow-auto py-1">
            {visibleOptions.length === 0 && !showCreateOption ? (
              <div className="px-2 py-2 text-sm text-gray-500 dark:text-vindex-text/60 text-center">
                {searchable && searchTerm ? t('common.no_search_results') : t('common.no_options')}
              </div>
            ) : (
              visibleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm outline-none transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-vindex-bg/50 text-gray-900 dark:text-vindex-text",
                    option.value === value && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))
            )}
            
            {showCreateOption && (
              <>
                {visibleOptions.length > 0 && <div className="h-px bg-gray-200 dark:bg-vindex-border my-1" />}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm font-medium text-blue-600 dark:text-blue-400 outline-none transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="block truncate">{t('common.create_new')}</span>
                </button>
              </>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectInput;