import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useTheme } from '@/context/ThemeContext';
import BxIcon, { User, Cog, Bell, InfoCircle, Share, Lock, Moon, Sun } from '@/components/BxIcon';

const Settings = () => {
  const { t } = useTranslation();
  const { settings, setSettings, saveSettings, transactions, accounts, categories, investments, recurring } = useFinance();
  const { user, resetPasswordForEmail } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('conta');

  const tabs = [
    { id: 'conta', label: t('settings.tab_account'), Icon: User },
    { id: 'preferencias', label: t('settings.tab_preferences'), Icon: Cog },
    { id: 'notificacoes', label: t('settings.tab_notifications'), Icon: Bell },
    { id: 'sobre', label: t('settings.tab_about'), Icon: InfoCircle },
  ];

  const handleSave = async () => {
    // Prepare settings object to save
    const settingsToSave = {
      theme: theme, // Save current theme from ThemeContext
      currency: settings.currency,
      language: settings.language
    };
    
    // saveSettings now handles upsert logic internally to prevent duplicate key errors (23505)
    const success = await saveSettings(settingsToSave);
    
    if (!success) {
      console.warn("Settings save failed, check logs for details.");
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await resetPasswordForEmail(user.email);
    } catch (err) {
      toast({ title: t('settings.reset_password_error'), description: err?.message, variant: "destructive" });
    }
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: feature,
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
    });
  };

  const handleExportData = () => {
    const dataToExport = {
      transactions,
      accounts,
      categories,
      investments,
      recurring,
      settings: { ...settings, theme },
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `vindex_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: t('settings.export_success_title'),
      description: t('settings.export_success_desc'),
      className: "bg-green-100 dark:bg-vindex-success/10 border-green-500 dark:border-vindex-success/50 text-green-900 dark:text-vindex-text",
    });
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>VindexValor - Configurações</title>
        <meta name="description" content="Personalize sua experiência e gerencie configurações" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-vindex-text mb-2">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-vindex-text/70">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-vindex-border text-primary shadow-sm border border-gray-200 dark:border-vindex-border'
                    : 'bg-transparent text-gray-500 dark:text-vindex-text/60 hover:bg-gray-100 dark:hover:bg-vindex-border/50 hover:text-gray-900 dark:hover:text-vindex-text'
                }`}
              >
                <tab.Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-lg"
        >
          {activeTab === 'conta' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">{t('settings.section_account')}</h2>

              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-500 dark:text-vindex-text opacity-70 cursor-not-allowed">
                    {user?.email || 'email@exemplo.com'}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-vindex-border pt-6 mt-6 space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-vindex-text">{t('settings.section_data_management')}</h3>

                 <div className="flex flex-col md:flex-row gap-4">
                    <Button onClick={handleExportData} className="flex-1 bg-white dark:bg-vindex-border hover:bg-gray-100 dark:hover:bg-vindex-border/80 text-gray-900 dark:text-vindex-text border border-gray-200 dark:border-vindex-border/50 rounded-lg shadow-sm">
                      <Share size={16} className="mr-2" /> {t('settings.export_data')}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="flex-1 bg-red-50 dark:bg-vindex-danger/20 hover:bg-red-100 dark:hover:bg-vindex-danger/30 text-vindex-danger border border-red-200 dark:border-vindex-danger/50 rounded-lg">
                            <Lock size={16} className="mr-2" /> {t('settings.reset_password')}
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-vindex-text border-gray-200 dark:border-vindex-border rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('settings.reset_password')}</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 dark:text-vindex-text/60">
                            {t('settings.reset_password_confirm', { email: user?.email })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg">{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetPassword} className="bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground">
                            {t('common.confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'preferencias' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">{t('settings.section_preferences')}</h2>
              <div>
                <Label>{t('settings.theme_label')}</Label>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'bg-vindex-border text-primary border border-vindex-border'
                        : 'bg-gray-100 dark:bg-vindex-bg text-gray-500 dark:text-vindex-text/60 hover:bg-gray-200 dark:hover:bg-vindex-border/50'
                    }`}
                  >
                    <Moon size={16} />
                    {t('settings.theme_dark')}
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      theme === 'light'
                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                        : 'bg-gray-100 dark:bg-vindex-bg text-gray-500 dark:text-vindex-text/60 hover:bg-gray-200 dark:hover:bg-vindex-border/50'
                    }`}
                  >
                    <Sun size={16} />
                    {t('settings.theme_light')}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="currency">{t('settings.currency_label')}</Label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text"
                >
                  <option value="BRL">{t('settings.currency_brl')}</option>
                  <option value="USD">{t('settings.currency_usd')}</option>
                  <option value="EUR">{t('settings.currency_eur')}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="language">{t('settings.language_label')}</Label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text"
                >
                  <option value="pt-BR">{t('settings.language_pt')}</option>
                  <option value="en-US">{t('settings.language_en')}</option>
                  <option value="es-ES">{t('settings.language_es')}</option>
                </select>
              </div>
              <Button onClick={handleSave} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg">
                {t('settings.save_preferences')}
              </Button>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">{t('settings.section_notifications')}</h2>

              <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 bg-gray-50 dark:bg-vindex-bg rounded-xl border border-dashed border-gray-300 dark:border-vindex-border text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell size={28} className="text-primary" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-vindex-text font-semibold text-lg">{t('settings.notifications_coming_soon')}</p>
                  <p className="text-sm text-gray-500 dark:text-vindex-text/60 mt-1 max-w-sm">
                    {t('settings.notifications_desc')}
                  </p>
                </div>
                <a
                  href="https://github.com/Venator-Victor/vindexvalor/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('settings.notifications_github')}
                </a>
              </div>

              <div className="space-y-2 text-sm text-gray-400 dark:text-vindex-text/40">
                <p className="font-medium text-gray-500 dark:text-vindex-text/50">{t('settings.planned_features')}</p>
                {[
                  { label: t('settings.notif_transactions'), description: t('settings.notif_transactions_desc') },
                  { label: t('settings.notif_recurrences'), description: t('settings.notif_recurrences_desc') },
                  { label: t('settings.notif_budget'), description: t('settings.notif_budget_desc') },
                  { label: t('settings.notif_monthly'), description: t('settings.notif_monthly_desc') },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-vindex-border/30 opacity-50">
                    <div>
                      <p className="text-gray-700 dark:text-vindex-text/70 font-medium">{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-vindex-text/40">{item.description}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-vindex-border/40 text-gray-400 dark:text-vindex-text/40">em breve</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sobre' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">{t('settings.section_about')}</h2>

              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-vindex-bg rounded-xl border border-gray-200 dark:border-vindex-border/50">
                <img src="/VindexValor.png" alt="VindexValor" className="w-20 h-20 mb-4 object-contain" />
                <h3 className="text-2xl font-bold text-primary mb-1">VindexValor</h3>
                <p className="text-gray-500 dark:text-vindex-text/70 mb-4">{t('settings.about_tagline')}</p>
                <span className="px-3 py-1 bg-gray-200 dark:bg-vindex-border rounded-full text-xs font-mono text-gray-700 dark:text-vindex-text">v0.3</span>
              </div>

              <div className="space-y-3 text-sm text-gray-500 dark:text-vindex-text/60">
                <p>{t('settings.about_description')}</p>
                <p>{t('settings.about_open_source')}</p>
                <div className="pt-4 border-t border-gray-200 dark:border-vindex-border/30">
                  <p>{t('settings.about_copyright', { year: new Date().getFullYear() })}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;