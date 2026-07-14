import { PRIMARY, PRIMARY_HOVER, DANGER, SUCCESS } from '@/utils/colors';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Edit as Edit2, TrashAlt as Trash2, TrendingUp, TrendingDown } from '@/components/BxIcon';
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
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import ViewToggle from '@/components/ui/ViewToggle';
import NumberInput from '@/components/ui/NumberInput';
import InvestmentsChart from '@/components/InvestmentsChart';
import { useSortableList } from '@/hooks/useSortableList';
import InvestmentTypeSelector from '@/components/InvestmentTypeSelector';
import InvestmentSubtypeSelector from '@/components/InvestmentSubtypeSelector';
import InvestimentoCard from '@/components/cards/InvestmentCard';
import { getDateFilterDefaults, getDateFilterRange } from '@/utils/dateFilter';
import { formatChartDate } from '@/utils/chartDateFormat';
import { INVESTMENT_TYPES } from '@/utils/investmentTypes';

const Investments = () => {
  const { t, i18n } = useTranslation();
  const { investments, accounts, addInvestment, updateInvestment, deleteInvestment, settings, saveSettings } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Sorting Hook
  const { items: sortedInvestments, requestSort, sortConfig } = useSortableList(investments);

  // Chart Controls
  const dateFilter = settings.investments_date_filter || getDateFilterDefaults();
  const setDateFilter = (filter) => saveSettings({ investments_date_filter: filter });

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
    label: t('investments.funding_account_option', { name: acc.name, balance: formatCurrency(acc.balance) }),
    value: acc.id
  }));
  fundingAccounts.unshift({ label: t('investments.source_account_placeholder'), value: "" });

  const chartData = useMemo(() => {
    const now = new Date();

    // 'all' (no filter type) falls back to the earliest purchase date on record.
    const earliestPurchase = investments.reduce((earliest, inv) => {
        const d = new Date(inv.purchaseDate);
        return !earliest || d < earliest ? d : earliest;
    }, null);
    const fallbackStart = earliestPurchase ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { startDate, endDate } = getDateFilterRange(dateFilter, fallbackStart);
    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const days = [];
    const pointsCount = 30; // Approx points for smoothness
    const totalTime = Math.max(endDate.getTime() - startDate.getTime(), 0);
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
            xKey: i,
            displayDate: formatChartDate(currentDate, i18n.language, totalDays),
            invested: dailyTotalInvested,
            currentValue: dailyTotalCurrent,
            profitability: dailyTotalInvested > 0 ? ((dailyTotalCurrent - dailyTotalInvested) / dailyTotalInvested) * 100 : 0
        });
    }

    return days;
  }, [investments, dateFilter, i18n.language]);

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
            toast({ title: t('investments.updated_success') });
        } else {
            await addInvestment(investmentData);
            toast({ title: t('investments.created_success') });
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
    toast({ title: t('investments.deleted_success') });
  };
  


  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Investments</title>
        <meta name="description" content={t('investments.subtitle')} />
      </Helmet>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('investments.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300">{t('investments.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            
            <DateFilterSelect value={dateFilter} onChange={setDateFilter} />

            <ViewToggle value={viewMode} onChange={setViewMode} className="h-[42px]" />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="text-gray-900 rounded-lg flex-1 sm:flex-none whitespace-nowrap border-none font-semibold shadow-md h-[42px]"
                style={{ backgroundColor: PRIMARY }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY}
              >
                <Plus size={20} className="mr-2" />
                <span className="hidden sm:inline">{t('investments.new')}</span>
                <span className="sm:hidden">{t('common.new')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingInvestment ? t('investments.edit') : t('investments.new')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('investments.asset_name')}</Label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-gray-100 hover:border-primary focus:border-primary outline-none"
                    placeholder={t('investments.name_placeholder')}
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
                      label={t('investments.source_account')}
                      id="accountId"
                      value={formData.accountId}
                      options={fundingAccounts}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {t('investments.source_account_hint')}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="investedAmount">{t('investments.invested_amount')}</Label>
                    <NumberInput
                        id="investedAmount"
                        value={formData.investedAmount}
                        onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                        step={0.01}
                    />
                    </div>
                    <div>
                    <Label htmlFor="currentAmount">{t('investments.current_amount')}</Label>
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
                    label={t('investments.purchase_date')}
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
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
                    {editingInvestment ? t('common.update') : t('common.create')}
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
      
      {/* Development Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 w-5 h-5 flex-shrink-0" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
          {t('investments.in_development')}
        </p>
      </div>

      {/* Chart Section - Always Visible */}
      <div className="animate-in fade-in zoom-in-95 duration-300">
         <InvestmentsChart
             data={chartData}
         />
      </div>

      {/* Content Area: Table or Card Grid */}
      {sortedInvestments.length === 0 ? (
        <EmptyState icon={TrendingUp} message={t('investments.empty')} buttonLabel={t('investments.create_first')} onButtonClick={() => { resetForm(); setIsDialogOpen(true); }} />
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
                <table className="w-full min-w-[900px] table-fixed">
                  <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                    <tr>
                      <SortableHeader label={t('investments.col_name')} column="name" sortConfig={sortConfig} onSort={requestSort} className="w-[20%]" />
                      <SortableHeader label={t('investments.col_type')} column="type" sortConfig={sortConfig} onSort={requestSort} className="w-[11%]" />
                      <SortableHeader label={t('investments.col_subtype')} column="subtype" sortConfig={sortConfig} onSort={requestSort} className="w-[11%]" />
                      <SortableHeader label={t('investments.col_invested')} column="investedAmount" sortConfig={sortConfig} onSort={requestSort} className="w-[13%]" />
                      <SortableHeader label={t('investments.col_current')} column="currentAmount" sortConfig={sortConfig} onSort={requestSort} className="w-[13%]" />
                      <th className="px-6 py-3 w-[11%] text-left font-medium text-gray-700 dark:text-gray-300">{t('investments.col_return')}</th>
                      <SortableHeader label={t('investments.col_purchase_date')} column="purchaseDate" sortConfig={sortConfig} onSort={requestSort} className="w-[13%]" />
                      <th className="px-6 py-3 w-[8%] text-right font-medium text-gray-700 dark:text-gray-300">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                    {sortedInvestments.map((investment) => {
                      const returnPercent = calculateInvestmentReturn(investment.investedAmount, investment.currentAmount);
                      const isProfit = returnPercent >= 0;

                      return (
                        <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium truncate" title={investment.name}>{investment.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 truncate">{investment.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 truncate">{investment.subtype || '-'}</td>
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
                            {new Date(investment.purchaseDate).toLocaleDateString(i18n.language)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(investment)}
                                className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent"
                                style={{ borderColor: PRIMARY, color: PRIMARY }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteId(investment.id)}
                                className="h-8 w-8 p-0 rounded-lg border transition-colors bg-transparent"
                                style={{ borderColor: DANGER, color: DANGER }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                              >
                                <Trash2 className="h-4 w-4" />
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
        description={t('investments.delete_confirm')}
        onConfirm={() => handleDelete(deleteId)}
      />
    </div>
  );
};

export default Investments;