import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, UploadCloud, Receipt, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
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

const FaturasPage = () => {
  const { user } = useAuth();
  const { faturas, fetchFaturas, createFatura, accounts } = useFinance();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [comprasFiltro, setComprasFiltro] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedFaturas, setSelectedFaturas] = useState([]);
  const [faturaTotals, setFaturaTotals] = useState({});

  const [dateFilterType, setDateFilterType] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ key: 'data_abertura', direction: 'descending' });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero_fatura: '',
    data_abertura: '',
    data_fechamento: '',
    conta_id: '',
    status: 'aberta'
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    numero_fatura: '',
    data_abertura: '',
    data_fechamento: '',
    conta_id: '',
    status: 'aberta'
  });

  useEffect(() => {
    loadFaturas();
  }, []);

  const fetchTotals = async (faturasList) => {
    if (!faturasList || faturasList.length === 0) return;
    const ids = faturasList.map(f => f.id);
    
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('fatura_id, valor')
        .in('fatura_id', ids);

      if (error) throw error;

      const totals = {};
      data.forEach(item => {
        if (!totals[item.fatura_id]) totals[item.fatura_id] = 0;
        // Only sum actual purchases (negative values)
        if (Number(item.valor) < 0) {
          totals[item.fatura_id] += Number(item.valor);
        }
      });
      setFaturaTotals(totals);
    } catch (err) {
      console.error("Erro ao buscar totais das faturas:", err);
    }
  };

  const loadFaturas = async () => {
    setIsLoading(true);
    await fetchFaturas();
  };

  useEffect(() => {
    if (faturas.length > 0) {
      fetchTotals(faturas);
    }
    setIsLoading(false);
  }, [faturas]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFatura(formData);
      toast({ title: "Fatura criada com sucesso!" });
      setIsDialogOpen(false);
      setFormData({ numero_fatura: '', data_abertura: '', data_fechamento: '', conta_id: '', status: 'aberta' });
      loadFaturas();
    } catch (error) {
      toast({ title: "Erro ao criar fatura", description: error.message, variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('invoices').update({
        numero_fatura: editFormData.numero_fatura,
        data_abertura: editFormData.data_abertura,
        data_fechamento: editFormData.data_fechamento,
        conta_id: editFormData.conta_id,
        status: editFormData.status
      }).eq('id', editFormData.id).eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({ title: "Fatura atualizada com sucesso!" });
      setIsEditOpen(false);
      loadFaturas();
    } catch (error) {
      toast({ title: "Erro ao atualizar fatura", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'aberta': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Aberta</span>;
      case 'fechada': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Fechada</span>;
      case 'paga': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paga</span>;
      default: return null;
    }
  };

  const handleFilterChange = async (filters) => {
    const parsedValueFilter = filters.valorRange ? parseValueFilterString(filters.valorRange) : null;
    const hasActiveValueFilter = parsedValueFilter && parsedValueFilter.isValid && parsedValueFilter.conditions.length > 0;
    
    const hasActiveFilters = filters.search || hasActiveValueFilter || filters.categoria_id || filters.conta_id || filters.parcelamento !== 'todos';
    setIsFiltering(hasActiveFilters);
    
    if (hasActiveFilters) {
      let query = supabase.from('invoice_items').select('*, invoices(numero_fatura), categories(name, color)');
      
      if (filters.search) query = query.ilike('descricao', `%${filters.search}%`);
      
      if (hasActiveValueFilter) {
        parsedValueFilter.conditions.forEach(cond => {
          if (cond.op === '>') query = query.gt('valor', cond.val);
          else if (cond.op === '<') query = query.lt('valor', cond.val);
          else if (cond.op === '>=') query = query.gte('valor', cond.val);
          else if (cond.op === '<=') query = query.lte('valor', cond.val);
          else query = query.eq('valor', cond.val);
        });
      }
      
      if (filters.categoria_id) query = query.eq('categoria_id', filters.categoria_id);
      
      if (filters.parcelamento === 'parcelado') query = query.eq('is_parcelado', true);
      if (filters.parcelamento === 'nao_parcelado') query = query.eq('is_parcelado', false);
      
      if (filters.conta_id) {
        const matchedFaturas = faturas.filter(f => f.conta_id === filters.conta_id).map(f => f.id);
        if (matchedFaturas.length > 0) {
          query = query.in('fatura_id', matchedFaturas);
        } else {
          query = query.eq('fatura_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data } = await query;
      setComprasFiltro(data || []);
    } else {
      setComprasFiltro([]);
    }
  };

  const handleImportSuccess = () => {
    loadFaturas();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFaturas(filteredFaturas.map(f => f.id));
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

  const handleRowClick = (fatura) => {
    setEditFormData({
      id: fatura.id,
      numero_fatura: fatura.numero_fatura || '',
      data_abertura: fatura.data_abertura || '',
      data_fechamento: fatura.data_fechamento || '',
      conta_id: fatura.conta_id || '',
      status: fatura.status || 'aberta'
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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const filteredFaturas = useMemo(() => {
    const sorted = [...faturas].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'valor') {
         aValue = faturaTotals[a.id] || 0;
         bValue = faturaTotals[b.id] || 0;
      } else if (sortConfig.key === 'data_abertura') {
         aValue = new Date(a.data_abertura || 0).getTime();
         bValue = new Date(b.data_abertura || 0).getTime();
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);
    const currentYearStr = todayStr.substring(0, 4);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    return sorted.filter(f => {
      let matchesDate = true;
      const fDate = f.data_abertura;
      
      if (dateFilterType && fDate) {
        if (dateFilterType === 'today') {
          matchesDate = fDate === todayStr;
        } else if (dateFilterType === 'week') {
          matchesDate = fDate >= weekAgoStr && fDate <= todayStr;
        } else if (dateFilterType === 'month') {
          matchesDate = fDate.startsWith(currentMonthStr);
        } else if (dateFilterType === 'year') {
          matchesDate = fDate.startsWith(currentYearStr);
        } else if (dateFilterType === 'custom' || dateFilterType === 'periodo') {
           matchesDate = true;
        }
      }

      return matchesDate;
    });
  }, [faturas, dateFilterType, sortConfig, faturaTotals]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-screen">
      <Helmet>
        <title>VindexValor - Faturas</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Faturas</h1>
          <p className="text-muted-foreground">Gerencie faturas e importações de cartão de crédito</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <SelectInput
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value)}
            options={[
              { label: "Período (Abertura)", value: "" },
              { label: "Dia", value: "today" },
              { label: "Semana", value: "week" },
              { label: "Mês", value: "month" },
              { label: "Ano", value: "year" }
            ]}
            className="w-40 sm:w-48"
          />

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Importar em Lote</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-responsive max-w-[95vw] md:max-w-4xl p-4 md:p-6">
              <DialogHeader>
                <DialogTitle>Importação de Faturas</DialogTitle>
              </DialogHeader>
              <CSVImportFlowFaturas onSuccess={handleImportSuccess} onCancel={() => setIsImportOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Fatura</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Fatura</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label>Identificação (Ex: Fatura Mar/2026)</Label>
                  <input 
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 focus:ring-2 focus:ring-primary/50 outline-none"
                    value={formData.numero_fatura}
                    onChange={e => setFormData({...formData, numero_fatura: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker label="Abertura" value={formData.data_abertura} onChange={e => setFormData({...formData, data_abertura: e.target.value})} />
                  <DatePicker label="Fechamento/Vencimento" value={formData.data_fechamento} onChange={e => setFormData({...formData, data_fechamento: e.target.value})} />
                </div>
                <div>
                  <SelectInput 
                    label="Conta"
                    value={formData.conta_id}
                    onChange={e => setFormData({...formData, conta_id: e.target.value})}
                    options={accounts.filter(a => a.type === 'Cartão de Crédito' || a.account_subtype === 'credit_card').map(a => ({ label: a.name, value: a.id }))}
                  />
                </div>
                <div>
                  <SelectInput 
                    label="Status"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    options={[
                      { label: 'Aberta', value: 'aberta' },
                      { label: 'Fechada', value: 'fechada' },
                      { label: 'Paga', value: 'paga' }
                    ]}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">Criar Fatura</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <InvoiceFilterBar onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
      ) : isFiltering ? (
        <div className="bg-card rounded-xl border shadow-sm p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Resultados Filtrados (Compras)
          </h2>
          {comprasFiltro.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                Nenhuma compra encontrada com os filtros atuais.
             </div>
          ) : (
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[600px]">
                   <thead className="bg-muted/50 border-b">
                      <tr>
                         <th className="p-3 text-left font-medium text-muted-foreground">Fatura</th>
                         <th className="p-3 text-left font-medium text-muted-foreground">Data</th>
                         <th className="p-3 text-left font-medium text-muted-foreground">Descrição</th>
                         <th className="p-3 text-left font-medium text-muted-foreground">Categoria</th>
                         <th className="p-3 text-right font-medium text-muted-foreground">Valor</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {comprasFiltro.map(c => (
                         <tr key={c.id} className="hover:bg-muted/30">
                            <td className="p-3 font-medium cursor-pointer text-primary hover:underline" onClick={() => navigate(`/faturas/${c.fatura_id}`)}>
                              {c.faturas?.numero_fatura || 'Desconhecida'}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(c.data)}</td>
                            <td className="p-3">
                              {c.descricao}
                              {c.is_parcelado && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">Parc {c.parcel_number}/{c.total_parcels}</span>}
                            </td>
                            <td className="p-3">
                               {c.categorias ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.categorias.color }}></div>
                                    <span className="text-xs truncate max-w-[120px]">{c.categorias.name}</span>
                                  </div>
                               ) : <span className="text-muted-foreground text-xs">Sem categoria</span>}
                            </td>
                            <td className="p-3 text-right font-medium whitespace-nowrap">{formatCurrency(c.valor)}</td>
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
            <span className="text-sm text-muted-foreground">Exibindo {filteredFaturas.length} faturas</span>
            {selectedFaturas.length > 0 && (
              <span className="selection-indicator-text text-sm">
                {selectedFaturas.length} selecionada{selectedFaturas.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {filteredFaturas.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma fatura encontrada.</p>
              <Button onClick={() => setIsDialogOpen(true)}>Criar Primeira Fatura</Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 w-12 text-center">
                        <Checkbox 
                          checked={selectedFaturas.length === filteredFaturas.length && filteredFaturas.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todas faturas"
                        />
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Fatura</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Conta</th>
                      <th className="p-3 align-middle">
                        <button onClick={() => requestSort('data_abertura')} className="table-header-sortable justify-start">
                          Data Abertura <SortIcon column="data_abertura" />
                        </button>
                      </th>
                      <th className="p-3 align-middle">
                        <button onClick={() => requestSort('valor')} className="table-header-sortable justify-end pl-0 pr-0 ml-auto mr-0">
                          Valor Total <SortIcon column="valor" />
                        </button>
                      </th>
                      <th className="p-3 align-middle">
                        <button onClick={() => requestSort('status')} className="table-header-sortable justify-center pl-0 pr-0 ml-auto mr-auto">
                          Status <SortIcon column="status" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredFaturas.map(fatura => {
                      const totalValue = faturaTotals[fatura.id] || 0;
                      return (
                        <tr 
                          key={fatura.id} 
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedFaturas.includes(fatura.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                          onClick={() => handleRowClick(fatura)}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedFaturas.includes(fatura.id)}
                              onCheckedChange={(checked) => handleSelectRow(fatura.id, checked)}
                              aria-label={`Selecionar fatura ${fatura.numero_fatura}`}
                            />
                          </td>
                          <td className="p-3 font-medium text-foreground">
                            {fatura.numero_fatura || 'Fatura Sem Nome'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {fatura.contas?.name || 'Conta Removida'}
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(fatura.data_abertura)}
                          </td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${totalValue < 0 ? 'text-red-600 dark:text-red-400' : totalValue > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {formatCurrency(totalValue)}
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(fatura.status)}
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
        selectedIds={selectedFaturas}
        faturas={faturas}
        faturaTotals={faturaTotals}
        onClearSelection={() => setSelectedFaturas([])}
        onRefresh={() => loadFaturas()}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes / Editar Fatura</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Identificação</Label>
              <input 
                required
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground mt-1 focus:ring-2 focus:ring-primary/50 outline-none"
                value={editFormData.numero_fatura}
                onChange={e => setEditFormData({...editFormData, numero_fatura: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Abertura" value={editFormData.data_abertura} onChange={e => setEditFormData({...editFormData, data_abertura: e.target.value})} />
              <DatePicker label="Fechamento/Vencimento" value={editFormData.data_fechamento} onChange={e => setEditFormData({...editFormData, data_fechamento: e.target.value})} />
            </div>
            <div>
              <SelectInput 
                label="Conta"
                value={editFormData.conta_id}
                onChange={e => setEditFormData({...editFormData, conta_id: e.target.value})}
                options={accounts.filter(a => a.type === 'Cartão de Crédito' || a.account_subtype === 'credit_card').map(a => ({ label: a.name, value: a.id }))}
              />
            </div>
            <div>
              <SelectInput 
                label="Status"
                value={editFormData.status}
                onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                options={[
                  { label: 'Aberta', value: 'aberta' },
                  { label: 'Fechada', value: 'fechada' },
                  { label: 'Paga', value: 'paga' }
                ]}
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(`/faturas/${editFormData.id}`)} className="w-full sm:w-auto gap-2">
                Ver Compras <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex justify-end gap-2 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaturasPage;