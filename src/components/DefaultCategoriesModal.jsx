import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DEFAULT_CATEGORIES } from '@/utils/defaultCategories';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const DefaultCategoriesModal = ({ isOpen, onClose, onCreateCustom, onSuccess }) => {
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
        limite_gasto: null,
        periodo_limite: 'mensal'
      });
      
      toast({ title: "Categoria criada com sucesso!" });
      
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
            Escolha uma categoria
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
          {sortedCategories.map((cat) => (
             <button
               key={cat.id}
               onClick={() => handleSelect(cat)}
               disabled={loadingId !== null}
               className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-vindex-border hover:bg-gray-50 dark:hover:bg-vindex-bg transition-all hover:scale-105 relative group disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-vindex-card h-full min-h-[160px]"
             >
                <div 
                   className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm transition-transform group-hover:scale-110 flex-shrink-0"
                   style={{ backgroundColor: cat.color + '22', color: cat.color }}
                >
                   {loadingId === cat.id ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     <i className={cat.icon}></i>
                   )}
                </div>
                <span className="font-semibold text-gray-900 dark:text-vindex-text text-sm sm:text-base text-center line-clamp-2 leading-tight h-[40px] flex items-center justify-center">{cat.name}</span>
                <span className="text-xs text-gray-500 dark:text-vindex-text/60 mt-1 text-center line-clamp-2 px-1">{cat.description}</span>
                
                {/* Hover effect indicator */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/10 rounded-xl transition-colors pointer-events-none" />
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
            Criar Nova Categoria Personalizada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefaultCategoriesModal;