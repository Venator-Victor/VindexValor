import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { Receipt as ReceiptText, Share as UploadCloud, Plus, Search, X, Filter } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import SelectInput from '@/components/ui/SelectInput';
import TransactionForm from '@/components/TransactionForm';
import CSVImportFlow from '@/components/CSVImportFlow';
import TransactionTable from '@/components/TransactionTable';
import TransactionSelectionModal from '@/components/TransactionSelectionModal';
import CategoryMappingManager from '@/components/CategoryMappingManager';
import FilterRangeInput, { parseValueFilterString } from '@/components/FilterRangeInput';
import InfoTooltip from '@/components/InfoTooltip';

const Transacoes = () => {
  const { transactions, categories, accounts, isLoading, deleteTransaction } = useFinance();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [filters, setFilters] = useState({ tipo: '', account_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [valueFilterStr, setValueFilterStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [dateFilterType, setDateFilterType] = useState('');

  useEffect(() => {
    if (location.state && transactions.length > 0) {
      let stateUpdated = false;
      
      if (location.state.filterCategoryId !== undefined) {
        setSelectedCategoryId(location.state.filterCategoryId);
        stateUpdated = true;
      }
      
      if (location.state.editTransactionId) {
        const tToEdit = transactions.find(t => t.id === location.state.editTransactionId);
        if (tToEdit) {
          setEditingTransaction(tToEdit);
          setIsDialogOpen(true);
        }
        stateUpdated = true;
      }

      if (stateUpdated) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, transactions, navigate, location.pathname]);

  const filteredTransactions = useMemo(() => {
    const parsedValueFilter = parseValueFilterString(valueFilterStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);
    const currentYearStr = todayStr.substring(0, 4);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    return transactions.filter(t => {
      const matchesType = !filters.tipo || t.type === filters.tipo;
      const matchesAccount = !filters.account_id || t.account_id === filters.account_id || t.destination_account_id === filters.account_id;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (t.description && t.description.toLowerCase().includes(searchLower));
      
      let matchesCategory = true;
      if (selectedCategoryId) {
        if (selectedCategoryId === 'null') {
          matchesCategory = !t.category_id;
        } else {
          matchesCategory = t.category_id === selectedCategoryId;
        }
      }

      let matchesValue = true;
      if (parsedValueFilter.isValid && parsedValueFilter.conditions.length > 0) {
        const absAmount = Math.abs(Number(t.amount));
        for (const cond of parsedValueFilter.conditions) {
          if (cond.op === '>') { if (!(absAmount > cond.val)) matchesValue = false; }
          else if (cond.op === '<') { if (!(absAmount < cond.val)) matchesValue = false; }
          else if (cond.op === '>=') { if (!(absAmount >= cond.val)) matchesValue = false; }
          else if (cond.op === '<=') { if (!(absAmount <= cond.val)) matchesValue = false; }
          else { if (!(absAmount === cond.val)) matchesValue = false; }
        }
      }

      let matchesDate = true;
      const tDate = t.date;
      if (dateFilterType) {
        if (dateFilterType === 'today') {
          matchesDate = tDate === todayStr;
        } else if (dateFilterType === 'week') {
          matchesDate = tDate >= weekAgoStr && tDate <= todayStr;
        } else if (dateFilterType === 'month') {
          matchesDate = tDate.startsWith(currentMonthStr);
        } else if (dateFilterType === 'year') {
          matchesDate = tDate.startsWith(currentYearStr);
        }
        else if (dateFilterType === 'custom' || dateFilterType === 'periodo') {
           matchesDate = true; 
        }
      }

      return matchesType && matchesAccount && matchesSearch && matchesCategory && matchesValue && matchesDate;
    });
  }, [transactions, filters, searchTerm, valueFilterStr, selectedCategoryId, dateFilterType]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleImportSuccess = (count) => {
    toast({ 
      title: "Importação Concluída", 
      description: `${count} transações importadas com sucesso!`,
    });
    setIsImportOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setValueFilterStr('');
    setSelectedCategoryId('');
    setDateFilterType('');
    setFilters({ tipo: '', account_id: '' });
  };

  const activeCount = [
    searchTerm ? 1 : 0,
    valueFilterStr ? 1 : 0,
    selectedCategoryId ? 1 : 0,
    filters.tipo ? 1 : 0,
    filters.account_id ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-screen">
      <Helmet>
        <title>VindexValor - Transações</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas movimentações e pagamentos</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <SelectInput
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value)}
            options={[
              { label: "Qualquer Data", value: "" },
              { label: "Dia", value: "today" },
              { label: "Semana", value: "week" },
              { label: "Mês", value: "month" },
              { label: "Ano", value: "year" },
              { label: "Período (Abertura)", value: "periodo" }
            ]}
            className="w-40 sm:w-48"
          />

          <CategoryMappingManager />
          
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
            <UploadCloud className="w-4 h-4" /> Importar CSV
          </Button>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="dialog-responsive max-w-[95vw] md:max-w-4xl p-4 md:p-6">
              <DialogHeader>
                <DialogTitle>Importar Transações</DialogTitle>
              </DialogHeader>
              <CSVImportFlow onSuccess={handleImportSuccess} onCancel={() => setIsImportOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                initialData={editingTransaction} 
                onSuccess={handleFormSuccess} 
                onCancel={() => setIsDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Filter className="w-4 h-4" /> 
            Filtros Avançados
            
            <InfoTooltip content={
              <div className="space-y-1 text-sm">
                <p><strong>Campo Valor:</strong> Use sinais =, &gt;, &lt; (ex: &gt;100; &lt;1000)</p>
                <p><strong>Campo Descrição:</strong> Buscar por nome ou descrição</p>
              </div>
            } />

            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2">
                {activeCount} ativo{activeCount !== 1 && 's'}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Limpar Filtros <X className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative flex flex-col lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-[42px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <FilterRangeInput
              value={valueFilterStr}
              onChange={setValueFilterStr}
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={[
                { label: "Todas categorias", value: "" },
                { label: "Sem categoria", value: "null" },
                ...categories.map(c => ({ label: c.name, value: c.id }))
              ]}
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              options={[
                { label: "Todos Tipos", value: "" },
                { label: "Entrada", value: "entrada" },
                { label: "Saída", value: "saida" },
                { label: "Transferência", value: "transferencia" },
                { label: "Pagamento", value: "pagamento" }
              ]}
            />
          </div>

          <div className="flex flex-col lg:col-span-1">
            <SelectInput
              value={filters.account_id}
              onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
              options={[
                { label: "Todas Contas", value: "" },
                ...accounts.map(a => ({ label: a.name, value: a.id }))
              ]}
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <span>Exibindo {filteredTransactions.length} transações</span>
        {selectedIds.length > 0 && (
          <span className="selection-indicator-text text-sm font-medium">
            {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando transações...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <ReceiptText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma transação encontrada com os filtros atuais.</p>
        </div>
      ) : (
        <TransactionTable 
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <TransactionSelectionModal 
        selectedIds={selectedIds} 
        transactions={transactions}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={() => window.location.reload()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transacoes;