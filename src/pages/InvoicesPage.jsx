import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Share as UploadCloud, Receipt, ArrowRight, Edit as Edit2, TrashAlt as Trash2, ChevronDown, ChevronRight, Wallet, Repeat, ArrowDownRight, ArrowUpRight } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import CSVImportFlowFaturas from '@/components/CSVImportFlowFaturas';
import InvoiceFilterBar from '@/components/InvoiceFilterBar';
import InvoiceBalanceChart from '@/components/InvoiceBalanceChart';
import { parseValueFilterString } from '@/components/FilterRangeInput';
import { supabase } from '@/lib/customSupabaseClient';
import InvoiceSelectionBar from '@/components/InvoiceSelectionBar';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';
import { PRIMARY, SUCCESS, DANGER } from '@/utils/colors';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import { getDateFilterDefaults, matchesDateFilter } from '@/utils/dateFilter';
import { getEffectiveInvoiceStatus } from '@/utils/invoiceBalance';
import SortIcon from '@/components/SortIcon';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { invoices, fetchInvoices, createInvoice, accounts, settings, saveSettings, fetchInvoiceItems } = useFinance();
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [expandedItemsByInvoiceId, setExpandedItemsByInvoiceId] = useState({});
  const [loadingExpandedId, setLoadingExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState(null);

  const [filteredItems, setComprasFiltro] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoices, setSelectedFaturas] = useState([]);
  const [invoiceTotals, setInvoiceTotals] = useState({});

  const dateFilter = settings.invoices_date_filter || getDateFilterDefaults();
  const setDateFilter = (filter) => saveSettings({ invoices_date_filter: filter });
  
  const [sortConfig, setSortConfig] = useState({ key: 'opening_date', direction: 'descending' });
  const [itemSortConfig, setItemSortConfig] = useState({ key: 'date', direction: 'descending' });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    invoice_number: '',
    opening_date: '',
    closing_date: '',
    account_id: '',
    status: 'open'
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    invoice_number: '',
    opening_date: '',
    closing_date: '',
    account_id: '',
    status: 'open'
  });

  const loadInvoices = async () => {
    setIsLoading(true);
    await fetchInvoices();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches invoices from Supabase (external system); setIsLoading(true) runs before the await, the standard data-fetching-on-mount pattern.
    loadInvoices();
  }, []);

  const fetchTotals = async (faturasList) => {
    if (!faturasList || faturasList.length === 0) return;
    const ids = faturasList.map(f => f.id);

    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('invoice_id, amount, is_payment, is_carryover')
        .in('invoice_id', ids);

      if (error) throw error;

      // "Value" shown per invoice is just that invoice's own period activity —
      // purchases and refunds, excluding the payment settlement line — not a
      // cumulative carried balance. A payment always settles the *previous*
      // invoice, so folding it into a running total here didn't make sense; the
      // cumulative view now lives in the chart above the list instead. Carryover
      // lines (previous invoice's balance restated as a new line) are excluded too —
      // that debt already carries forward on its own, so counting it again here
      // would double-book it as if it were new spending this period.
      const totals = {};
      data.forEach(item => {
        if (item.is_payment || item.is_carryover) return;
        totals[item.invoice_id] = (totals[item.invoice_id] || 0) + Number(item.amount || 0);
      });
      setInvoiceTotals(totals);
    } catch (err) {
      console.error("Erro ao buscar totais das faturas:", err);
    }
  };

  useEffect(() => {
    if (invoices.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches invoice item totals from Supabase whenever the invoice list changes.
      fetchTotals(invoices);
    }
    setIsLoading(false);
  }, [invoices]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvoice(formData);
      toast({ title: t('invoices.created_success') });
      setIsDialogOpen(false);
      setFormData({ invoice_number: '', opening_date: '', closing_date: '', account_id: '', status: 'open' });
      loadInvoices();
    } catch (error) {
      toast({ title: t('invoices.create_error'), description: error.message, variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('invoices').update({
        invoice_number: editFormData.invoice_number,
        opening_date: editFormData.opening_date,
        closing_date: editFormData.closing_date,
        account_id: editFormData.account_id,
        status: editFormData.status
      }).eq('id', editFormData.id).eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({ title: t('invoices.updated_success') });
      setIsEditOpen(false);
      loadInvoices();
    } catch (error) {
      toast({ title: t('invoices.update_error'), description: error.message, variant: "destructive" });
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteId) return;
    try {
      // Unlink any payments first: invoice_items cascade-delete automatically, but
      // transactions.invoice_id has no cascade, so deleting would fail with an FK error otherwise.
      await supabase.from('transactions').update({ invoice_id: null }).eq('invoice_id', deleteId).eq('user_id', user.id);

      const { error } = await supabase.from('invoices').delete().eq('id', deleteId).eq('user_id', user.id);
      if (error) throw error;

      toast({ title: t('invoices.deleted_success') });
      setDeleteId(null);
      setSelectedFaturas(prev => prev.filter(id => id !== deleteId));
      loadInvoices();
    } catch (error) {
      toast({ title: t('invoices.delete_error'), description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':   return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('invoices.status_open')}</span>;
      case 'closed': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('invoices.status_closed')}</span>;
      case 'paid':   return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('invoices.status_paid')}</span>;
      default: return null;
    }
  };

  const runInvoiceItemSearch = async (filters) => {
    const parsedValueFilter = filters.valorRange ? parseValueFilterString(filters.valorRange) : null;
    const hasActiveValueFilter = parsedValueFilter && parsedValueFilter.isValid && parsedValueFilter.conditions.length > 0;

    // Status is a property of the invoice itself, so it filters the main
    // invoices list directly instead of switching to the purchase-items search below.
    setStatusFilter(filters.status || '');

    const hasActiveFilters = filters.search || hasActiveValueFilter || filters.account_id || filters.installment !== 'todos';
    setIsFiltering(hasActiveFilters);

    if (hasActiveFilters) {
      let query = supabase.from('invoice_items').select('*, invoices(invoice_number), categories(name, color)');

      if (filters.search) query = query.ilike('description', `%${filters.search}%`);

      if (hasActiveValueFilter) {
        parsedValueFilter.conditions.forEach(cond => {
          if (cond.op === '>') query = query.gt('amount', cond.val);
          else if (cond.op === '<') query = query.lt('amount', cond.val);
          else if (cond.op === '>=') query = query.gte('amount', cond.val);
          else if (cond.op === '<=') query = query.lte('amount', cond.val);
          else query = query.eq('amount', cond.val);
        });
      }

      if (filters.installment === 'installment') query = query.eq('is_installment', true);
      if (filters.installment === 'not_installment') query = query.eq('is_installment', false);

      if (filters.account_id) {
        const matchedFaturas = invoices.filter(f => f.account_id === filters.account_id).map(f => f.id);
        if (matchedFaturas.length > 0) {
          query = query.in('invoice_id', matchedFaturas);
        } else {
          query = query.eq('invoice_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data } = await query;
      setComprasFiltro(data || []);
    } else {
      setComprasFiltro([]);
    }
  };

  const handleFilterChange = async (filters) => {
    setActiveFilters(filters);
    await runInvoiceItemSearch(filters);
  };

  // The filtered-items view above is a one-shot query, not derived from `invoices` —
  // without this, editing/deleting an invoice while a search/value/account/installment
  // filter is active leaves this view showing stale rows until a filter is re-touched.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-runs the Supabase purchase-item search when invoices changes; runInvoiceItemSearch's own setState calls happen after that await, not synchronously in the effect body.
    if (activeFilters) runInvoiceItemSearch(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reacts to `invoices` changing; filter changes are already handled directly by handleFilterChange.
  }, [invoices]);

  const handleImportSuccess = () => {
    loadInvoices();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFaturas(filteredInvoices.map(f => f.id));
    } else {
      setSelectedFaturas([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedFaturas(prev => [...prev, id]);
    } else {
      setSelectedFaturas(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleEditClick = (invoice) => {
    setEditFormData({
      id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      opening_date: invoice.opening_date || '',
      closing_date: invoice.closing_date || '',
      account_id: invoice.account_id || '',
      status: getEffectiveInvoiceStatus(invoice)
    });
    setIsEditOpen(true);
  };

  const handleRowClick = (invoice) => {
    setSelectedDetailInvoice(invoice);
  };

  // Inline preview toggle — lets you peek at an invoice's items without leaving this
  // page. Items are fetched once per invoice and cached, not refetched on re-collapse.
  const toggleExpandInvoice = async (invoiceId) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
      return;
    }
    setExpandedInvoiceId(invoiceId);
    if (!expandedItemsByInvoiceId[invoiceId]) {
      setLoadingExpandedId(invoiceId);
      const data = await fetchInvoiceItems(invoiceId);
      setExpandedItemsByInvoiceId(prev => ({ ...prev, [invoiceId]: data || [] }));
      setLoadingExpandedId(null);
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const requestItemSort = (key) => {
    let direction = 'ascending';
    if (itemSortConfig.key === key && itemSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setItemSortConfig({ key, direction });
  };

  const sortedFilteredItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;

    if (itemSortConfig.key === 'invoice_number') {
      aValue = a.invoices?.invoice_number || '';
      bValue = b.invoices?.invoice_number || '';
    } else if (itemSortConfig.key === 'category') {
      aValue = a.categories?.name || '';
      bValue = b.categories?.name || '';
    } else if (itemSortConfig.key === 'date') {
      aValue = new Date(a.date || 0).getTime();
      bValue = new Date(b.date || 0).getTime();
    } else {
      aValue = a[itemSortConfig.key];
      bValue = b[itemSortConfig.key];
    }

    if (aValue < bValue) return itemSortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return itemSortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const filteredInvoices = (() => {
    const sorted = [...invoices].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'amount') {
         aValue = invoiceTotals[a.id] || 0;
         bValue = invoiceTotals[b.id] || 0;
      } else if (sortConfig.key === 'opening_date') {
         aValue = new Date(a.opening_date || 0).getTime();
         bValue = new Date(b.opening_date || 0).getTime();
      } else if (sortConfig.key === 'status') {
         aValue = getEffectiveInvoiceStatus(a);
         bValue = getEffectiveInvoiceStatus(b);
      } else if (sortConfig.key === 'accountName') {
         aValue = a.account?.name || '';
         bValue = b.account?.name || '';
      } else {
         aValue = a[sortConfig.key];
         bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return sorted.filter(f => matchesDateFilter(f.opening_date, dateFilter) && (!statusFilter || getEffectiveInvoiceStatus(f) === statusFilter));
  })();

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-screen">
      <Helmet>
        <title>VindexValor - {t('invoices.title')}</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">{t('invoices.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <DateFilterSelect value={dateFilter} onChange={setDateFilter} />

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 h-[42px]">
                <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">{t('invoices.import_csv')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[95vw] md:w-full md:max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-4 md:p-6">
              <DialogHeader>
                <DialogTitle>{t('invoices.import_title')}</DialogTitle>
              </DialogHeader>
              <CSVImportFlowFaturas onSuccess={handleImportSuccess} onCancel={() => setIsImportOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-[42px]">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('invoices.new')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('invoices.create_title')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label>{t('invoices.identification_label')}</Label>
                  <input
                    required
                    className="h-10 w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 hover:border-primary focus:border-primary outline-none"
                    value={formData.invoice_number}
                    onChange={e => setFormData({...formData, invoice_number: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker label={t('invoices.opening_date')} value={formData.opening_date} onChange={e => setFormData({...formData, opening_date: e.target.value})} />
                  <DatePicker label={t('invoices.closing_date')} value={formData.closing_date} onChange={e => setFormData({...formData, closing_date: e.target.value})} />
                </div>
                <div>
                  <SelectInput
                    label={t('common.account')}
                    value={formData.account_id}
                    onChange={e => setFormData({...formData, account_id: e.target.value})}
                    options={accounts.filter(a => a.type === 'credit_card' || a.account_subtype === 'credit_card').map(a => ({ label: a.name, value: a.id }))}
                  />
                </div>
                <div>
                  <SelectInput
                    label={t('common.status')}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    options={[
                      { label: t('invoices.status_open'), value: 'open' },
                      { label: t('invoices.status_closed'), value: 'closed' },
                      { label: t('invoices.status_paid'), value: 'paid' }
                    ]}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
                    style={{ borderColor: SUCCESS, color: SUCCESS }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
                  >
                    {t('invoices.create_action')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 rounded-lg border transition-colors bg-transparent"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <InvoiceBalanceChart dateFilter={dateFilter} />

      <InvoiceFilterBar onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('invoices.loading')}</div>
      ) : isFiltering ? (
        <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Receipt className="w-5 h-5 text-primary" /> {t('invoices.filtered_results')}
          </h2>
          {filteredItems.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                {t('invoices.no_purchases_found')}
             </div>
          ) : (
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[680px] table-fixed">
                   <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                      <tr>
                         <th className="px-6 py-3 w-[16%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestItemSort('invoice_number')}>
                           <div className="flex items-center">{t('invoices.col_invoice')} <SortIcon column="invoice_number" sortConfig={itemSortConfig} /></div>
                         </th>
                         <th className="px-6 py-3 w-[12%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestItemSort('date')}>
                           <div className="flex items-center">{t('invoices.col_date')} <SortIcon column="date" sortConfig={itemSortConfig} /></div>
                         </th>
                         <th className="px-6 py-3 w-[34%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestItemSort('description')}>
                           <div className="flex items-center">{t('invoices.col_description')} <SortIcon column="description" sortConfig={itemSortConfig} /></div>
                         </th>
                         <th className="px-6 py-3 w-[20%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestItemSort('category')}>
                           <div className="flex items-center">{t('invoices.col_category')} <SortIcon column="category" sortConfig={itemSortConfig} /></div>
                         </th>
                         <th className="px-6 py-3 w-[18%] text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestItemSort('amount')}>
                           <div className="flex items-center justify-end">{t('invoices.col_amount')} <SortIcon column="amount" sortConfig={itemSortConfig} /></div>
                         </th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                      {sortedFilteredItems.map(c => (
                         <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                            <td className="px-6 py-4 font-medium cursor-pointer text-primary hover:underline truncate" onClick={() => navigate(`/invoices/${c.invoice_id}`)}>
                              {c.invoices?.invoice_number || t('invoices.unknown_invoice')}
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(c.date)}</td>
                            <td className="px-6 py-4 text-gray-900 dark:text-gray-50 truncate" title={c.description}>
                              {c.description}
                              {c.is_installment && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">{t('invoices.parcel_label', { number: c.parcel_number, total: c.total_parcels })}</span>}
                            </td>
                            <td className="px-6 py-4">
                               {c.categories ? (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.categories.color }}></div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{c.categories.name}</span>
                                  </div>
                               ) : <span className="text-gray-500 text-xs">{t('common.no_category')}</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-50 whitespace-nowrap">{formatCurrency(c.amount)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-sm text-muted-foreground">{t('invoices.showing_count', { count: filteredInvoices.length })}</span>
            {selectedInvoices.length > 0 && (
              <span className="selection-indicator-text text-sm">
                {t('common.selected_count', { count: selectedInvoices.length })}
              </span>
            )}
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">{t('invoices.empty')}</p>
              <Button onClick={() => setIsDialogOpen(true)}>{t('invoices.create_first')}</Button>
            </div>
          ) : (
            <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[700px] table-fixed">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <th className="px-2 py-3 w-[4%]"></th>
                      <th className="px-6 py-3 w-[4%] text-center">
                        <Checkbox
                          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label={t('invoices.select_all')}
                        />
                      </th>
                      <th className="px-6 py-3 w-[18%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestSort('invoice_number')}>
                        <div className="flex items-center">{t('invoices.col_invoice')} <SortIcon column="invoice_number" sortConfig={sortConfig} /></div>
                      </th>
                      <th className="px-6 py-3 w-[15%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestSort('accountName')}>
                        <div className="flex items-center">{t('common.account')} <SortIcon column="accountName" sortConfig={sortConfig} /></div>
                      </th>
                      <th className="px-6 py-3 w-[14%] text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestSort('opening_date')}>
                        <div className="flex items-center">{t('invoices.col_opening_date')} <SortIcon column="opening_date" sortConfig={sortConfig} /></div>
                      </th>
                      <th className="px-6 py-3 w-[14%] text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestSort('amount')}>
                        <div className="flex items-center justify-end">{t('invoices.col_total')} <SortIcon column="amount" sortConfig={sortConfig} /></div>
                      </th>
                      <th className="px-6 py-3 w-[14%] text-center font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-vindex-bg/50 transition-colors" onClick={() => requestSort('status')}>
                        <div className="flex items-center justify-center">{t('invoices.col_status')} <SortIcon column="status" sortConfig={sortConfig} /></div>
                      </th>
                      <th className="px-6 py-3 w-[17%] text-right font-medium text-gray-700 dark:text-gray-300">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {filteredInvoices.map(invoice => {
                      const totalValue = invoiceTotals[invoice.id] || 0;
                      const isExpanded = expandedInvoiceId === invoice.id;
                      const expandedItems = expandedItemsByInvoiceId[invoice.id];
                      return (
                      <React.Fragment key={invoice.id}>
                        <tr
                          className={`cursor-pointer transition-colors ${selectedInvoices.includes(invoice.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                          onClick={() => handleRowClick(invoice)}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                        >
                          <td className="px-2 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleExpandInvoice(invoice.id)}
                              aria-label={isExpanded ? t('invoices.collapse_items') : t('invoices.expand_items')}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-vindex-bg transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={(checked) => handleSelectRow(invoice.id, checked)}
                              aria-label={t('invoices.select_row', { name: invoice.invoice_number })}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-50 truncate">
                            {invoice.invoice_number || t('invoices.unnamed_invoice')}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate">
                            {invoice.account?.name || t('invoices.account_removed')}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(invoice.opening_date)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium whitespace-nowrap" style={{ color: totalValue < 0 ? DANGER : totalValue > 0 ? SUCCESS : undefined }}>
                            {formatCurrency(totalValue)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(getEffectiveInvoiceStatus(invoice))}
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(invoice)}
                                className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent shrink-0"
                                style={{ borderColor: PRIMARY, color: PRIMARY }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteId(invoice.id)}
                                className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent shrink-0"
                                style={{ borderColor: DANGER, color: DANGER }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 bg-gray-50 dark:bg-vindex-bg/50 border-t border-gray-200 dark:border-vindex-border">
                              {loadingExpandedId === invoice.id ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">{t('invoices.loading')}</div>
                              ) : !expandedItems || expandedItems.length === 0 ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">{t('invoice_detail.item_list_empty')}</div>
                              ) : (
                                <div className="space-y-2">
                                  {expandedItems.map(c => {
                                    const isSaida = Number(c.amount) < 0;
                                    const valColor = isSaida ? DANGER : c.amount > 0 ? SUCCESS : undefined;
                                    return (
                                      <div key={c.id} className="flex items-center justify-between gap-3 bg-white dark:bg-vindex-card px-4 py-2 rounded-lg border border-gray-200 dark:border-vindex-border text-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                          {c.is_payment ? <Wallet className="w-4 h-4 text-primary shrink-0" />
                                            : c.is_carryover ? <Repeat className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            : isSaida ? <ArrowDownRight className="w-4 h-4 shrink-0" style={{ color: DANGER }} />
                                            : <ArrowUpRight className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />}
                                          <span className="truncate text-gray-900 dark:text-gray-50">{c.description}</span>
                                          {c.categories && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate shrink-0">{c.categories.name}</span>
                                          )}
                                        </div>
                                        <span className="font-semibold whitespace-nowrap" style={{ color: valColor }}>
                                          {c.amount > 0 && '+'}{formatCurrency(c.amount)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    className="w-full text-primary gap-1"
                                  >
                                    {t('invoices.view_purchases')} <ArrowRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <InvoiceSelectionBar 
        selectedIds={selectedInvoices}
        invoices={invoices}
        invoiceTotals={invoiceTotals}
        onClearSelection={() => setSelectedFaturas([])}
        onRefresh={() => loadInvoices()}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('invoices.edit_title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>{t('invoices.identification_label')}</Label>
              <input
                required
                className="h-10 w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 hover:border-primary focus:border-primary outline-none"
                value={editFormData.invoice_number}
                onChange={e => setEditFormData({...editFormData, invoice_number: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label={t('invoices.opening_date')} value={editFormData.opening_date} onChange={e => setEditFormData({...editFormData, opening_date: e.target.value})} />
              <DatePicker
                label={t('invoices.closing_date')}
                value={editFormData.closing_date}
                onChange={e => setEditFormData({
                  ...editFormData,
                  closing_date: e.target.value,
                  // Re-derive open/closed for the new date so the Status field
                  // below doesn't keep showing the stale value computed when the
                  // dialog opened; an explicit 'paid' is left alone.
                  status: editFormData.status === 'paid'
                    ? 'paid'
                    : getEffectiveInvoiceStatus({ status: 'open', closing_date: e.target.value }),
                })}
              />
            </div>
            <div>
              <SelectInput
                label={t('common.account')}
                value={editFormData.account_id}
                onChange={e => setEditFormData({...editFormData, account_id: e.target.value})}
                options={accounts.filter(a => a.type === 'credit_card' || a.account_subtype === 'credit_card').map(a => ({ label: a.name, value: a.id }))}
              />
            </div>
            <div>
              <SelectInput
                label={t('common.status')}
                value={editFormData.status}
                onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                options={[
                  { label: t('invoices.status_open'), value: 'open' },
                  { label: t('invoices.status_closed'), value: 'closed' },
                  { label: t('invoices.status_paid'), value: 'paid' }
                ]}
              />
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button type="button" variant="outline" onClick={() => navigate(`/invoices/${editFormData.id}`)} className="w-full gap-2">
                {t('invoices.view_purchases')} <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  className="flex-1 font-medium rounded-lg transition-colors bg-transparent"
                  style={{ borderColor: SUCCESS, color: SUCCESS }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = SUCCESS; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SUCCESS; }}
                >
                  {t('invoices.save_changes')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 rounded-lg border transition-colors bg-transparent"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <InvoiceDetailModal
        isOpen={!!selectedDetailInvoice}
        onClose={() => setSelectedDetailInvoice(null)}
        invoice={selectedDetailInvoice}
        total={selectedDetailInvoice ? (invoiceTotals[selectedDetailInvoice.id] || 0) : 0}
        onEdit={(invoice) => handleEditClick(invoice)}
        onDelete={(id) => setDeleteId(id)}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description={t('invoices.delete_confirm')}
        onConfirm={confirmDeleteInvoice}
      />
    </div>
  );
};

export default InvoicesPage;