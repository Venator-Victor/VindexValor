import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/context/ThemeContext';

const Configuracoes = () => {
  const { settings, setSettings, saveSettings, transactions, accounts, categories, investments, recurring } = useFinance();
  const { user, resetPasswordForEmail } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('conta');

  const tabs = [
    { id: 'conta', label: 'Conta', iconClass: 'bx bx-user' },
    { id: 'preferencias', label: 'Preferências', iconClass: 'bx bx-cog' },
    { id: 'notificacoes', label: 'Notificações', iconClass: 'bx bx-bell' },
    { id: 'sobre', label: 'Sobre', iconClass: 'bx bx-info-circle' },
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
      toast({ title: "Erro ao redefinir senha", description: err?.message, variant: "destructive" });
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
      title: "Exportação Concluída",
      description: "Seus dados foram exportados com sucesso!",
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-vindex-text mb-2">Configurações</h1>
        <p className="text-gray-500 dark:text-vindex-text/70">Personalize sua experiência</p>
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
                    ? 'bg-white dark:bg-vindex-border text-vindex-success shadow-sm border border-gray-200 dark:border-vindex-border'
                    : 'bg-transparent text-gray-500 dark:text-vindex-text/60 hover:bg-gray-100 dark:hover:bg-vindex-border/50 hover:text-gray-900 dark:hover:text-vindex-text'
                }`}
              >
                <i className={`${tab.iconClass} text-xl`}></i>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Conta</h2>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-500 dark:text-vindex-text opacity-70 cursor-not-allowed">
                    {user?.email || 'email@exemplo.com'}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-vindex-border pt-6 mt-6 space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-vindex-text">Gerenciamento de Dados</h3>
                 
                 <div className="flex flex-col md:flex-row gap-4">
                    <Button onClick={handleExportData} className="flex-1 bg-white dark:bg-vindex-border hover:bg-gray-100 dark:hover:bg-vindex-border/80 text-gray-900 dark:text-vindex-text border border-gray-200 dark:border-vindex-border/50 rounded-lg shadow-sm">
                      <i className='bx bx-export mr-2'></i> Exportar Dados
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="flex-1 bg-red-50 dark:bg-vindex-danger/20 hover:bg-red-100 dark:hover:bg-vindex-danger/30 text-vindex-danger border border-red-200 dark:border-vindex-danger/50 rounded-lg">
                            <i className='bx bx-lock-alt mr-2'></i> Redefinir Senha
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-vindex-text border-gray-200 dark:border-vindex-border rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 dark:text-vindex-text/60">
                            Um email de redefinição de senha será enviado para {user?.email}. Deseja continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text rounded-lg">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetPassword} className="bg-vindex-success hover:bg-vindex-success/90 rounded-lg text-white">
                            Confirmar
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Preferências</h2>
              <div>
                <Label>Tema</Label>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'bg-vindex-border text-vindex-success border border-vindex-border'
                        : 'bg-gray-100 dark:bg-vindex-bg text-gray-500 dark:text-vindex-text/60 hover:bg-gray-200 dark:hover:bg-vindex-border/50'
                    }`}
                  >
                    <i className='bx bx-moon'></i>
                    Escuro
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      theme === 'light'
                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                        : 'bg-gray-100 dark:bg-vindex-bg text-gray-500 dark:text-vindex-text/60 hover:bg-gray-200 dark:hover:bg-vindex-border/50'
                    }`}
                  >
                    <i className='bx bx-sun'></i>
                    Claro
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="currency">Moeda Padrão</Label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español (ES)</option>
                </select>
              </div>
              <Button onClick={handleSave} className="bg-green-100 dark:bg-vindex-success/20 hover:bg-green-200 dark:hover:bg-vindex-success/30 text-green-700 dark:text-vindex-success border border-green-200 dark:border-vindex-success/50 rounded-lg">
                Salvar Preferências
              </Button>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Notificações</h2>
              <div className="space-y-4">
                {[
                  { label: 'Notificações de Transações', description: 'Receba alertas para novas transações' },
                  { label: 'Lembretes de Recorrências', description: 'Avisos antes de transações recorrentes' },
                  { label: 'Alertas de Orçamento', description: 'Notificações quando ultrapassar o orçamento' },
                  { label: 'Resumo Mensal', description: 'Relatório mensal por email' },
                ].map((notification, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-vindex-bg rounded-lg border border-gray-200 dark:border-vindex-border/50">
                    <div>
                      <p className="text-gray-900 dark:text-vindex-text font-medium">{notification.label}</p>
                      <p className="text-sm text-gray-500 dark:text-vindex-text/60">{notification.description}</p>
                    </div>
                    <button
                      onClick={() => handleFeatureClick(notification.label)}
                      className="w-12 h-6 bg-gray-200 dark:bg-vindex-border rounded-full relative transition-colors hover:bg-gray-300 dark:hover:bg-vindex-border/80"
                    >
                      <div className="w-5 h-5 bg-white dark:bg-vindex-text rounded-full absolute left-0.5 top-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sobre' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Sobre</h2>
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-vindex-bg rounded-xl border border-gray-200 dark:border-vindex-border/50">
                 <img src="https://horizons-cdn.hostinger.com/2a249bc4-344a-46af-9dec-bb8c9e46ed73/5249fd8daaf81ca40360b2d3e3ff3ab7.png" alt="Logo" className="w-20 h-20 mb-4 object-contain" />
                 <h3 className="text-2xl font-bold text-vindex-success mb-1">VindexValor</h3>
                 <p className="text-gray-500 dark:text-vindex-text/70 mb-4">Gestão Financeira Inteligente</p>
                 <span className="px-3 py-1 bg-gray-200 dark:bg-vindex-border rounded-full text-xs font-mono text-gray-700 dark:text-vindex-text">v1.0.0</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-vindex-text/60">
                <p>O VindexValor é sua plataforma completa para controle financeiro pessoal. Monitore gastos, gerencie investimentos e alcance sua liberdade financeira.</p>
                <div className="pt-4 border-t border-gray-200 dark:border-vindex-border/30">
                   <p>© 2026 VindexValor. Todos os direitos reservados.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Configuracoes;