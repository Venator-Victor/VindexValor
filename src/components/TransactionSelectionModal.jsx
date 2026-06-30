import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TrashAlt as Trash2, X, FolderOpen as FolderEdit } from '@/components/BxIcon';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency, isCryptoCurrency } from '@/utils/calculations';

const TransactionSelectionModal = ({ selectedIds, transactions, onClearSelection, onRefresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { accounts, categories } = useFinance();
  const { toast } = useToast();

  const selectedTx = useMemo(() => transactions.filter(t => selectedIds.includes(t.id)), [transactions, selectedIds]);

  if (!selectedIds || selectedIds.length === 0) return null;

  let totalBRL = 0;
  let totalBTC = 0;

  selectedTx.forEach(t => {
    const acc = accounts.find(a => a.id === t.account_id || a.id === t.destination_account_id);
    const amount = t.type === 'expense' ? -Math.abs(t.amount) : t.type === 'income' ? Math.abs(t.amount) : 0;
    
    if (acc && isCryptoCurrency(acc.currency)) {
      totalBTC += amount;
    } else {
      totalBRL += amount;
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedIds.length} transações excluídas.`,
      });
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: selectedBulkCategory || null })
        .in('id', selectedIds)
        .neq('type', 'payment')
        .neq('type', 'transfer');

      if (error) throw error;

      toast({
        title: "Categorias Atualizadas",
        description: `Transações atualizadas com sucesso. Pagamentos e transferências não tiveram categorias alteradas.`,
      });
      onClearSelection();
      if (onRefresh) onRefresh();
      setShowCategoryModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">
        
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <p className="text-sm text-muted-foreground">{selectedIds.length} transação(ões) selecionada(s)</p>
            <div className="flex gap-4 mt-1">
              {totalBRL !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Total (BRL)</span>
                  <p className={`font-bold text-lg ${totalBRL < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(totalBRL)}</p>
                </div>
              )}
              {totalBTC !== 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Total (BTC)</span>
                  <p className={`font-bold text-lg ${totalBTC < 0 ? 'text-red-500' : 'text-green-500'}`}>₿ {totalBTC.toFixed(8)}</p>
                </div>
              )}
              {totalBRL === 0 && totalBTC === 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Total</span>
                  <p className="font-bold text-lg text-foreground">{formatCurrency(0)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
            onClick={() => {
              setSelectedBulkCategory('');
              setShowCategoryModal(true);
            }}
          >
            <FolderEdit className="h-4 w-4" />
            <span className="truncate">Alterar Categoria</span>
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="truncate">Excluir</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            <span className="truncate">Cancelar</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.length} transações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá as transações selecionadas do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Categoria ({selectedIds.length} selecionadas)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Nova Categoria
            </label>
            <SelectInput
              value={selectedBulkCategory}
              onChange={(e) => setSelectedBulkCategory(e.target.value)}
              options={[
                { label: 'Sem Categoria', value: '' },
                ...categories.map(c => ({ label: c.name, value: c.id }))
              ]}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleBulkCategoryUpdate} disabled={isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionSelectionModal;