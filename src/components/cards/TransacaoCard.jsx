import React from 'react';
import { formatCurrency } from '@/utils/calculations';
import { Button } from '@/components/ui/button';

const TransacaoCard = ({ transaction, onEdit, onDelete }) => {
  const isTransfer = transaction.type === 'transferencia';
  const isIncome = transaction.type === 'entrada';
  const isExpense = transaction.type === 'saida';

  // Safe access to joined data
  const categoryName = transaction.categorias?.name || 'Nenhuma';
  const categoryColor = transaction.categorias?.color || '#9ca3af';
  const categoryIcon = transaction.categorias?.icon || 'bx bx-question-mark';
  
  const accountName = transaction.contas?.name || 'Conta';
  const destAccountName = transaction.conta_destino?.name || 'Destino';
  
  const transactionTypeName = transaction.transaction_types?.name;
  const isCommon = !transaction.transaction_type_id;

  return (
    <div className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {!isTransfer && (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: categoryColor + '22', color: categoryColor }}
            >
              <i className={categoryIcon}></i>
            </div>
          )}
          {isTransfer && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gray-200 dark:bg-vindex-text/10 text-gray-600 dark:text-gray-300">
              <i className='bx bx-transfer'></i>
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-50 line-clamp-1 flex items-center gap-2">
              {transaction.name || transaction.description}
              {!isCommon && transactionTypeName && (
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                   transactionTypeName === 'Salário' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                   transactionTypeName === 'Parcelamento' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                 }`}>
                   {transactionTypeName}
                 </span>
              )}
              {isCommon && (
                 <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Comum
                 </span>
              )}
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {new Date(transaction.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(transaction)} className="h-8 w-8 p-0">
            <i className='bx bx-pencil'></i>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(transaction.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
            <i className='bx bx-trash'></i>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-1">
         <span className={`text-xl font-bold ${
            isIncome ? 'text-green-600 dark:text-vindex-success' : 
            isExpense ? 'text-red-600 dark:text-vindex-danger' : 
            'text-blue-600 dark:text-blue-400'
         }`}>
            {formatCurrency(transaction.amount)}
         </span>
         
         <div className="flex justify-between items-center text-xs text-gray-700 dark:text-gray-300">
            <span className="bg-gray-100 dark:bg-vindex-bg px-2 py-1 rounded">
               {isTransfer ? 'Transferência' : categoryName}
            </span>
            <span>
              {accountName}
              {isTransfer && ` → ${destAccountName}`}
            </span>
         </div>
         {transaction.responsible_holder && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
               <i className='bx bx-user'></i>
               <span>Resp: {transaction.responsible_holder}</span>
            </div>
         )}
      </div>
    </div>
  );
};

export default TransacaoCard;