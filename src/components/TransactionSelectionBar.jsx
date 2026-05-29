import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, X, FolderEdit, FileText } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useFinance } from '@/context/FinanceContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency } from '@/utils/calculations';

const TransactionSelectionBar = ({ selectedIds, transactions, onClearSelection, onRefresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');
  const [selectedBulkFatura, setSelectedBulkFatura] = useState('');
  
  const { toast } = useToast();
  const { categories, faturas } = useFinance();

  if (!selectedIds || selectedIds.length === 0) return null;

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
        .update({ categoria_id: selectedBulkCategory || null })
        .in('id', selectedIds)
        .neq('type', 'pagamento')
        .neq('type', 'transferencia');

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

  const handleBulkFaturaUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ fatura_id: selectedBulkFatura || null })
        .in('id', selectedIds)
        .eq('type', 'pagamento');

      if (error) throw error;

      toast({
        title: "Faturas Atualizadas",
        description: `As faturas foram atualizadas apenas para transações do tipo "Pagamento".`,
      });
      onClearSelection();
      if (onRefresh) onRefresh();
      setShowFaturaModal(false);
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

  const selectedTx = transactions.filter(t => selectedIds.includes(t.id));
  const hasEligibleFatura = selectedTx.some(t => ['pagamento', 'transferência', 'transferencia'].includes(t.type?.toLowerCase()));
  const hasFaturasCreated = faturas && faturas.length > 0;
  const showFaturaButton = hasEligibleFatura && hasFaturasCreated;

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl sm:rounded-full p-3 sm:px-5 sm:py-3 w-[92%] sm:w-auto max-w-sm sm:max-w-none animate-in slide-in-from-bottom-10 flex flex-col gap-3">
        
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
            <span className="truncate">Categoria</span>
          </Button>

          {showFaturaButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
              onClick={() => {
                setSelectedBulkFatura('');
                setShowFaturaModal(true);
              }}
            >
              <FileText className="h-4 w-4" />
              <span className="truncate">Fatura</span>
            </Button>
          )}

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
              Esta ação não pode ser desfeita. Isso removerá permanentemente as transações selecionadas do seu histórico e atualizará o saldo de suas contas.
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

      <Dialog open={showFaturaModal} onOpenChange={setShowFaturaModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vincular Fatura ({selectedIds.length} selecionadas)</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Essa alteração afetará apenas transações do tipo "Pagamento".
            </p>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Fatura
              </label>
              <SelectInput
                value={selectedBulkFatura}
                onChange={(e) => setSelectedBulkFatura(e.target.value)}
                options={[
                  { label: 'Remover Vínculo de Fatura', value: '' },
                  ...faturas.map(f => ({ label: `${f.numero_fatura || 'Sem nome'} - ${formatCurrency(f.valor_total)}`, value: f.id }))
                ]}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFaturaModal(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleBulkFaturaUpdate} disabled={isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionSelectionBar;