import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { mockData } from '@/utils/mockData';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { calculateAccountBalance, isCryptoCurrency } from '@/utils/calculations';
import { validateCreditCardAccount } from '@/utils/accountValidation';

const FinanceContext = createContext();

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
  const [faturas, setFaturas] = useState([]);
  const [settings, setSettings] = useState({
    theme: 'dark',
    currency: 'BRL',
    language: 'pt-BR',
    transacoes_view_preference: 'list',
    categorias_period_preference: 'mensal',
    contas_view_preference: 'card'
  });
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.id && session) {
      fetchAllData();
    }
  }, [user, session]);

  const fetchAllData = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    
    try {
      const [
        { data: transData, error: transError },
        { data: accData, error: accError },
        { data: catData, error: catError },
        { data: faturaData, error: faturaError },
        { data: settingsData, error: settingsError }
      ] = await Promise.all([
        supabase.from('transactions').select(`*, categories ( id, name, color, icon ), contas:accounts!fk_transacoes_conta ( id, name, type, color, currency, crypto_symbol ), conta_destino:accounts!fk_transacoes_conta_destino ( id, name, type, currency, crypto_symbol ), invoices(id, numero_fatura)`).eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('accounts').select('id, user_id, name, type, bank, balance, color, created_at, icon, account_subtype, credit_limit, closing_date, due_date, investment_type, expected_return, reload_value, reload_date, total_amount, interest_rate, term_months, amortization_type, holders, initial_balance, currency, crypto_symbol').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*, accounts(name)').eq('user_id', user.id).order('data_abertura', { ascending: false }),
        supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (transError) console.error("Error fetching transactions:", transError);
      if (accError) console.error("Error fetching accounts:", accError);
      if (catError) console.error("Error fetching categories:", catError);
      if (faturaError) console.error("Error fetching faturas:", faturaError);
      if (settingsError && settingsError.code !== 'PGRST116') console.error("Error fetching settings:", settingsError);

      setTransactions(transData || []);
      setAccounts(accData || []);
      setCategories(catData || []);
      setFaturas(faturaData || []);
      
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
      balance: calculateAccountBalance(transactions, acc.id, acc.initial_balance || 0)
    }));
  }, [accounts, transactions]);

  // Fatura Operations
  const fetchFaturas = async () => {
    if (!user || !user.id) return;
    const { data } = await supabase.from('invoices').select('*, accounts(name)').eq('user_id', user.id).order('data_abertura', { ascending: false });
    if (data) setFaturas(data);
  };

  const createFatura = async (faturaData) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    try {
      const payload = { ...faturaData, user_id: user.id };
      const { data, error } = await supabase.from('invoices').insert(payload).select('*, accounts(name)').single();
      if (error) throw error;
      setFaturas(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error creating fatura:", error);
      throw error;
    }
  };

  // Compras da Fatura Operations
  const fetchComprasFatura = async (faturaId) => {
    if (!user || !user.id) return [];
    const { data } = await supabase.from('invoice_items').select('*, categories(name, color)').eq('fatura_id', faturaId).eq('user_id', user.id).order('data', { ascending: false });
    return data || [];
  };

  const createCompraFatura = async (payload) => {
    if (!user || !user.id) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from('invoice_items')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateCompraFatura = async (id, payload) => {
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

  const deleteCompraFatura = async (id) => {
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
        user_id: user.id
      };
      
      const { data, error } = await supabase.from('accounts').insert(payload).select().single();
        
      if (error) throw error;
      setAccounts(prev => [...prev, data]);
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
      const { data, error } = await supabase.from('accounts').update(accountData).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      setAccounts(prev => prev.map(acc => acc.id === id ? data : acc));
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
  const createCategory = async (categoryData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('categories').insert({ ...categoryData, user_id: user.id }).select().single();
    if (error) throw error;
    setCategories(prev => [...prev, data]);
    return data;
  };
  
  const updateCategory = async (id, categoryData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('categories').update(categoryData).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };
  
  const removeCategory = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Transaction Operations
  const createTransaction = async (formData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('transactions').insert({ ...formData, user_id: user.id })
      .select('*, categories(*), contas:accounts!fk_transacoes_conta(*), conta_destino:accounts!fk_transacoes_conta_destino(*), invoices(id, numero_fatura)').single();
    if (error) throw error;
    setTransactions(prev => [data, ...prev]);
    return data;
  };

  const updateTransaction = async (id, formData) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase.from('transactions').update(formData).eq('id', id).eq('user_id', user.id)
      .select('*, categories(*), contas:accounts!fk_transacoes_conta(*), conta_destino:accounts!fk_transacoes_conta_destino(*), invoices(id, numero_fatura)').single();
    if (error) throw error;
    setTransactions(prev => prev.map(t => t.id === id ? data : t));
    return data;
  };

  const deleteTransaction = async (id) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
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
    faturas,
    settings,
    setSettings,
    isLoading,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    exchangeRates: combinedExchangeRates,
    isRatesLoading,
    refreshExchangeRates,
    fetchAllData,
    fetchFaturas,
    createFatura,
    fetchComprasFatura,
    createCompraFatura,
    updateCompraFatura,
    deleteCompraFatura,
    createAccount,
    updateAccount,
    removeAccount,
    createCategory,
    updateCategory,
    removeCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    saveSettings
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};