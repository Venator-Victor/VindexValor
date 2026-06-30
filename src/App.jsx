import './i18n';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TooltipProvider } from '@/components/ui/tooltip';

import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import InvoicesPage from '@/pages/InvoicesPage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage';
import Accounts from '@/pages/Accounts';
import Investments from '@/pages/Investments';
import Categories from '@/pages/Categories';
import Recurrences from '@/pages/Recurrences';
import Analytics from '@/pages/Analytics';
import Goals from '@/pages/Goals';
import Support from '@/pages/Support';
import Settings from '@/pages/Settings';
import AccountTypesConfigPage from '@/pages/AccountTypesConfigPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ProtectedRoute from '@/components/ProtectedRoute';

import { FinanceProvider } from '@/context/FinanceContext';
import { AuthProvider } from '@/context/SupabaseAuthContext';
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
                  <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Layout><InvoicesPage /></Layout></ProtectedRoute>} />
                  <Route path="/invoices/:id" element={<ProtectedRoute><Layout><InvoiceDetailPage /></Layout></ProtectedRoute>} />
                  <Route path="/accounts" element={<ProtectedRoute><Layout><Accounts /></Layout></ProtectedRoute>} />
                  <Route path="/investments" element={<ProtectedRoute><Layout><Investments /></Layout></ProtectedRoute>} />
                  <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
                  <Route path="/recurrences" element={<ProtectedRoute><Layout><Recurrences /></Layout></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
                  <Route path="/goals" element={<ProtectedRoute><Layout><Goals /></Layout></ProtectedRoute>} />
                  <Route path="/support" element={<ProtectedRoute><Layout><Support /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
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