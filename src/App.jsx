import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TooltipProvider } from '@/components/ui/tooltip';

import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import Dashboard from '@/pages/Dashboard';
import Transacoes from '@/pages/Transacoes';
import FaturasPage from '@/pages/FaturasPage';
import FaturaDetailPage from '@/pages/FaturaDetailPage';
import Contas from '@/pages/Contas';
import Investimentos from '@/pages/Investimentos';
import Categorias from '@/pages/Categorias';
import Recorrencias from '@/pages/Recorrencias';
import Analises from '@/pages/Analises';
import Metas from '@/pages/Metas';
import Suporte from '@/pages/Suporte';
import Configuracoes from '@/pages/Configuracoes';
import AccountTypesConfigPage from '@/pages/AccountTypesConfigPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ProtectedRoute from '@/components/ProtectedRoute';

import { FinanceProvider } from '@/context/FinanceContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ConsentProvider } from '@/context/ConsentContext';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import CookiePreferencesModal from '@/components/CookiePreferencesModal';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <TooltipProvider>
      <ConsentProvider>
        <Router>
          <AuthProvider>
            <ThemeProvider>
              <FinanceProvider>
                <Helmet>
                  <title>VindexValor - Gestão Financeira</title>
                  <meta name="description" content="VindexValor - Sistema completo de gestão financeira pessoal" />
                </Helmet>
                
                <Routes>
                  {/* Landing Page Route */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* Public Policy Route */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Protected Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/transacoes" element={<ProtectedRoute><Layout><Transacoes /></Layout></ProtectedRoute>} />
                  <Route path="/faturas" element={<ProtectedRoute><Layout><FaturasPage /></Layout></ProtectedRoute>} />
                  <Route path="/faturas/:id" element={<ProtectedRoute><Layout><FaturaDetailPage /></Layout></ProtectedRoute>} />
                  <Route path="/contas" element={<ProtectedRoute><Layout><Contas /></Layout></ProtectedRoute>} />
                  <Route path="/investimentos" element={<ProtectedRoute><Layout><Investimentos /></Layout></ProtectedRoute>} />
                  <Route path="/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
                  <Route path="/recorrencias" element={<ProtectedRoute><Layout><Recorrencias /></Layout></ProtectedRoute>} />
                  <Route path="/analises" element={<ProtectedRoute><Layout><Analises /></Layout></ProtectedRoute>} />
                  <Route path="/metas" element={<ProtectedRoute><Layout><Metas /></Layout></ProtectedRoute>} />
                  <Route path="/suporte" element={<ProtectedRoute><Layout><Suporte /></Layout></ProtectedRoute>} />
                  <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
                  <Route path="/account-types-config" element={<ProtectedRoute><Layout><AccountTypesConfigPage /></Layout></ProtectedRoute>} />
                  
                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                
                {/* Global Overlays */}
                <Toaster />
                <CookieConsentBanner />
                <CookiePreferencesModal />
              </FinanceProvider>
            </ThemeProvider>
          </AuthProvider>
        </Router>
      </ConsentProvider>
    </TooltipProvider>
  );
}

export default App;