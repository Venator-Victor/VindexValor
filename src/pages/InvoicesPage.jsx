import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Share as UploadCloud, Receipt, ArrowRight, ArrowUp, ArrowDown } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import CSVImportFlowFaturas from '@/components/CSVImportFlowFaturas';
import InvoiceFilterBar from '@/components/InvoiceFilterBar';
import { parseValueFilterString } from '@/components/FilterRangeInput';
import { supabase } from '@/lib/customSupabaseClient';
import InvoiceSelectionBar from '@/components/InvoiceSelectionBar';
import { PRIMARY } from '@/utils/colors';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import { getDateFilterDefaults, matchesDateFilter } from '@/utils/dateFilter';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0" />;
  return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
};

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { invoices, fetchInvoices, createInvoice, accounts } = useFinance();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [filteredItems, setComprasFiltro] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedInvoices, setSelectedFaturas] = useState([]);
  const [invoiceTotals, setInvoiceTotals] = useState({});

  const [dateFilter, setDateFilter] = useState(getDateFilterDefaults());
  
  const [sortConfig, setSortConfig] = useState({ key: 'opening_date', direction: 'descending' });
  
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
        .select('invoice_id, amount')
        .in('invoice_id', ids);

      if (error) throw error;

      const totals = {};
      data.forEach(item => {
        if (!totals[item.invoice_id]) totals[item.invoice_id] = 0;
        // Only sum actual purchases (negative values)
        if (Number(item.amount) < 0) {
          totals[item.invoice_id] += Number(item.amount);
        }
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

  const handleFilterChange = async (filters) => {
    const parsedValueFilter = filters.valorRange ? parseValueFilterString(filters.valorRange) : null;
    const hasActiveValueFilter = parsedValueFilter && parsedValueFilter.isValid && parsedValueFilter.conditions.length > 0;
    
    const hasActiveFilters = filters.search || hasActiveValueFilter || filters.category_id || filters.account_id || filters.installment !== 'todos';
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
      
      if (filters.category_id) query = query.eq('category_id', filters.category_id);
      
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

  const handleRowClick = (invoice) => {
    setEditFormData({
      id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      opening_date: invoice.opening_date || '',
      closing_date: invoice.closing_date || '',
      account_id: invoice.account_id || '',
      status: invoice.status || 'open'
    });
    setIsEditOpen(true);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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
         aValue = a.status || '';
         bValue = b.status || '';
      } else {
         aValue = a[sortConfig.key];
         bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return sorted.filter(f => matchesDateFilter(f.opening_date, dateFilter));
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
            <DialogContent className="dialog-responsive max-w-[95vw] md:max-w-4xl p-4 md:p-6">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('invoices.create_title')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label>{t('invoices.identification_label')}</Label>
                  <input
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 hover:border-primary focus:border-primary outline-none"
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
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">{t('invoices.create_action')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                         <th className="px-6 py-3 w-[16%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_invoice')}</th>
                         <th className="px-6 py-3 w-[12%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_date')}</th>
                         <th className="px-6 py-3 w-[34%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_description')}</th>
                         <th className="px-6 py-3 w-[20%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_category')}</th>
                         <th className="px-6 py-3 w-[18%] text-right font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_amount')}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                      {filteredItems.map(c => (
                         <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                            <td className="px-6 py-4 font-medium cursor-pointer text-primary hover:underline truncate" onClick={() => navigate(`/faturas/${c.invoice_id}`)}>
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
                      <th className="px-6 py-3 w-[6%] text-center">
                        <Checkbox
                          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label={t('invoices.select_all')}
                        />
                      </th>
                      <th className="px-6 py-3 w-[22%] text-left font-medium text-gray-700 dark:text-gray-300">{t('invoices.col_invoice')}</th>
                      <th className="px-6 py-3 w-[20%] text-left font-medium text-gray-700 dark:text-gray-300">{t('common.account')}</th>
                      <th className="px-6 py-3 w-[16%] align-middle">
                        <button onClick={() => requestSort('opening_date')} className="table-header-sortable justify-start text-gray-700 dark:text-gray-300">
                          {t('invoices.col_opening_date')} <SortIcon column="opening_date" sortConfig={sortConfig} />
                        </button>
                      </th>
                      <th className="px-6 py-3 w-[18%] align-middle">
                        <button onClick={() => requestSort('amount')} className="table-header-sortable justify-end pl-0 pr-0 ml-auto mr-0 text-gray-700 dark:text-gray-300">
                          {t('invoices.col_total')} <SortIcon column="amount" sortConfig={sortConfig} />
                        </button>
                      </th>
                      <th className="px-6 py-3 w-[18%] align-middle">
                        <button onClick={() => requestSort('status')} className="table-header-sortable justify-center pl-0 pr-0 ml-auto mr-auto text-gray-700 dark:text-gray-300">
                          {t('invoices.col_status')} <SortIcon column="status" sortConfig={sortConfig} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {filteredInvoices.map(invoice => {
                      const totalValue = invoiceTotals[invoice.id] || 0;
                      return (
                        <tr
                          key={invoice.id}
                          className={`cursor-pointer transition-colors ${selectedInvoices.includes(invoice.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                          onClick={() => handleRowClick(invoice)}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                        >
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
                          <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${totalValue < 0 ? 'text-red-600 dark:text-red-400' : totalValue > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {formatCurrency(totalValue)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(invoice.status)}
                          </td>
                        </tr>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('invoices.edit_title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>{t('invoices.identification_label')}</Label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 hover:border-primary focus:border-primary outline-none"
                value={editFormData.invoice_number}
                onChange={e => setEditFormData({...editFormData, invoice_number: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label={t('invoices.opening_date')} value={editFormData.opening_date} onChange={e => setEditFormData({...editFormData, opening_date: e.target.value})} />
              <DatePicker label={t('invoices.closing_date')} value={editFormData.closing_date} onChange={e => setEditFormData({...editFormData, closing_date: e.target.value})} />
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

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(`/faturas/${editFormData.id}`)} className="w-full sm:w-auto gap-2">
                {t('invoices.view_purchases')} <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex justify-end gap-2 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit">{t('invoices.save_changes')}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;