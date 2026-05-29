import { PRIMARY, PRIMARY_HOVER } from '@/utils/colors';
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { LayoutGrid, List as ListIcon, WalletCards, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/components/ui/use-toast';
import { calculateAssetsLiabilities, formatCurrencyWithSymbol } from '@/utils/calculations';
import SelectInput from '@/components/ui/SelectInput';
import AssetLiabilityChart from '@/components/AssetLiabilityChart';
import AccountSuggestionsModal from '@/components/AccountSuggestionsModal';
import AccountModal from '@/components/AccountModal';
import { useSortableList } from '@/hooks/useSortableList';

const Contas = () => {
  const { accounts, transactions, removeAccount: deleteAccount, settings, saveSettings } = useFinance();
  const { toast } = useToast();
  
  const { items: sortedAccounts, requestSort, sortConfig } = useSortableList(accounts);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [accountInitialData, setAccountInitialData] = useState(null);
  const [period, setPeriod] = useState('Mensal');
  const [showNetWorth, setShowNetWorth] = useState(false);
  
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    if (settings && settings.contas_view_preference) {
      setViewMode(settings.contas_view_preference);
    }
  }, [settings]);

  const periodOptions = [
    { label: "Diário", value: "Diário" },
    { label: "Semanal", value: "Semanal" },
    { label: "Quinzenal", value: "Quinzenal" },
    { label: "Mensal", value: "Mensal" },
    { label: "Trimestral", value: "Trimestral" },
    { label: "Semestral", value: "Semestral" },
    { label: "Anual", value: "Anual" }
  ];
  
  const { assets: totalAssets, liabilities: totalLiabilities } = useMemo(() => {
     return calculateAssetsLiabilities(transactions, accounts);
  }, [transactions, accounts]);

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    try {
      if (saveSettings) {
        await saveSettings({ contas_view_preference: mode });
        toast({ title: "Visualização atualizada", description: "Sua preferência foi salva com sucesso." });
      } else {
        toast({ title: "Aviso", description: "Função de salvar não disponível no contexto.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao salvar preferência", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setAccountInitialData(null);
    setIsAccountModalOpen(true);
  };

  const handleDelete = (id) => {
    deleteAccount(id);
    setDeleteId(null);
  };
  
  const handleOpenSuggestions = () => {
    setEditingAccount(null);
    setIsSuggestionsOpen(true);
  };

  const handleSuggestionSelect = (suggestion) => {
    setEditingAccount(null);
    setAccountInitialData(suggestion);
    setIsSuggestionsOpen(false);
    setIsAccountModalOpen(true);
  };

  const handleCreateCustom = () => {
    setEditingAccount(null);
    setAccountInitialData(null);
    setIsSuggestionsOpen(false);
    setIsAccountModalOpen(true);
  };
  


  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Helmet>
        <title>VindexValor - Contas</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Contas</h1>
          <p className="text-gray-700 dark:text-gray-300">Gerencie suas contas bancárias e carteiras de cripto</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="w-full sm:w-40">
                <SelectInput
                    value={period}
                    options={periodOptions}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300"
                />
            </div>

            <Button 
                onClick={() => setShowNetWorth(!showNetWorth)}
                variant="outline"
                className={`flex items-center gap-2 border-gray-200 dark:border-vindex-border ${
                    showNetWorth 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-vindex-card dark:text-gray-400 dark:hover:bg-vindex-bg'
                }`}
            >
                {showNetWorth ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:inline">Patrimônio Líquido</span>
                <span className="sm:hidden">Patrimônio</span>
            </Button>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1">
                <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    <ListIcon size={20} />
                </button>
                <button
                    onClick={() => handleViewModeChange('card')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                </div>
                
                <Button 
                    onClick={handleOpenSuggestions} 
                    className="border-none text-gray-900 rounded-lg whitespace-nowrap"
                    style={{ backgroundColor: PRIMARY }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY}
                >
                    <i className='bx bx-plus mr-2 text-xl'></i>
                    <span className="hidden sm:inline">Nova Conta</span>
                    <span className="sm:hidden">Nova</span>
                </Button>

                <AccountSuggestionsModal 
                    isOpen={isSuggestionsOpen}
                    onClose={() => setIsSuggestionsOpen(false)}
                    onSelect={handleSuggestionSelect}
                    onCreateCustom={handleCreateCustom}
                />

                <AccountModal 
                    isOpen={isAccountModalOpen}
                    onClose={() => setIsAccountModalOpen(false)}
                    accountToEdit={editingAccount}
                    initialData={accountInitialData}
                />
            </div>
        </div>
      </div>

      <AssetLiabilityChart 
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        filteredTransactions={transactions}
        showNetWorth={showNetWorth}
        selectedPeriod={period}
      />

      {sortedAccounts.length === 0 ? (
        <EmptyState icon={WalletCards} message="Você ainda não tem contas cadastradas." buttonLabel="Criar Primeira Conta" onButtonClick={handleOpenSuggestions} />
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAccounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border hover:border-gray-300 dark:hover:border-vindex-text/30 transition-all shadow-sm hover:shadow-md flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: account.color + '22', border: `1px solid ${account.color}` }}
                      >
                        <i className={`bx ${account.icon || 'bx-wallet'}`} style={{ color: account.color }}></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 line-clamp-1" title={account.name}>
                          {account.name} {account.currency && `(${account.currency})`}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {account.type === 'Criptomoeda' && account.currency ? `Criptomoeda (${account.currency})` : account.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Banco / Instituição</p>
                    <p className="text-gray-900 dark:text-gray-50 font-medium">{account.bank || '-'}</p>
                  </div>

                  {account.type === 'Cartão de Crédito' || account.account_subtype === 'credit_card' ? (
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Fatura Atual</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-vindex-danger crypto-symbol">
                          {formatCurrencyWithSymbol(account.current_fatura_value || 0, account.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-gray-500 mb-1">Limite Disp.</p>
                         <p className="text-sm text-gray-600 dark:text-gray-400 font-medium crypto-symbol">
                           {formatCurrencyWithSymbol(account.available_limit || 0, account.currency)}
                         </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Saldo Atual</p>
                        <p className={`text-2xl font-bold crypto-symbol ${account.balance >= 0 ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
                          {formatCurrencyWithSymbol(account.balance, account.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-gray-500 mb-1">Saldo Inicial</p>
                         <p className="text-sm text-gray-600 dark:text-gray-400 font-medium crypto-symbol">
                           {formatCurrencyWithSymbol(account.initial_balance, account.currency)}
                         </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-vindex-border mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(account)}
                      className="flex-1 hover:bg-gray-100 dark:hover:bg-vindex-border text-gray-700 dark:text-gray-300 border-gray-200 dark:border-vindex-border rounded-lg"
                    >
                      <i className='bx bx-pencil mr-1'></i>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(account.id)}
                      className="flex-1 hover:bg-red-50 dark:hover:bg-vindex-danger/20 hover:text-red-600 dark:hover:text-vindex-danger text-gray-700 dark:text-gray-300 border-gray-200 dark:border-vindex-border hover:border-red-200 dark:hover:border-vindex-danger/50 rounded-lg"
                    >
                      <i className='bx bx-trash mr-1'></i>
                      Excluir
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                         <tr>
                            <SortableHeader label="Conta" column="name" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label="Tipo" column="type" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Banco</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Saldo/Fatura Atual</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Inicial/Limite Disp.</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                         {sortedAccounts.map((account) => (
                            <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/50">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" 
                                          style={{ backgroundColor: account.color + '22', border: `1px solid ${account.color}` }}>
                                        <i className={`bx ${account.icon || 'bx-wallet'}`} style={{ color: account.color }}></i>
                                     </div>
                                     <div className='flex flex-col'>
                                        <span className="font-medium text-gray-900 dark:text-gray-50">
                                          {account.name} {account.currency && `(${account.currency})`}
                                        </span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                  {account.type === 'Criptomoeda' && account.currency ? `Criptomoeda (${account.currency})` : account.type}
                               </td>
                               <td className="px-6 py-4 text-gray-900 dark:text-gray-50 font-medium">
                                  {account.bank || '-'}
                               </td>
                               <td className="px-6 py-4">
                                  {(account.type === 'Cartão de Crédito' || account.account_subtype === 'credit_card') ? (
                                     <span className="font-bold text-red-600 dark:text-vindex-danger crypto-symbol">
                                       {formatCurrencyWithSymbol(account.current_fatura_value || 0, account.currency)}
                                     </span>
                                  ) : (
                                     <span className={`font-bold crypto-symbol ${account.balance >= 0 ? 'text-green-600 dark:text-vindex-success' : 'text-red-600 dark:text-vindex-danger'}`}>
                                        {formatCurrencyWithSymbol(account.balance, account.currency)}
                                     </span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-gray-600 dark:text-gray-400 crypto-symbol">
                                  {(account.type === 'Cartão de Crédito' || account.account_subtype === 'credit_card') ? (
                                    <span>{formatCurrencyWithSymbol(account.available_limit || 0, account.currency)} (Disp.)</span>
                                  ) : (
                                    <span>{formatCurrencyWithSymbol(account.initial_balance, account.currency)}</span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                     <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(account)}
                                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-vindex-border text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg"
                                     >
                                        <i className='bx bx-pencil text-lg'></i>
                                     </Button>
                                     <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeleteId(account.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-vindex-danger/20 text-gray-700 hover:text-red-600 dark:text-gray-400 dark:hover:text-vindex-danger rounded-lg"
                                     >
                                        <i className='bx bx-trash text-lg'></i>
                                     </Button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </>
      )}

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description="Tem certeza que deseja excluir esta conta?"
        onConfirm={() => handleDelete(deleteId)}
      />
    </div>
  );
};

export default Contas;