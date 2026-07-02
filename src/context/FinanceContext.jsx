import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { mockData } from '@/utils/mockData';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { isCryptoCurrency } from '@/utils/calculations';
import { validateCreditCardAccount } from '@/utils/accountValidation';
import { sanitizeUserInput } from '@/utils/securityUtils';
import i18n from '@/i18n';

const FinanceContext = createContext();

const mapInvestment = (row) => ({
  ...row,
  investedAmount: row.invested_amount,
  currentAmount: row.current_amount,
  purchaseDate: row.purchase_date,
  accountId: row.account_id,
});

const mapGoal = (row) => ({
  ...row,
  targetAmount: row.target_amount,
  contributionValue: row.contribution_value,
  periodFrequency: row.period_frequency,
  accountReservations: row.account_reservations || [],
});


export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const { rates: fetchedExchangeRates, fetchRates, isLoading: isRatesLoading } = useExchangeRate();
  
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [parcels, setParcels] = useState([]); 
  const [goals, setGoals] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [inflationHistory, setInflationHistory] = useState(mockData.inflationHistory || []);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState({
    theme: 'dark',
    currency: 'BRL',
    language: 'pt-BR',
    transactions_view_preference: 'list',
    categories_period_preference: 'monthly',
    accounts_view_preference: 'card'
  });
  
  const [accountBalances, setAccountBalances] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const fetchAllData = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);

    try {
      const [
        { data: transData, error: transError },
        { data: accData, error: accError },
        { data: catData, error: catError },
        { data: faturaData, error: faturaError },
        { data: settingsData, error: settingsError },
        { data: recurringData, error: recurringError },
        { data: parcelsData, error: parcelsError },
        { data: txTypesData },
        { data: invData, error: invError },
        { data: balancesData },
        { data: goalsData, error: goalsError }
      ] = await Promise.all([
        supabase.from('transactions').select(`*, categories ( id, name, color, icon ), account:accounts!fk_transacoes_conta ( id, name, type, color, currency, crypto_symbol ), destination_account:accounts!fk_transacoes_conta_destino ( id, name, type, currency, crypto_symbol ), invoices(id, invoice_number)`).eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('accounts').select('id, user_id, name, type, bank, balance, color, created_at, icon, account_subtype, credit_limit, closing_date, due_date, investment_type, expected_return, reload_value, reload_date, total_amount, interest_rate, term_months, amortization_type, holders, initial_balance, currency, crypto_symbol').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*, account:accounts(name)').eq('user_id', user.id).order('opening_date', { ascending: false }),
        supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('recurring_items').select('*, categories(name, color)').eq('user_id', user.id).order('next_date', { ascending: true }),
        supabase.from('recurring_installments').select('*').eq('user_id', user.id),
        supabase.from('transaction_types').select('*'),
        supabase.from('investments').select('*').eq('user_id', user.id).order('purchase_date', { ascending: false }),
        supabase.rpc('get_account_balances'),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (transError) console.error("Error fetching transactions:", transError);
      if (accError) console.error("Error fetching accounts:", accError);
      if (catError) console.error("Error fetching categories:", catError);
      if (faturaError) console.error("Error fetching faturas:", faturaError);
      if (settingsError && settingsError.code !== 'PGRST116') console.error("Error fetching settings:", settingsError);
      if (recurringError) console.error("Error fetching recurring:", recurringError);
      if (parcelsError) console.error("Error fetching parcels:", parcelsError);
      if (invError) console.error("Error fetching investments:", invError);
      if (goalsError) console.error("Error fetching goals:", goalsError);

      setTransactions(transData || []);
      setAccounts(accData || []);
      setCategories(catData || []);
      setInvoices(faturaData || []);
      setRecurring(recurringData || []);
      setParcels(parcelsData || []);
      setTransactionTypes(txTypesData || []);
      setInvestments((invData || []).map(mapInvestment));
      setGoals((goalsData || []).map(mapGoal));
      if (balancesData) {
        setAccountBalances(Object.fromEntries(balancesData.map(b => [b.account_id, b.balance])));
      }

      if (settingsData) {
        setSettings(prev => ({ ...prev, ...settingsData }));
      }

      const usedCurrencies = [...new Set((accData || []).map(a => a.currency).filter(c => c && c !== 'BRL' && !isCryptoCurrency(c)))];
      if (usedCurrencies.length > 0) {
        fetchRates(usedCurrencies);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id && session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches all user data from Supabase when auth state changes; setIsLoading(true) runs before the first await, the standard data-fetching pattern.
      fetchAllData();
    }
  }, [user, session]);

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language]);

  const fetchRecurring = async () => {
    if (!user) return;
    const { data } = await supabase.from('recurring_items').select('*, categories(name, color)').eq('user_id', user.id).order('next_date', { ascending: true });
    if (data) setRecurring(data);
  };

  const fetchParcels = async () => {
    if (!user) return;
    const { data } = await supabase.from('recurring_installments').select('*').eq('user_id', user.id);
    if (data) setParcels(data);
  };

  const refreshAccountBalances = async () => {
    const { data } = await supabase.rpc('get_account_balances');
    if (data) setAccountBalances(Object.fromEntries(data.map(b => [b.account_id, b.balance])));
  };

  const saveSettings = async (newSettings) => {
    if (!user || !user.id) return;
    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();
      
      let res;
      if (existing) {
        res = await supabase.from('settings').update(newSettings).eq('user_id', user.id).select().single();
      } else {
        res = await supabase.from('settings').insert({ user_id: user.id, ...newSettings }).select().single();
      }

      if (res.error) throw res.error;
      return res.data;
    } catch (error) {
      console.error("Error saving settings:", error);
      // Revert optimistic update on failure would require saving previous state, but we throw for now
      throw error;
    }
  };

  const refreshExchangeRates = async () => {
    const usedCurrencies = [...new Set(accounts.map(a => a.currency).filter(c => c && c !== 'BRL' && !isCryptoCurrency(c)))];
    if (usedCurrencies.length > 0) {
      await fetchRates(usedCurrencies);
      toast({ title: "Cotações atualizadas" });
    }
  };

  const combinedExchangeRates = useMemo(() => {
    const rates = { ...fetchedExchangeRates };
    accounts.forEach(acc => {
      if (isCryptoCurrency(acc.currency) && acc.expected_return) {
        rates[acc.currency] = Number(acc.expected_return);
      }
    });
    return rates;
  }, [fetchedExchangeRates, accounts]);

  const calculatedAccounts = useMemo(() => {
    return accounts.map(acc => ({
      ...acc,
      balance: accountBalances[acc.id] ?? acc.initial_balance ?? 0
    }));
  }, [accounts, accountBalances]);

  // Fatura Operations
  const fetchInvoices = async () => {
    if (!user || !user.id) return;
    const { data } = await supabase.from('invoices').select('*, account:accounts(name)').eq('user_id', user.id).order('opening_date', { ascending: false });
    if (data) setInvoices(data);
  };

  const createInvoice = async (faturaData) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    try {
      const payload = {
        ...faturaData,
        user_id: user.id,
        ...(faturaData.invoice_number && { invoice_number: sanitizeUserInput(faturaData.invoice_number) }),
      };
      const { data, error } = await supabase.from('invoices').insert(payload).select('*, account:accounts(name)').single();
      if (error) throw error;
      setInvoices(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error creating fatura:", error);
      throw error;
    }
  };

  // Compras da Fatura Operations
  const fetchInvoiceItems = async (faturaId) => {
    if (!user || !user.id) return [];
    const { data } = await supabase.from('invoice_items').select('*, categories(name, color)').eq('invoice_id', faturaId).eq('user_id', user.id).order('data', { ascending: false });
    return data || [];
  };

  const createInvoiceItem = async (payload) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from('invoice_items')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateInvoiceItem = async (id, payload) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from('invoice_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const deleteInvoiceItem = async (id) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return true;
  };

  // Account Operations
  const createAccount = async (accountData) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    
    const validation = validateCreditCardAccount(accountData);
    if (!validation.isValid) {
      toast({ title: "Erro de Validação", description: validation.error, variant: "destructive" });
      throw new Error(validation.error);
    }
    
    try {
      const payload = {
        ...accountData,
        user_id: user.id,
        name: sanitizeUserInput(accountData.name),
        ...(accountData.bank && { bank: sanitizeUserInput(accountData.bank) }),
      };

      const { data, error } = await supabase.from('accounts').insert(payload).select().single();

      if (error) throw error;
      setAccounts(prev => [...prev, data]);
      setAccountBalances(prev => ({ ...prev, [data.id]: Number(data.initial_balance || 0) }));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const updateAccount = async (id, accountData) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    
    const validation = validateCreditCardAccount(accountData);
    if (!validation.isValid) {
      toast({ title: "Erro de Validação", description: validation.error, variant: "destructive" });
      throw new Error(validation.error);
    }
    
    try {
      const sanitized = {
        ...accountData,
        name: sanitizeUserInput(accountData.name),
        ...(accountData.bank && { bank: sanitizeUserInput(accountData.bank) }),
      };
      const { data, error } = await supabase.from('accounts').update(sanitized).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      setAccounts(prev => prev.map(acc => acc.id === id ? data : acc));
      refreshAccountBalances();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const removeAccount = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setAccounts(prev => prev.filter(a => a.id !== id));
    return true;
  };

  // Category Operations
  const addCategory = async (categoryData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('categories').insert({ ...categoryData, name: sanitizeUserInput(categoryData.name), user_id: user.id }).select().single();
    if (error) throw error;
    setCategories(prev => [...prev, data]);
    return data;
  };
  
  const updateCategory = async (id, categoryData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('categories').update({ ...categoryData, name: sanitizeUserInput(categoryData.name) }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };
  
  const deleteCategory = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Recurring Operations
  const addRecurring = async (data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const statusStr = typeof data.status === 'boolean'
      ? (data.status ? 'active' : 'inactive')
      : (data.status || 'active');
    const { data: result, error } = await supabase.functions.invoke('create-recurrence', {
      body: {
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        start_date: data.nextDate,
        status: statusStr,
        category_id: data.category_id || null,
        recurrence_type: data.recurrence_type,
        installment_count: data.installment_count || null,
        user_id: user.id
      }
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    await fetchRecurring();
    if (result?.firstTransaction) setTransactions(prev => [result.firstTransaction, ...prev]);
    if (data.recurrence_type === 'installments') await fetchParcels();
    return result;
  };

  const updateRecurring = async (id, data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const statusStr = typeof data.status === 'boolean'
      ? (data.status ? 'active' : 'inactive')
      : (data.status || 'active');
    const payload = {
      description: sanitizeUserInput(data.description),
      amount: data.amount,
      frequency: data.frequency,
      next_date: data.nextDate || data.next_date,
      status: statusStr,
      category_id: data.category_id || null,
      recurrence_type: data.recurrence_type,
      installment_count: data.installment_count || null
    };
    const { data: updated, error } = await supabase.from('recurring_items').update(payload).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    setRecurring(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const deleteRecurring = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('recurring_items').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setRecurring(prev => prev.filter(r => r.id !== id));
    setParcels(prev => prev.filter(p => p.recurring_item_id !== id));
    return true;
  };

  const payParcel = async (parcelId) => {
    if (!user) throw new Error("Usuário não autenticado");
    const parcel = parcels.find(p => p.id === parcelId);
    if (!parcel) throw new Error("Parcela não encontrada");
    const today = new Date().toISOString().slice(0, 10);
    const { data: updated, error } = await supabase.from('recurring_installments').update({ status: 'paid', paid_date: today }).eq('id', parcelId).eq('user_id', user.id).select().single();
    if (error) throw error;
    const updatedParcels = parcels.map(p => p.id === parcelId ? updated : p);
    setParcels(updatedParcels);
    const remaining = updatedParcels.filter(p => p.recurring_item_id === parcel.recurring_item_id && !p.paid_date).sort((a, b) => a.parcel_number - b.parcel_number);
    if (remaining.length === 0) {
      await supabase.from('recurring_items').update({ status: 'inactive' }).eq('id', parcel.recurring_item_id).eq('user_id', user.id);
      setRecurring(prev => prev.map(r => r.id === parcel.recurring_item_id ? { ...r, status: 'inactive' } : r));
    } else {
      await supabase.from('recurring_items').update({ next_date: remaining[0].due_date }).eq('id', parcel.recurring_item_id).eq('user_id', user.id);
      setRecurring(prev => prev.map(r => r.id === parcel.recurring_item_id ? { ...r, next_date: remaining[0].due_date } : r));
    }
    return updated;
  };

  const processRecurring = async (recurringItemId) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: result, error } = await supabase.functions.invoke('process-recurring-transaction', {
      body: { recurringId: recurringItemId }
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    setRecurring(prev => prev.map(r => r.id === recurringItemId ? { ...r, next_date: result.nextDate } : r));
    if (result?.transaction) {
      const { data: tx } = await supabase.from('transactions')
        .select('*, categories(*), account:accounts!fk_transacoes_conta(*), destination_account:accounts!fk_transacoes_conta_destino(*), invoices(id, invoice_number)')
        .eq('id', result.transactionId)
        .single();
      if (tx) setTransactions(prev => [tx, ...prev]);
    }
    await refreshAccountBalances();
    return result;
  };

  // Investment Operations
  const addInvestment = async (data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: row, error } = await supabase.from('investments').insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      subtype: data.subtype || null,
      account_id: data.accountId || null,
      invested_amount: data.investedAmount,
      current_amount: data.currentAmount,
      purchase_date: data.purchaseDate,
    }).select().single();
    if (error) throw error;
    setInvestments(prev => [mapInvestment(row), ...prev]);
    return mapInvestment(row);
  };

  const updateInvestment = async (id, data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: row, error } = await supabase.from('investments').update({
      name: data.name,
      type: data.type,
      subtype: data.subtype || null,
      account_id: data.accountId || null,
      invested_amount: data.investedAmount,
      current_amount: data.currentAmount,
      purchase_date: data.purchaseDate,
    }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    setInvestments(prev => prev.map(inv => inv.id === id ? mapInvestment(row) : inv));
    return mapInvestment(row);
  };

  const deleteInvestment = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('investments').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    return true;
  };

  // Goal Operations
  const buildGoalPayload = (data) => {
    const accountReservations = data.accountReservations || [];
    const reservedAmount = accountReservations.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    return {
      name: sanitizeUserInput(data.name),
      goal_type: data.goal_type,
      target_amount: Number(data.targetAmount) || 0,
      contribution_value: Number(data.contributionValue) || 0,
      period_frequency: data.periodFrequency || 'monthly',
      accumulated_amount: Number(data.accumulated_amount) || 0,
      reserved_amount: reservedAmount,
      deadline: data.deadline || null,
      description: data.description ? sanitizeUserInput(data.description) : null,
      color: data.color,
      icon: data.icon,
      account_reservations: accountReservations,
      reserved_account_id: accountReservations[0]?.account_id || null
    };
  };

  const addGoal = async (data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: row, error } = await supabase.from('goals').insert({
      user_id: user.id,
      ...buildGoalPayload(data)
    }).select().single();
    if (error) throw error;
    setGoals(prev => [mapGoal(row), ...prev]);
    return mapGoal(row);
  };

  const updateGoal = async (id, data) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data: row, error } = await supabase.from('goals').update(buildGoalPayload(data)).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    setGoals(prev => prev.map(g => g.id === id ? mapGoal(row) : g));
    return mapGoal(row);
  };

  const deleteGoal = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setGoals(prev => prev.filter(g => g.id !== id));
    return true;
  };

  // Transaction Operations
  const createTransaction = async (formData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { frequency, recurring_installment_count, ...txPayload } = formData;
    if (txPayload.description) txPayload.description = sanitizeUserInput(txPayload.description);
    if (txPayload.notes) txPayload.notes = sanitizeUserInput(txPayload.notes);

    if (txPayload.is_recurring && frequency) {
      // Delegate to edge function for atomic creation:
      // recurring_item + transaction + installments in a single server-side call.
      const { data: result, error } = await supabase.functions.invoke('create-recurrence', {
        body: {
          transaction: txPayload,
          frequency,
          recurrence_type: txPayload.recurring_type || 'subscription',
          installment_count: recurring_installment_count ? parseInt(recurring_installment_count) : null,
        }
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Fetch the created transaction with full joins for state update
      const { data: tx } = await supabase
        .from('transactions')
        .select('*, categories(*), account:accounts!fk_transacoes_conta(*), destination_account:accounts!fk_transacoes_conta_destino(*), invoices(id, invoice_number)')
        .eq('id', result.firstTransaction.id)
        .single();

      if (tx) setTransactions(prev => [tx, ...prev]);
      if (result.recurrence) setRecurring(prev => [...prev, result.recurrence]);
      if (recurring_installment_count) await fetchParcels();
      refreshAccountBalances();
      return tx || result.firstTransaction;
    }

    const { data, error } = await supabase.from('transactions').insert({ ...txPayload, user_id: user.id })
      .select('*, categories(*), account:accounts!fk_transacoes_conta(*), destination_account:accounts!fk_transacoes_conta_destino(*), invoices(id, invoice_number)').single();
    if (error) throw error;
    setTransactions(prev => [data, ...prev]);
    refreshAccountBalances();
    return data;
  };

  const updateTransaction = async (id, formData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const sanitized = { ...formData };
    if (sanitized.description) sanitized.description = sanitizeUserInput(sanitized.description);
    if (sanitized.notes) sanitized.notes = sanitizeUserInput(sanitized.notes);
    const { data, error } = await supabase.from('transactions').update(sanitized).eq('id', id).eq('user_id', user.id)
      .select('*, categories(*), account:accounts!fk_transacoes_conta(*), destination_account:accounts!fk_transacoes_conta_destino(*), invoices(id, invoice_number)').single();
    if (error) throw error;
    setTransactions(prev => prev.map(t => t.id === id ? data : t));
    refreshAccountBalances();
    return data;
  };

  const deleteTransaction = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
    refreshAccountBalances();
    return true;
  };

  const value = {
    transactions,
    accounts: calculatedAccounts,
    categories,
    investments,
    recurring,
    parcels,
    goals,
    transactionTypes,
    inflationHistory,
    invoices,
    settings,
    setSettings,
    isLoading,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu,
    exchangeRates: combinedExchangeRates,
    isRatesLoading,
    refreshExchangeRates,
    fetchAllData,
    fetchInvoices,
    createInvoice,
    fetchInvoiceItems,
    createInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
    createAccount,
    updateAccount,
    removeAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    saveSettings,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    payParcel,
    processRecurring,
    fetchRecurring,
    fetchParcels,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addGoal,
    updateGoal,
    deleteGoal
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};