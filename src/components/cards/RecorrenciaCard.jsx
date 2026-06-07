import React, { useState } from 'react';
import { formatCurrency } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';

const RecorrenciaCard = ({ item, onEdit, onDelete, onToggleStatus }) => {
  const { parcels, payParcel, processRecurring } = useFinance();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isActive = item.status === 'Ativo';
  const isParceled = item.recurrence_type === 'Parcelas';
  
  // Find related parcels for this recurring item
  const safeParcels = Array.isArray(parcels) ? parcels : [];
  const itemParcels = safeParcels.filter(p => p.recurring_item_id === item.id).sort((a,b) => a.parcel_number - b.parcel_number);
  
  // Calculate parcel progress
  const paidParcelsCount = itemParcels.filter(p => p.paid_date).length;
  const totalParcelsCount = item.installment_count || 0;
  const nextPendingParcel = itemParcels.find(p => !p.paid_date);

  const handlePayNextParcel = () => {
    if (nextPendingParcel) {
      payParcel(nextPendingParcel.id);
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      await processRecurring(item.id);
      toast({ title: "Pagamento registrado!", description: `Próxima cobrança atualizada.` });
    } catch (err) {
      toast({ title: "Erro ao registrar pagamento", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Safe access to category name from joined data
  const categoryName = item.categorias?.name || 'Sem categoria';

  return (
    <div className={`bg-white dark:bg-vindex-card rounded-xl p-5 border shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${isActive ? 'border-gray-200 dark:border-vindex-border' : 'border-gray-100 dark:border-vindex-border/30 opacity-80'}`}>
      
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>

      <div>
        <div className="flex justify-between items-start mb-3 pl-2">
            <div>
            <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isParceled ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                    {item.recurrence_type || 'Assinatura'}
                 </span>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{categoryName}</p>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg leading-tight line-clamp-1" title={item.description}>{item.description}</h3>
            </div>
            <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                <i className='bx bx-pencil'></i>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <i className='bx bx-trash'></i>
            </Button>
            </div>
        </div>

        <div className="flex items-center justify-between mb-4 pl-2">
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-red-600 dark:text-vindex-danger">{formatCurrency(item.amount)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <i className='bx bx-time-five'></i> {item.frequency}
                </span>
            </div>
        </div>
      </div>

      {isParceled ? (
         <div className="pl-2 mb-1 mt-auto">
            <div className="flex justify-between text-xs mb-1.5">
               <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Parcela {nextPendingParcel ? nextPendingParcel.parcel_number : totalParcelsCount} de {totalParcelsCount}
               </span>
               <span className="font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((totalParcelsCount > 0 ? (paidParcelsCount / totalParcelsCount) : 0) * 100)}%
               </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-vindex-bg h-2.5 rounded-full overflow-hidden mb-3">
               <div 
                  className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${totalParcelsCount > 0 ? (paidParcelsCount / totalParcelsCount) * 100 : 0}%` }}
               ></div>
            </div>
            
            {nextPendingParcel && (
                <Button 
                   size="sm" 
                   onClick={handlePayNextParcel}
                   className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 h-9"
                >
                   <i className='bx bx-check mr-1.5'></i> Pagar parc. {nextPendingParcel.parcel_number}
                </Button>
            )}
            
            {!nextPendingParcel && paidParcelsCount === totalParcelsCount && totalParcelsCount > 0 && (
                <div className="w-full text-center text-xs font-bold text-green-600 dark:text-green-400 py-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-900/30">
                    <i className='bx bx-check-double mr-1'></i> Quitado
                </div>
            )}
         </div>
      ) : (
          <div className="pl-2 pt-3 border-t border-gray-100 dark:border-vindex-border/50 mt-auto space-y-2">
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Próxima</span>
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {item.next_date ? new Date(item.next_date).toLocaleDateString('pt-BR') : '—'}
                   </span>
                </div>
                <button
                   onClick={() => onToggleStatus(item)}
                   className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                     isActive
                       ? 'bg-green-100 text-green-700 dark:bg-vindex-success/20 dark:text-vindex-success hover:bg-green-200 dark:hover:bg-vindex-success/30'
                       : 'bg-gray-100 text-gray-500 dark:bg-vindex-bg dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-vindex-border'
                   }`}
                >
                   {item.status}
                </button>
             </div>
             {isActive && (
               <Button
                 size="sm"
                 onClick={handleProcessPayment}
                 disabled={isProcessing}
                 className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 h-9"
               >
                 <i className='bx bx-check mr-1.5'></i>
                 {isProcessing ? 'Registrando...' : 'Registrar pagamento'}
               </Button>
             )}
          </div>
      )}
    </div>
  );
};

export default RecorrenciaCard;