import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DEFAULT_CATEGORIES } from '@/utils/defaultCategories';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, RefreshCw as Loader2 } from '@/components/BxIcon';
import BxIcon from '@/components/BxIcon';

const DefaultCategoriesModal = ({ isOpen, onClose, onCreateCustom, onSuccess }) => {
  const { t } = useTranslation();
  const { addCategory } = useFinance();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState(null);

  const sortedCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleSelect = async (category) => {
    setLoadingId(category.id);
    try {
      const newCategory = await addCategory({
        name: category.name,
        color: category.color,
        icon: category.icon,
        spending_limit: null,
        budget_period: 'monthly',
        budget_enabled: category.budgetEnabled !== false
      });
      
      toast({ title: t('categories.created_success') });
      
      if (onSuccess) {
        // Pass the newCategory object as second argument for immediate access to ID
        onSuccess(category.name, newCategory);
      }
      onClose();
    } catch (error) {
      console.error(error);
      // FinanceContext usually handles error toasts, but we catch just in case
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-white dark:bg-vindex-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-vindex-text">
            {t('categories.choose_category')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
          {sortedCategories.map((cat) => (
             <button
               key={cat.id}
               onClick={() => handleSelect(cat)}
               disabled={loadingId !== null}
               className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-vindex-border hover:border-primary hover:bg-gray-50 dark:hover:bg-vindex-bg transition-colors relative group disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-vindex-card h-full min-h-[160px]"
             >
                <div
                   className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 flex-shrink-0"
                   style={{ backgroundColor: cat.color + '22', color: cat.color }}
                >
                   {loadingId === cat.id ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     <BxIcon iconClass={cat.icon} size={24} />
                   )}
                </div>
                <span className="font-semibold text-gray-900 dark:text-vindex-text text-sm sm:text-base text-center line-clamp-2 leading-tight h-[40px] flex items-center justify-center">{cat.name}</span>
                <span className="text-xs text-gray-500 dark:text-vindex-text/60 mt-1 text-center line-clamp-2 px-1">{cat.description}</span>
             </button>
          ))}
        </div>

        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-vindex-border mt-2">
          <Button 
            onClick={onCreateCustom} 
            variant="outline"
            className="w-full sm:w-auto border-dashed border-2 hover:bg-gray-50 dark:hover:bg-vindex-bg dark:text-vindex-text dark:border-vindex-border"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.create_custom')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefaultCategoriesModal;