import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, AlertCircle, Wallet, Link as Link2, TrashAlt as Trash2, ArrowDownRight, ArrowUpRight, Sigma } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatCurrencyWithSymbol } from '@/utils/calculations';
import InvoiceItemList from '@/components/InvoiceItemList';
import InvoiceItemForm from '@/components/InvoiceItemForm';
import InvoiceItemSelectionBar from '@/components/InvoiceItemSelectionBar';
import InvoiceItemDetailModal from '@/components/InvoiceItemDetailModal';
import InvoicePaymentLinkModal from '@/components/InvoicePaymentLinkModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DANGER } from '@/utils/colors';

const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const InvoiceDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchInvoiceItems, deleteInvoiceItem } = useFinance();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uuidError, setUuidError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setUuidError('');
    try {
      const { data: faturaData, error } = await supabase
        .from('invoices')
        .select('*, account:accounts(name, currency)')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching fatura:", error);
      }
      
      if (faturaData) {
        setInvoice(faturaData);
        
        const comprasData = await fetchInvoiceItems(id);
        setItems(comprasData);

        const { data: pagamentosData } = await supabase
          .from('transactions')
          .select('*, account:accounts!fk_transacoes_conta(name, currency)')
          .eq('invoice_id', id);
        
        setPayments(pagamentosData || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clears item selection/dialogs when the route param (`id`) changes to a different invoice.
    setSelectedItemIds([]);
    setDeleteItemId(null);
    setSelectedDetailItem(null);
    if (!id || !isValidUUID(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- validates the route param and mirrors the result into state used for the error view; no external system involved but needs to react to `id` changes.
      setUuidError(t('invoice_detail.invalid_id'));
      setIsLoading(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches invoice/items/payments from Supabase; setIsLoading(true) inside loadData runs before the first await.
    loadData();
  }, [id]);

  // "Total Outflows" is true net spending: purchases (negative) plus refunds (positive,
  // not the payment item), so the payment settlement line never counts as "less spent".
  const totalSaidas = items
    .filter(c => Number(c.amount) < 0 || !c.is_payment)
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  // The actual invoice balance nets every item, both signs — the payment/refund lines
  // included in the imported statement offset the purchases, matching InvoiceItemList's
  // own footer total and what's actually owed.
  const calculatedTotal = items.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const handleUnlinkPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ invoice_id: null })
        .eq('id', paymentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Only reopen the invoice if the remaining linked payments no longer cover the total —
      // unlinking one of several payments shouldn't reset the status if the others still add up.
      const remainingTotalPaid = payments
        .filter(p => p.id !== paymentId)
        .reduce((acc, p) => acc + Math.abs(p.amount), 0);

      if (remainingTotalPaid < Math.abs(calculatedTotal)) {
        await supabase.from('invoices').update({ status: 'open' }).eq('id', id).eq('user_id', user.id);
      }

      toast({ title: t('invoice_detail.payment_unlinked_success') });
      loadData();
    } catch (err) {
      toast({ title: t('invoice_detail.unlink_error'), description: err.message, variant: "destructive" });
    }
  };

  const handleEditCompra = (compra) => {
    setEditingCompra(compra);
    setIsFormOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    await deleteInvoiceItem(deleteItemId, id);
    setDeleteItemId(null);
    setSelectedDetailItem(null);
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{t('invoice_detail.loading')}</div>;

  if (uuidError) return (
    <div className="p-8 max-w-md mx-auto mt-10">
      <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex flex-col items-center justify-center gap-3 border border-destructive/20">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium text-center">{uuidError}</p>
        <Button variant="outline" className="mt-2" onClick={() => navigate('/invoices')}>
          {t('invoice_detail.back_to_invoices')}
        </Button>
      </div>
    </div>
  );

  if (!invoice) return (
    <div className="p-8 text-center text-destructive">
      <p className="mb-4">{t('invoice_detail.not_found')}</p>
      <Button variant="outline" onClick={() => navigate('/invoices')}>{t('invoice_detail.back_to_invoices')}</Button>
    </div>
  );

  const totalPaid = payments.reduce((acc, p) => acc + Math.abs(p.amount), 0);
  const remaining = Math.abs(calculatedTotal) - totalPaid;
  
  const calcTotalColor = calculatedTotal < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - {t('invoice_detail.title')}</title>
      </Helmet>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{invoice.invoice_number || t('invoice_detail.title')}</h1>
          <p className="text-muted-foreground">{invoice.account?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-sm font-medium">{t('invoice_detail.total_outflows')}</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 text-foreground mb-1">
            <Sigma className="w-4 h-4" />
            <span className="text-sm font-medium">{t('invoice_detail.net_total')}</span>
          </div>
          <p className={`text-2xl font-bold ${calcTotalColor}`}>{formatCurrency(calculatedTotal)}</p>
        </motion.div>
      </div>

      <div className="bg-muted/30 p-5 rounded-xl border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> {t('invoice_detail.related_payments')}
          </h2>
          <Button variant="outline" size="sm" onClick={handleOpenPaymentModal}>
            <Link2 className="w-4 h-4 mr-2" /> {t('invoice_detail.select_payment')}
          </Button>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg border">
                <span className="text-sm text-muted-foreground">{t('invoice_detail.total_paid')}</span>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-background p-4 rounded-lg border">
                <span className="text-sm text-muted-foreground">{t('invoice_detail.remaining_balance')}</span>
                <p className="text-lg font-bold text-primary mt-1">{formatCurrency(remaining > 0 ? remaining : 0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar border border-gray-200 dark:border-vindex-border rounded-lg bg-white dark:bg-vindex-card">
              <table className="w-full min-w-[680px] text-sm table-fixed">
                <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                  <tr>
                    <th className="px-6 py-3 w-[14%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_date')}</th>
                    <th className="px-6 py-3 w-[34%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_description')}</th>
                    <th className="px-6 py-3 w-[22%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_account_used')}</th>
                    <th className="px-6 py-3 w-[18%] text-right font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_amount_paid')}</th>
                    <th className="px-6 py-3 w-[12%] text-right font-medium text-gray-700 dark:text-gray-300">{t('invoice_detail.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                  {payments.map(p => {
                    const payColor = p.amount < 0 ? 'text-red-600 dark:text-red-400' : p.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(p.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50 truncate" title={p.description}>{p.description}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate">{p.account?.name || 'N/A'}</td>
                        <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${payColor}`}>
                          {formatCurrencyWithSymbol(p.amount, p.account?.currency || 'BRL')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlinkPayment(p.id)}
                            className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent"
                            style={{ borderColor: DANGER, color: DANGER }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                          >
                            <Trash2 className="h-4 w-4" />
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
            {t('invoice_detail.no_payment_linked')}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-bold">{t('invoice_detail.transactions_title', { count: items.length })}</h2>
        <Button onClick={() => { setEditingCompra(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> {t('invoice_detail.add_transaction')}
        </Button>
      </div>

      <InvoiceItemList
        items={items}
        onEdit={handleEditCompra}
        onDelete={(itemId) => setDeleteItemId(itemId)}
        onRowClick={setSelectedDetailItem}
        selectedIds={selectedItemIds}
        onSelectionChange={setSelectedItemIds}
      />

      <InvoiceItemDetailModal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        onEdit={handleEditCompra}
        onDelete={(itemId) => setDeleteItemId(itemId)}
      />

      <DeleteConfirmationDialog
        open={!!deleteItemId}
        onOpenChange={() => setDeleteItemId(null)}
        description={t('invoice_detail.delete_item_confirm')}
        onConfirm={confirmDeleteItem}
      />

      <InvoiceItemSelectionBar
        selectedIds={selectedItemIds}
        items={items}
        onClearSelection={() => setSelectedItemIds([])}
        onRefresh={loadData}
      />

      {/* Modal: Add/Edit Compra */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCompra ? t('invoice_detail.edit_transaction') : t('invoice_detail.add_transaction')}</DialogTitle>
          </DialogHeader>
          <InvoiceItemForm 
            invoiceId={id}
            initialData={editingCompra}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <InvoicePaymentLinkModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        invoiceId={id}
        invoiceTotal={calculatedTotal}
        invoiceCurrency={invoice.account?.currency}
        onLinked={loadData}
      />

    </div>
  );
};

export default InvoiceDetailPage;