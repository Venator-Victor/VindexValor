import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const SelectInput = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = "Selecione...", 
  disabled = false,
  className,
  id,
  showCreateOption = false,
  onCreateNew,
  currencySymbol = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

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
      if (selectedOption.value === "" && selectedOption.label === "Nenhuma") {
          return "Nenhuma";
      }
      return selectedOption.label;
    }
    return placeholder;
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <Label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 dark:text-vindex-text/80">{label}</Label>}
      
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm transition-all outline-none",
          "bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text",
          "focus:ring-2 focus:ring-vindex-success/50",
          "hover:border-gray-300 dark:hover:border-vindex-text/30",
          disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
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
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card py-1 shadow-lg"
          >
            {options.length === 0 && !showCreateOption ? (
              <div className="px-2 py-2 text-sm text-gray-500 dark:text-vindex-text/60 text-center">
                Sem opções
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm outline-none transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-vindex-bg/50 text-gray-900 dark:text-vindex-text",
                    option.value === value && "bg-green-50 dark:bg-vindex-success/10 text-green-900 dark:text-vindex-success font-medium"
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-600 dark:text-vindex-success">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))
            )}
            
            {showCreateOption && (
              <>
                {options.length > 0 && <div className="h-px bg-gray-200 dark:bg-vindex-border my-1" />}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm font-medium text-blue-600 dark:text-blue-400 outline-none transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="block truncate">Criar novo(a)</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectInput;