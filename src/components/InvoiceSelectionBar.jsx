import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, X, Eye, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import SelectInput from '@/components/ui/SelectInput';
import { formatCurrency } from '@/utils/calculations';

const InvoiceSelectionBar = ({ selectedIds, faturas, faturaTotals = {}, onClearSelection, onRefresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  
  const { accounts } = useFinance();
  const { user } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!selectedIds || selectedIds.length === 0) return null;

  const totalBRL = selectedIds.reduce((sum, id) => sum + (faturaTotals[id] || 0), 0);
  const totalBTC = 0; // Calculado futuramente, atualmente mockado como 0

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('faturas')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedIds.length} faturas excluídas com sucesso.`,
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

  const handleSelectPayment = () => {
    setIsPaymentModalOpen(true);
  };
  
  const handleConfirmPayment = async () => {
    if (!selectedAccountId) {
      toast({ title: "Selecione uma conta", variant: "destructive", description: "Por favor, escolha uma conta de pagamento." });
      return;
    }
    
    setIsLinking(true);
    try {
      const transactionsToInsert = selectedIds.map(id => {
        const fatura = faturas.find(f => f.id === id);
        const total = faturaTotals[id] || 0;
        return {
          user_id: user.id,
          description: `Pagamento Fatura ${fatura?.numero_fatura || ''}`,
          amount: -Math.abs(total), 
          type: 'pagamento',
          date: new Date().toISOString().split('T')[0],
          conta_id: selectedAccountId,
          fatura_id: id
        };
      });

      if (transactionsToInsert.length > 0) {
        const { error: txError } = await supabase.from('transacoes').insert(transactionsToInsert);
        if (txError) throw txError;
      }

      const { error: statusError } = await supabase.from('faturas').update({ status: 'paga' }).in('id', selectedIds).eq('user_id', user.id);
      if (statusError) throw statusError;

      toast({ title: "Sucesso", description: "Pagamento vinculado com sucesso às faturas!" });
      setIsPaymentModalOpen(false);
      setSelectedAccountId('');
      onClearSelection();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleViewPurchases = () => {
    if (selectedIds.length === 1) {
      navigate(`/faturas/${selectedIds[0]}`);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background dark:bg-card border border-border shadow-xl rounded-2xl p-4 w-[92%] sm:w-auto max-w-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-4">
        
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <p className="text-sm text-muted-foreground">{selectedIds.length} fatura(s) selecionada(s)</p>
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
                  <p className="font-bold text-lg text-foreground">₿ {totalBTC.toFixed(8)}</p>
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
            onClick={handleSelectPayment}
            disabled={selectedIds.length === 0}
          >
            <CreditCard className="h-4 w-4" />
            <span className="truncate">Selecionar Pagamento</span>
          </Button>

          {selectedIds.length === 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto rounded-lg sm:rounded-full gap-2 border-border"
              onClick={handleViewPurchases}
            >
              <Eye className="h-4 w-4" />
              <span className="truncate">Ver Compras</span>
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
            <AlertDialogTitle>Excluir {selectedIds.length} faturas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá as faturas selecionadas. As compras vinculadas poderão ficar sem fatura.
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

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vincular Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione a conta utilizada para pagar {selectedIds.length === 1 ? 'esta fatura' : 'estas faturas'}. 
              Isso atualizará o status e registrará a transação de pagamento.
            </p>
            <SelectInput 
              label="Conta de Pagamento"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              options={accounts.map(a => ({ label: a.name, value: a.id }))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPayment} disabled={isLinking}>
              {isLinking ? "Vinculando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceSelectionBar;