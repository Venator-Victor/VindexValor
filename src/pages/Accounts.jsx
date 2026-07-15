import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER } from '@/utils/colors';
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import BxIcon, { Wallet as WalletCards, Plus, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import AccountSelectionBar from '@/components/AccountSelectionBar';
import { useToast } from '@/components/ui/use-toast';
import { calculateAssetsLiabilities, formatCurrencyWithSymbol } from '@/utils/calculations';
import ViewToggle from '@/components/ui/ViewToggle';
import AssetLiabilityChart from '@/components/AssetLiabilityChart';
import AccountSuggestionsModal from '@/components/AccountSuggestionsModal';
import AccountModal from '@/components/AccountModal';
import AccountDetailModal from '@/components/AccountDetailModal';
import { useSortableList } from '@/hooks/useSortableList';
import DateFilterSelect from '@/components/ui/DateFilterSelect';
import { getDateFilterDefaults } from '@/utils/dateFilter';
import { ACCOUNT_TYPE_LABEL_KEYS } from '@/utils/accountMappings';

const Accounts = () => {
  const { t } = useTranslation();
  const getAccountTypeLabel = (type) => t(ACCOUNT_TYPE_LABEL_KEYS[type] || type);
  const { accounts, transactions, removeAccount: deleteAccount, settings, saveSettings } = useFinance();
  const { toast } = useToast();
  
  // Balance/initial are two different underlying fields depending on account type
  // (credit cards track current invoice/available limit instead of balance/initial
  // balance) — these mirror exactly what each column actually displays, so sorting
  // matches what's on screen regardless of which field backs it for a given row.
  const sortableAccounts = accounts.map(acc => {
    const isCreditCard = acc.type === 'credit_card' || acc.account_subtype === 'credit_card';
    return {
      ...acc,
      sortBalance: isCreditCard ? Number(acc.current_fatura_value || 0) : Number(acc.balance || 0),
      sortInitial: isCreditCard ? Number(acc.available_limit || 0) : Number(acc.initial_balance || 0),
    };
  });
  const { items: sortedAccounts, requestSort, sortConfig } = useSortableList(sortableAccounts);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [accountInitialData, setAccountInitialData] = useState(null);
  const dateFilter = settings.accounts_date_filter || getDateFilterDefaults();
  const setDateFilter = (filter) => saveSettings({ accounts_date_filter: filter });
  const [selectedDetailAccount, setSelectedDetailAccount] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === sortedAccounts.length ? [] : sortedAccounts.map(a => a.id));
  };

  const [viewMode, setViewMode] = useState('card');

  // Sync view mode when the persisted preference loads/changes (adjust state during render, per React docs).
  const [syncedViewPreference, setSyncedViewPreference] = useState(undefined);
  if (settings?.accounts_view_preference && settings.accounts_view_preference !== syncedViewPreference) {
    setSyncedViewPreference(settings.accounts_view_preference);
    setViewMode(settings.accounts_view_preference);
  }

  
  const { assets: totalAssets, liabilities: totalLiabilities } = useMemo(() => {
     return calculateAssetsLiabilities(transactions, accounts);
  }, [transactions, accounts]);

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    try {
      if (saveSettings) {
        await saveSettings({ accounts_view_preference: mode });
      } else {
        toast({ title: t('common.warning'), description: t('accounts.save_pref_unavailable_desc'), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t('accounts.save_pref_error_title'), description: error.message, variant: "destructive" });
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
    setSelectedDetailAccount(null);
  };

  const handleCardClick = (account) => {
    setSelectedDetailAccount(account);
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
        <title>VindexValor - {t('accounts.title')}</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('accounts.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300">{t('accounts.subtitle')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <DateFilterSelect value={dateFilter} onChange={setDateFilter} />

            <div className="flex items-center gap-4">
                <ViewToggle value={viewMode} onChange={handleViewModeChange} className="h-[42px]" />

                <Button
                    onClick={handleOpenSuggestions}
                    className="border-none text-gray-900 rounded-lg whitespace-nowrap h-[42px]"
                    style={{ backgroundColor: PRIMARY }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY}
                >
                    <Plus size={20} className="mr-2" />
                    <span className="hidden sm:inline">{t('accounts.new')}</span>
                    <span className="sm:hidden">{t('accounts.new_short')}</span>
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
        dateFilter={dateFilter}
      />

      {sortedAccounts.length === 0 ? (
        <EmptyState icon={WalletCards} message={t('accounts.empty')} buttonLabel={t('accounts.create_first')} onButtonClick={handleOpenSuggestions} />
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
                  onClick={() => handleCardClick(account)}
                  className="bg-white dark:bg-vindex-card rounded-xl p-4 border border-gray-200 dark:border-vindex-border transition-shadow shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
                  onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border shrink-0"
                        style={{ backgroundColor: account.color + '22', borderColor: account.color + '44' }}
                      >
                        <BxIcon iconClass={`bx ${account.icon || 'bx-wallet'}`} size={20} style={{ color: account.color }} />
                      </div>
                      <div className="text-left flex-grow overflow-hidden">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 leading-tight break-words" title={account.name}>
                          {account.name} {account.currency && `(${account.currency})`}
                        </h3>
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {account.type === 'crypto' && account.currency ? `${getAccountTypeLabel(account.type)} (${account.currency})` : getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-3">
                    {t('accounts.bank_institution')}: <span className="text-gray-900 dark:text-gray-50 font-medium">{account.bank || '-'}</span>
                  </p>

                  {account.type === 'credit_card' || account.account_subtype === 'credit_card' ? (
                    <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
                      <div className="text-left">
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('accounts.current_invoice')}</span>
                        <span className="text-lg font-bold crypto-symbol block" style={{ color: DANGER }}>
                          {formatCurrencyWithSymbol(account.current_fatura_value || 0, account.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('accounts.available_limit')}</span>
                         <span className="text-lg font-bold text-gray-900 dark:text-gray-50 crypto-symbol block">
                           {formatCurrencyWithSymbol(account.available_limit || 0, account.currency)}
                         </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-3 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-100 dark:border-vindex-border flex items-center justify-between mt-3">
                      <div className="text-left">
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('accounts.current_balance')}</span>
                        <span className="text-lg font-bold crypto-symbol block" style={{ color: account.balance >= 0 ? SUCCESS : DANGER }}>
                          {formatCurrencyWithSymbol(account.balance, account.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] text-gray-700 dark:text-gray-300 block">{t('accounts.initial_balance')}</span>
                         <span className="text-lg font-bold text-gray-900 dark:text-gray-50 crypto-symbol block">
                           {formatCurrencyWithSymbol(account.initial_balance, account.currency)}
                         </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                         <tr>
                            <th className="px-6 py-3 w-[5%]">
                               <Checkbox
                                  checked={sortedAccounts.length > 0 && selectedIds.length === sortedAccounts.length}
                                  onCheckedChange={toggleSelectAll}
                               />
                            </th>
                            <SortableHeader label={t('accounts.col_account')} column="name" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label={t('accounts.col_type')} column="type" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label={t('accounts.col_bank')} column="bank" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label={t('accounts.col_balance')} column="sortBalance" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader label={t('accounts.col_initial')} column="sortInitial" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{t('accounts.col_actions')}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                         {sortedAccounts.map((account) => (
                            <tr key={account.id} onClick={() => handleCardClick(account)} className={`cursor-pointer transition-colors ${selectedIds.includes(account.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`} onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                               <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                     checked={selectedIds.includes(account.id)}
                                     onCheckedChange={() => toggleSelect(account.id)}
                                  />
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" 
                                          style={{ backgroundColor: account.color + '22', border: `1px solid ${account.color}` }}>
                                        <BxIcon iconClass={`bx ${account.icon || 'bx-wallet'}`} size={20} style={{ color: account.color }} />
                                     </div>
                                     <div className='flex flex-col'>
                                        <span className="font-medium text-gray-900 dark:text-gray-50">
                                          {account.name} {account.currency && `(${account.currency})`}
                                        </span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                  {account.type === 'crypto' && account.currency ? `${getAccountTypeLabel(account.type)} (${account.currency})` : getAccountTypeLabel(account.type)}
                               </td>
                               <td className="px-6 py-4 text-gray-900 dark:text-gray-50 font-medium">
                                  {account.bank || '-'}
                               </td>
                               <td className="px-6 py-4">
                                  {(account.type === 'credit_card' || account.account_subtype === 'credit_card') ? (
                                     <span className="font-bold crypto-symbol" style={{ color: DANGER }}>
                                       {formatCurrencyWithSymbol(account.current_fatura_value || 0, account.currency)}
                                     </span>
                                  ) : (
                                     <span className="font-bold crypto-symbol" style={{ color: account.balance >= 0 ? SUCCESS : DANGER }}>
                                        {formatCurrencyWithSymbol(account.balance, account.currency)}
                                     </span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-gray-600 dark:text-gray-400 crypto-symbol">
                                  {(account.type === 'credit_card' || account.account_subtype === 'credit_card') ? (
                                    <span>{formatCurrencyWithSymbol(account.available_limit || 0, account.currency)} {t('accounts.available_suffix')}</span>
                                  ) : (
                                    <span>{formatCurrencyWithSymbol(account.initial_balance, account.currency)}</span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                     <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); handleEdit(account); }}
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
                                        onClick={(e) => { e.stopPropagation(); setDeleteId(account.id); }}
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
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </>
      )}

      <AccountDetailModal
        isOpen={!!selectedDetailAccount}
        onClose={() => setSelectedDetailAccount(null)}
        account={selectedDetailAccount}
        transactions={transactions}
        onEdit={(account) => handleEdit(account)}
        onDelete={(id) => { setSelectedDetailAccount(null); setDeleteId(id); }}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description={t('accounts.delete_confirm')}
        onConfirm={() => handleDelete(deleteId)}
      />

      <AccountSelectionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
};

export default Accounts;