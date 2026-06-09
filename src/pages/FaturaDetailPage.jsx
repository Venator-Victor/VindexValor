import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Plus, AlertCircle, Wallet, Link as Link2, TrashAlt as Trash2, ArrowDownRight, ArrowUpRight, Sigma } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency, formatCurrencyWithSymbol } from '@/utils/calculations';
import CompraFaturaList from '@/components/CompraFaturaList';
import CompraFaturaForm from '@/components/CompraFaturaForm';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const FaturaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchComprasFatura, deleteCompraFatura } = useFinance();
  const { toast } = useToast();
  
  const [fatura, setFatura] = useState(null);
  const [compras, setCompras] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uuidError, setUuidError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [eligiblePayments, setEligiblePayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const [paymentToConfirm, setPaymentToConfirm] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      setUuidError("ID de fatura inválido ou não selecionada.");
      setIsLoading(false);
      return;
    }
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    setUuidError('');
    try {
      const { data: faturaData, error } = await supabase
        .from('invoices')
        .select('*, accounts(name)')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching fatura:", error);
      }
      
      if (faturaData) {
        setFatura(faturaData);
        
        const comprasData = await fetchComprasFatura(id);
        setCompras(comprasData);

        const { data: pagamentosData } = await supabase
          .from('transactions')
          .select('*, contas:accounts!fk_transacoes_conta(name, currency)')
          .eq('invoice_id', id);
        
        setPagamentos(pagamentosData || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Only consider negative values (purchases/expenses) for fatura total
  const totalSaidas = compras.filter(c => Number(c.amount) < 0).reduce((acc, c) => acc + Number(c.amount), 0);
  const calculatedTotal = totalSaidas;

  const fetchEligiblePayments = async () => {
    if (!user) return;
    setIsLoadingPayments(true);
    try {
      // Fetch ALL payments from ANY account of the user that aren't linked to a fatura
      const { data, error } = await supabase
        .from('transactions')
        .select('*, contas:accounts!fk_transacoes_conta(name, currency)')
        .eq('user_id', user.id)
        .in('type', ['pagamento', 'transferencia', 'Pagamento', 'Transferência'])
        .is('invoice_id', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setEligiblePayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      toast({ title: "Erro ao buscar pagamentos", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
    fetchEligiblePayments();
  };

  const handleSelectPayment = (payment) => {
    const paymentAmount = Math.abs(payment.amount);
    if (paymentAmount !== Math.abs(calculatedTotal)) {
      setPaymentToConfirm(payment);
      setIsConfirmDialogOpen(true);
    } else {
      linkPayment(payment.id);
    }
  };

  const linkPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ invoice_id: id })
        .eq('id', paymentId);

      if (error) throw error;

      // Auto-update fatura status to 'paga' if this payment covers the remainder
      const paymentRecord = eligiblePayments.find(p => p.id === paymentId) || paymentToConfirm;
      const amountPaid = paymentRecord ? Math.abs(paymentRecord.amount) : 0;
      
      const currentTotalPaid = pagamentos.reduce((acc, p) => acc + Math.abs(p.amount), 0);
      const newTotalPaid = currentTotalPaid + amountPaid;
      
      if (newTotalPaid >= Math.abs(calculatedTotal)) {
        await supabase.from('invoices').update({ status: 'paga' }).eq('id', id).eq('user_id', user.id);
      }

      toast({ title: "Pagamento vinculado com sucesso!" });
      setIsPaymentModalOpen(false);
      setPaymentToConfirm(null);
      setIsConfirmDialogOpen(false);
      loadData();
    } catch (err) {
      toast({ title: "Erro ao vincular pagamento", description: err.message, variant: "destructive" });
    }
  };

  const handleUnlinkPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ invoice_id: null })
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update status back to 'aberta' if it was marked as paid but now it's unlinked
      await supabase.from('invoices').update({ status: 'aberta' }).eq('id', id).eq('user_id', user.id);

      toast({ title: "Pagamento desvinculado com sucesso!" });
      loadData();
    } catch (err) {
      toast({ title: "Erro ao desvincular pagamento", description: err.message, variant: "destructive" });
    }
  };

  const handleEditCompra = (compra) => {
    setEditingCompra(compra);
    setIsFormOpen(true);
  };

  const handleDeleteCompra = async (compraId) => {
    await deleteCompraFatura(compraId, id);
    loadData();
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCompra(null);
    loadData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando detalhes...</div>;
  
  if (uuidError) return (
    <div className="p-8 max-w-md mx-auto mt-10">
      <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex flex-col items-center justify-center gap-3 border border-destructive/20">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium text-center">{uuidError}</p>
        <Button variant="outline" className="mt-2" onClick={() => navigate('/faturas')}>
          Voltar para Faturas
        </Button>
      </div>
    </div>
  );
  
  if (!fatura) return (
    <div className="p-8 text-center text-destructive">
      <p className="mb-4">Fatura não encontrada.</p>
      <Button variant="outline" onClick={() => navigate('/faturas')}>Voltar para Faturas</Button>
    </div>
  );

  const totalPaid = pagamentos.reduce((acc, p) => acc + Math.abs(p.amount), 0);
  const remaining = Math.abs(calculatedTotal) - totalPaid;
  
  const calcTotalColor = calculatedTotal < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Detalhes da Fatura</title>
      </Helmet>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/faturas')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{fatura.invoice_number || 'Detalhes da Fatura'}</h1>
          <p className="text-muted-foreground">{fatura.contas?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-sm font-medium">Total de Saídas (Despesas)</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
        </div>
        
        <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-foreground mb-1">
            <Sigma className="w-4 h-4" />
            <span className="text-sm font-medium">Total Líquido da Fatura</span>
          </div>
          <p className={`text-2xl font-bold ${calcTotalColor}`}>{formatCurrency(calculatedTotal)}</p>
        </div>
      </div>

      <div className="bg-muted/30 p-5 rounded-xl border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Pagamentos Relacionados
          </h2>
          <Button variant="outline" size="sm" onClick={handleOpenPaymentModal}>
            <Link2 className="w-4 h-4 mr-2" /> Selecionar Pagamento
          </Button>
        </div>
        
        {pagamentos.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg border">
                <span className="text-sm text-muted-foreground">Total Pago</span>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-background p-4 rounded-lg border">
                <span className="text-sm text-muted-foreground">Saldo Restante</span>
                <p className="text-lg font-bold text-primary mt-1">{formatCurrency(remaining > 0 ? remaining : 0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar border rounded-lg bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium">Data</th>
                    <th className="p-3 text-left font-medium">Descrição</th>
                    <th className="p-3 text-left font-medium">Conta Utilizada</th>
                    <th className="p-3 text-right font-medium">Valor Pago</th>
                    <th className="p-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagamentos.map(p => {
                    const payColor = p.amount < 0 ? 'text-red-600 dark:text-red-400' : p.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground">{formatDate(p.date)}</td>
                        <td className="p-3 font-medium">{p.description}</td>
                        <td className="p-3 text-muted-foreground">{p.contas?.name || 'N/A'}</td>
                        <td className={`p-3 text-right font-bold whitespace-nowrap ${payColor}`}>
                          {formatCurrencyWithSymbol(p.amount, p.contas?.currency || 'BRL')}
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleUnlinkPayment(p.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg bg-background">
            Nenhum pagamento vinculado a esta fatura.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-bold">Movimentações ({compras.length})</h2>
        <Button onClick={() => { setEditingCompra(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Movimentação
        </Button>
      </div>

      <CompraFaturaList 
        compras={compras}
        onEdit={handleEditCompra}
        onDelete={handleDeleteCompra}
      />

      {/* Modal: Add/Edit Compra */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCompra ? 'Editar Movimentação' : 'Adicionar Movimentação'}</DialogTitle>
          </DialogHeader>
          <CompraFaturaForm 
            faturaId={id}
            initialData={editingCompra}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Link Payments */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Pagamento Existente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {isLoadingPayments ? (
              <div className="text-center py-8 text-muted-foreground">Buscando pagamentos...</div>
            ) : eligiblePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Nenhuma transação de pagamento disponível no momento.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium">Data</th>
                      <th className="p-3 text-left font-medium">Descrição</th>
                      <th className="p-3 text-left font-medium">Conta</th>
                      <th className="p-3 text-right font-medium">Valor</th>
                      <th className="p-3 text-center font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {eligiblePayments.map(p => {
                      const modalPayColor = p.amount < 0 ? 'text-red-600 dark:text-red-400' : p.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
                      return (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground">{formatDate(p.date)}</td>
                          <td className="p-3 font-medium">{p.description}</td>
                          <td className="p-3 text-muted-foreground">{p.contas?.name || 'N/A'}</td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${modalPayColor}`}>
                            {formatCurrencyWithSymbol(p.amount, p.contas?.currency || 'BRL')}
                          </td>
                          <td className="p-3 text-center">
                            <Button size="sm" variant="outline" onClick={() => handleSelectPayment(p)}>
                              Vincular
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Confirm mismatched amounts */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valores Divergentes</AlertDialogTitle>
            <AlertDialogDescription>
              Aviso: O amount da transação ({paymentToConfirm && formatCurrency(Math.abs(paymentToConfirm.amount))}) é diferente do total da fatura ({formatCurrency(Math.abs(calculatedTotal))}). Deseja continuar e vincular este pagamento mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => linkPayment(paymentToConfirm?.id)}>Sim, vincular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default FaturaDetailPage;