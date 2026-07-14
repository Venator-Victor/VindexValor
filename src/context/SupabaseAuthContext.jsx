import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // SUPABASE AUTHENTICATION COOKIES/STORAGE (ESSENTIAL)
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        handleSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
        handleSession(null);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
        }
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: t('auth.signup_failed_title'),
        description: error.message || t('auth.generic_error_desc'),
      });
    }

    return { error };
  }, [toast, t]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: t('auth.signin_failed_title'),
        description: error.message || t('auth.generic_error_desc'),
      });
    }

    return { error };
  }, [toast, t]);

  const resetPasswordForEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: t('auth.send_email_error_title'),
        description: error.message || t('auth.send_email_error_desc'),
      });
    }
    return { error };
  }, [toast, t]);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({
        variant: "destructive",
        title: t('auth.update_password_error_title'),
        description: error.message || t('auth.update_password_error_desc'),
      });
    } else {
      setIsRecoveryMode(false);
    }
    return { error };
  }, [toast, t]);

  const deleteAccount = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('auth.delete_account_error_title'),
        description: error.message || t('auth.delete_account_error_desc'),
      });
      return { error };
    }

    // Account and all data are already gone server-side; just drop the local session.
    // Target /login (not /) to match signOut()'s destination: ProtectedRoute's own
    // guard re-renders a <Navigate to="/login?..."> the instant user/session go null,
    // which otherwise races an explicit navigate('/') and silently wins.
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    navigate('/login');
    return { error: null };
  }, [toast, navigate, t]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // Se ocorrer um erro 403 (sessão já expirada no servidor),
      // ainda precisamos limpar o estado local e redirecionar.
      if (error && error.status !== 403) {
        toast({
          variant: "destructive",
          title: t('auth.logout_error_title'),
          description: error.message || t('auth.logout_error_desc'),
        });
      }
    } catch (error) {
      console.error("Logout exception:", error);
    } finally {
      // Força a limpeza do estado local e redireciona independentemente de erro no servidor
      setUser(null);
      setSession(null);
      navigate('/login');
    }
  }, [toast, navigate, t]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isRecoveryMode,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    deleteAccount,
  }), [user, session, loading, isRecoveryMode, signUp, signIn, signOut, resetPasswordForEmail, updatePassword, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};