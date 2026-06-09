import { PRIMARY, PRIMARY_HOVER } from '@/utils/colors';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Grid as LayoutGrid, ListUl as ListIcon, Calendar, AlertTriangle } from '@/components/BxIcon';
import { Plus, Pencil, Trash, TrendingUp, TrendingDown } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/components/ui/use-toast';
import { calculateInvestmentReturn, formatCurrency } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import DatePicker from '@/components/ui/DatePicker';
import NumberInput from '@/components/ui/NumberInput';
import InvestmentsChart from '@/components/InvestmentsChart';
import { useSortableList } from '@/hooks/useSortableList';
import InvestmentTypeSelector from '@/components/InvestmentTypeSelector';
import { CHART_PERIOD_OPTIONS } from '@/utils/periodOptions';
import InvestmentSubtypeSelector from '@/components/InvestmentSubtypeSelector';
import InvestimentoCard from '@/components/cards/InvestimentoCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { INVESTMENT_TYPES } from '@/utils/investmentTypes';

const Investimentos = () => {
  const { investments, accounts, addInvestment, updateInvestment, deleteInvestment, settings, saveSettings } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Sorting Hook
  const { items: sortedInvestments, requestSort, sortConfig } = useSortableList(investments);

  // Chart Controls
  const [chartPeriod, setChartPeriod] = useState('mensal');
  const [displayMode, setDisplayMode] = useState('valor_atual'); // 'valor_atual' | 'rentabilidade'
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: INVESTMENT_TYPES.RENDA_VARIAVEL,
    subtype: '',
    accountId: '',
    investedAmount: '',
    currentAmount: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
  });

  const viewMode = settings.investments_view_preference || 'list';

  const setViewMode = (mode) => {
    saveSettings({ investments_view_preference: mode });
  };
  
  // Filter accounts suitable for funding investments
  const fundingAccounts = accounts.map(acc => ({
    label: `${acc.name} (Saldo: ${formatCurrency(acc.balance)})`,
    value: acc.id
  }));
  fundingAccounts.unshift({ label: "Selecione uma conta (Opcional)", value: "" });

  // Generate Chart Data Effect
  useEffect(() => {
    generateChartData();
  }, [investments, chartPeriod, displayMode]);

  const generateChartData = () => {
    setIsLoadingChart(true);
    
    // Calculate start date based on period
    const now = new Date();
    const startDate = new Date();
    
    switch(chartPeriod) {
        case 'diario': startDate.setDate(now.getDate() - 1); break;
        case 'semanal': startDate.setDate(now.getDate() - 7); break;
        case 'quinzenal': startDate.setDate(now.getDate() - 15); break;
        case 'mensal': startDate.setDate(now.getDate() - 30); break;
        case 'trimestral': startDate.setDate(now.getDate() - 90); break;
        case 'semestral': startDate.setDate(now.getDate() - 180); break;
        case 'anual': startDate.setDate(now.getDate() - 365); break;
        default: startDate.setDate(now.getDate() - 30); // default month
    }

    const days = [];
    const pointsCount = 30; // Approx points for smoothness
    const totalTime = now.getTime() - startDate.getTime();
    const interval = totalTime / pointsCount;

    for (let i = 0; i <= pointsCount; i++) {
        const currentDate = new Date(startDate.getTime() + (i * interval));
        let dailyTotalInvested = 0;
        let dailyTotalCurrent = 0;

        investments.forEach(inv => {
            const purchase = new Date(inv.purchaseDate);
            
            if (purchase <= currentDate) {
                // Investment is active
                dailyTotalInvested += Number(inv.investedAmount);
                
                // Interpolate current value
                const totalDuration = now.getTime() - purchase.getTime();
                if (totalDuration <= 0) {
                     dailyTotalCurrent += Number(inv.currentAmount);
                } else {
                    const elapsed = currentDate.getTime() - purchase.getTime();
                    const fraction = Math.min(Math.max(elapsed / totalDuration, 0), 1);
                    const growth = Number(inv.currentAmount) - Number(inv.investedAmount);
                    dailyTotalCurrent += Number(inv.investedAmount) + (growth * fraction);
                }
            }
        });

        days.push({
            date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: displayMode === 'rentabilidade' 
                ? (dailyTotalInvested > 0 ? ((dailyTotalCurrent - dailyTotalInvested) / dailyTotalInvested) * 100 : 0)
                : dailyTotalCurrent
        });
    }

    setChartData(days);
    setIsLoadingChart(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const investmentData = {
      ...formData,
      investedAmount: Number(formData.investedAmount),
      currentAmount: Number(formData.currentAmount),
    };

    try {
        if (editingInvestment) {
            await updateInvestment(editingInvestment.id, investmentData);
            toast({ title: "Investimento atualizado com sucesso!" });
        } else {
            await addInvestment(investmentData);
            toast({ title: "Investimento criado com sucesso!" });
        }
        setIsDialogOpen(false);
        resetForm();
    } catch (error) {
        console.error("Erro ao salvar investimento:", error);
        // Error toast is handled in context
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: INVESTMENT_TYPES.RENDA_VARIAVEL,
      subtype: '',
      accountId: '',
      investedAmount: '',
      currentAmount: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
    });
    setEditingInvestment(null);
  };

  const handleEdit = (investment) => {
    if (!investment) return;

    setEditingInvestment(investment);
    setFormData({
      name: investment.name || '',
      type: investment.type || INVESTMENT_TYPES.RENDA_VARIAVEL,
      subtype: investment.subtype || '',
      accountId: investment.accountId || '',
      investedAmount: investment.investedAmount != null ? investment.investedAmount.toString() : '',
      currentAmount: investment.currentAmount != null ? investment.currentAmount.toString() : '',
      purchaseDate: investment.purchaseDate || new Date().toISOString().slice(0, 10),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteInvestment(id);
    setDeleteId(null);
    toast({ title: "Investimento excluído com sucesso!" });
  };
  


  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Investimentos</title>
        <meta name="description" content="Acompanhe seus investimentos e rentabilidade" />
      </Helmet>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Investimentos</h1>
          <p className="text-gray-700 dark:text-gray-300">Acompanhe seus investimentos e rentabilidade</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            
            {/* Period Selector */}
            <div className="w-full sm:w-40">
                <Select value={chartPeriod} onValueChange={setChartPeriod}>
                    <SelectTrigger className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300">
                         <div className="flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-gray-500" />
                             <SelectValue />
                         </div>
                    </SelectTrigger>
                    <SelectContent>
                        {CHART_PERIOD_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Display Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
                 <button
                    onClick={() => setDisplayMode('valor_atual')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${displayMode === 'valor_atual' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                    <span className="hidden sm:inline">Valor Atual</span>
                    <span className="sm:hidden">Valor</span>
                 </button>
                 <button
                    onClick={() => setDisplayMode('rentabilidade')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${displayMode === 'rentabilidade' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                    <TrendingUp size={14} />
                    <span className="hidden sm:inline">Rentabilidade</span>
                 </button>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Lista"
              >
                <ListIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Cards"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm} 
                className="text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap border-none font-semibold shadow-md"
                style={{ backgroundColor: PRIMARY }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY}
              >
                <Plus size={20} className="mr-2" />
                <span className="hidden sm:inline">Novo Investimento</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
              <DialogHeader>
                <DialogTitle>{editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Ativo</Label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-vindex-success/50 outline-none"
                    placeholder="Ex: PETR4, Tesouro Selic 2029"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InvestmentTypeSelector
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value, subtype: '' })} // Reset subtype on type change
                        className="w-full"
                    />
                    
                    <InvestmentSubtypeSelector 
                        type={formData.type}
                        value={formData.subtype}
                        onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                        className="w-full"
                    />
                </div>

                <div>
                   <SelectInput
                      label="Conta de Origem (Para débito do valor)"
                      id="accountId"
                      value={formData.accountId}
                      options={fundingAccounts}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     * Selecione uma conta para debitar automaticamente o valor investido.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="investedAmount">Valor Investido</Label>
                    <NumberInput
                        id="investedAmount"
                        value={formData.investedAmount}
                        onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                        step={0.01}
                    />
                    </div>
                    <div>
                    <Label htmlFor="currentAmount">Valor Atual</Label>
                    <NumberInput
                        id="currentAmount"
                        value={formData.currentAmount}
                        onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                        step={0.01}
                    />
                    </div>
                </div>

                <div>
                  <DatePicker
                    label="Data de Compra"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-vindex-success/20 dark:hover:bg-vindex-success/30 dark:text-vindex-success dark:border dark:border-vindex-success/50 rounded-lg">
                    {editingInvestment ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-vindex-bg rounded-lg">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Development Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 w-5 h-5 flex-shrink-0" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
          Esta funcionalidade ainda está em desenvolvimento
        </p>
      </div>

      {/* Chart Section - Always Visible */}
      <div className="animate-in fade-in zoom-in-95 duration-300">
         <InvestmentsChart 
             data={chartData} 
             displayMode={displayMode}
         />
      </div>

      {/* Content Area: Table or Card Grid */}
      {sortedInvestments.length === 0 ? (
        <EmptyState icon={TrendingUp} message="Você ainda não tem investimentos cadastrados." buttonLabel="Criar Primeiro Investimento" onButtonClick={() => { resetForm(); setIsDialogOpen(true); }} />
      ) : (
        <>
          {viewMode === 'card' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {sortedInvestments.map(investment => (
                   <motion.div
                     key={investment.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                   >
                       <InvestimentoCard
                          investment={investment}
                          onEdit={handleEdit}
                          onDelete={() => setDeleteId(investment.id)}
                       />
                   </motion.div>
               ))}
             </div>
          ) : (
            // --- TABLE VIEW ---
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <SortableHeader label="Nome" column="name" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <SortableHeader label="Tipo" column="type" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <SortableHeader label="Subtipo" column="subtype" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <SortableHeader label="Investido" column="investedAmount" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <SortableHeader label="Atual" column="currentAmount" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Rentabilidade</th>
                      <SortableHeader label="Data Compra" column="purchaseDate" sortConfig={sortConfig} onSort={requestSort} className="text-xs font-bold uppercase" />
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {sortedInvestments.map((investment) => {
                      const returnPercent = calculateInvestmentReturn(investment.investedAmount, investment.currentAmount);
                      const isProfit = returnPercent >= 0;

                      return (
                        <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{investment.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{investment.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{investment.subtype || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(investment.investedAmount)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(investment.currentAmount)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {isProfit ? <TrendingUp size={16} className="text-green-600 dark:text-vindex-success" /> : <TrendingDown size={16} className="text-red-600 dark:text-vindex-danger" />}
                              <span className={`text-sm font-bold ${isProfit ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
                                {isProfit ? '+' : ''}{returnPercent.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {new Date(investment.purchaseDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(investment)}
                                className="hover:bg-gray-100 dark:hover:bg-vindex-border text-gray-700 dark:text-gray-300 border-gray-200 dark:border-vindex-border h-8 w-8 p-0 rounded-lg"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteId(investment.id)}
                                className="hover:bg-red-50 dark:hover:bg-vindex-danger/20 hover:text-red-600 dark:hover:text-vindex-danger hover:border-red-200 dark:hover:border-vindex-danger/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-vindex-border h-8 w-8 p-0 rounded-lg"
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description="Tem certeza que deseja excluir este investimento? O valor investido será devolvido à conta de origem, se houver."
        onConfirm={() => handleDelete(deleteId)}
      />
    </div>
  );
};

export default Investimentos;