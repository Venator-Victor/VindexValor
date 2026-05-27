import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user, session } = useAuth();
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [metasViewMode, setMetasViewMode] = useState('card');

  const themeColors = {
    light: {
      background: '#f8f9fa',
      card: '#ffffff',
      text: '#111827', // Gray 900
      textSecondary: '#4b5563', // Gray 600
      border: '#e2e8f0',
      primary: '#111827',
      success: '#43CFEA', 
      danger: '#dc2626',
      warning: '#ca8a04',
      info: '#2563eb',
    },
    dark: {
      background: '#060916', 
      card: '#0b122d', 
      text: '#f3f4f6', // Gray 100
      textSecondary: '#d1d5db', // Gray 300
      border: '#283768', 
      primary: '#43CFEA', 
      success: '#43CFEA', 
      danger: '#e3365e',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
  };

  const currentColors = themeColors[theme];

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchSettings = async () => {
      // Only attempt to fetch if we have a valid user AND session
      if (!user || !user.id || !session) return;
      
      const { data, error } = await supabase
        .from('configuracoes')
        .select('theme, metas_view_preference')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (data) {
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
        if (data.metas_view_preference) {
          setMetasViewMode(data.metas_view_preference);
        }
      } else {
        // Only upsert if we are sure we have a user
        if (user && user.id) {
          await supabase
            .from('configuracoes')
            .upsert({ user_id: user.id, theme: theme, metas_view_preference: 'card' }, { onConflict: 'user_id' });
        }
      }
    };
    
    fetchSettings();
  }, [user, session]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (user && user.id) {
      await supabase
        .from('configuracoes')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' });
    }
  };

  const setThemeValue = async (newTheme) => {
    setTheme(newTheme);
    if (user && user.id) {
      await supabase
        .from('configuracoes')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' });
    }
  };

  const setMetasViewPreference = async (mode) => {
    setMetasViewMode(mode);
    if (user && user.id) {
      await supabase
        .from('configuracoes')
        .update({ metas_view_preference: mode })
        .eq('user_id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors: currentColors, 
      toggleTheme, 
      setTheme: setThemeValue,
      metasViewMode,
      setMetasViewPreference
    }}>
      {children}
    </ThemeContext.Provider>
  );
};