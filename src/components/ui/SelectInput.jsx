import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Check, Plus, Search } from '@/components/BxIcon';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { normalizeText } from '@/utils/text';

const SelectInput = ({
  label,
  labelClassName,
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
  searchable = false,
  multiple = false
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('common.select_placeholder');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Clear the search box once the dropdown closes (adjust state during render, per React docs).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setSearchTerm('');
  }

  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : null;
  const selectedOption = multiple ? null : options.find(opt => opt.value === value);
  const isOptionSelected = (optionValue) => multiple ? selectedValues.includes(optionValue) : optionValue === value;
  const visibleOptions = searchable && searchTerm
    ? options.filter(opt => normalizeText(opt.label).includes(normalizeText(searchTerm)))
    : options;

  const handleSelect = (optionValue) => {
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange({ target: { value: next, name: id } });
      return;
    }
    onChange({ target: { value: optionValue, name: id } });
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateNew) onCreateNew();
  };

  const getDisplayLabel = () => {
    if (multiple) {
      if (selectedValues.length === 0) return resolvedPlaceholder;
      if (selectedValues.length === 1) {
        const opt = options.find(o => o.value === selectedValues[0]);
        return opt ? opt.label : resolvedPlaceholder;
      }
      return selectedValues.length > 1
        ? t('common.selected_count_plural', { count: selectedValues.length })
        : t('common.selected_count', { count: selectedValues.length });
    }
    if (selectedOption) {
      return selectedOption.label;
    }
    return resolvedPlaceholder;
  };

  return (
    <div className="relative w-full">
      {label && <Label htmlFor={id} className={cn("mb-2 block text-sm font-medium text-gray-700 dark:text-vindex-text/80", labelClassName)}>{label}</Label>}

      <PopoverPrimitive.Root open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all outline-none",
              "bg-white dark:bg-vindex-bg border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text",
              "hover:border-primary focus:border-primary",
              disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800",
              className
            )}
          >
            <span className={cn("flex items-center gap-2 truncate", (multiple ? selectedValues.length === 0 : !selectedOption) && "text-gray-400 dark:text-vindex-text/50")}>
              {currencySymbol && <span className="text-gray-500 crypto-symbol">{currencySymbol}</span>}
              {getDisplayLabel()}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-50 transition-transform duration-200 shrink-0",
                isOpen && "transform rotate-180"
              )}
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            avoidCollisions
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            className="z-50 max-h-72 overflow-hidden rounded-lg border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card shadow-lg flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            {searchable && (
              <div className="relative px-2 pt-2 pb-1 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-vindex-text/40" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('common.search_select_placeholder')}
                  className="w-full rounded-md border border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-bg pl-8 pr-2 py-1.5 text-sm outline-none focus:border-primary text-gray-900 dark:text-vindex-text"
                />
              </div>
            )}
            {/* Manual scroll: a Radix Dialog ancestor's scroll-lock blocks native wheel scroll here since this popover portals outside the Dialog's DOM subtree. */}
            <div
              className="max-h-60 overflow-auto py-1"
              onWheel={(e) => { e.currentTarget.scrollTop += e.deltaY; }}
            >
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
                      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-2 text-sm outline-none transition-colors",
                      multiple ? "pl-3 pr-3" : "pl-3 pr-9",
                      "hover:bg-gray-100 dark:hover:bg-vindex-bg/50 text-gray-900 dark:text-vindex-text",
                      !multiple && isOptionSelected(option.value) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {multiple && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid place-content-center h-4 w-4 shrink-0 rounded-sm border border-primary",
                          isOptionSelected(option.value) && "bg-primary text-primary-foreground"
                        )}
                      >
                        {isOptionSelected(option.value) && <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    <span className="block truncate">{option.label}</span>
                    {!multiple && isOptionSelected(option.value) && (
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
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};

export default SelectInput;
