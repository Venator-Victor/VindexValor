import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { defaultAccounts } from '@/utils/defaultAccounts';
import { Plus } from 'lucide-react';

const AccountSuggestionsModal = ({ isOpen, onClose, onSelect, onCreateCustom }) => {
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Qual tipo de conta você quer criar?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
          {defaultAccounts.map((account) => (
             <button
               key={account.id}
               onClick={() => onSelect(account)}
               className="flex flex-col items-center justify-start p-4 rounded-xl border border-gray-200 dark:border-vindex-border hover:bg-gray-50 dark:hover:bg-vindex-bg transition-all hover:scale-105 relative group bg-white dark:bg-vindex-card min-h-[160px]"
             >
                <div 
                   className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm transition-transform group-hover:scale-110 shrink-0"
                   style={{ backgroundColor: account.color + '22', color: account.color }}
                >
                   <i className={`bx ${account.icon}`}></i>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base text-center break-words leading-tight flex-grow">{account.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center break-words leading-tight">{account.type}</span>
                
                {/* Hover effect indicator */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/10 rounded-xl transition-colors pointer-events-none" />
             </button>
          ))}
        </div>

        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-vindex-border mt-2">
          <Button 
            onClick={onCreateCustom} 
            variant="outline"
            className="w-full sm:w-auto border-dashed border-2 hover:bg-gray-50 dark:hover:bg-vindex-bg text-gray-700 dark:text-gray-300 border-gray-300 dark:border-vindex-border"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Conta Personalizada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSuggestionsModal;