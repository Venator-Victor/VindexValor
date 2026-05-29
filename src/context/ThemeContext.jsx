import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';
import { PRIMARY, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO } from '@/utils/colors';

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
      text: '#111827',
      textSecondary: '#4b5563',
      border: '#e2e8f0',
      primary: PRIMARY,
      success: SUCCESS,
      danger: DANGER,
      warning: WARNING,
      info: INFO,
    },
    dark: {
      background: '#060916',
      card: '#0b122d',
      text: '#f3f4f6',
      textSecondary: '#d1d5db',
      border: '#283768',
      primary: PRIMARY,
      success: SUCCESS,
      danger: DANGER_DARK,
      warning: WARNING,
      info: INFO,
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
      if (!user || !user.id) return;

      // Verify the Supabase client actually has an active session before any DB call.
      // React state can be ahead of the client's internal auth state right after login.
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession?.access_token) return;

      const { data, error } = await supabase
        .from('settings')
        .select('theme, goals_view_preference')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) return;

      if (data) {
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
        if (data.goals_view_preference) {
          setMetasViewMode(data.goals_view_preference);
        }
      } else {
        await supabase
          .from('settings')
          .upsert({ user_id: user.id, theme: theme, goals_view_preference: 'card' }, { onConflict: 'user_id' });
      }
    };

    fetchSettings();
  }, [user, session]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (user && user.id) {
      await supabase
        .from('settings')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' });
    }
  };

  const setThemeValue = async (newTheme) => {
    setTheme(newTheme);
    if (user && user.id) {
      await supabase
        .from('settings')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' });
    }
  };

  const setMetasViewPreference = async (mode) => {
    setMetasViewMode(mode);
    if (user && user.id) {
      await supabase
        .from('settings')
        .update({ goals_view_preference: mode })
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