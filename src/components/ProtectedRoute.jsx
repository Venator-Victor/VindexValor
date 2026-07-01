import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { RefreshCw as Loader2 } from '@/components/BxIcon';
import { logSecurityEvent } from '@/utils/securityUtils';

const ProtectedRoute = ({ children }) => {
  const { session, loading, user } = useAuth();
  const location = useLocation();
  const isAuthenticated = !!(session && user);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', null, { path: location.pathname });
    }
  }, [loading, isAuthenticated, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-vindex-bg flex flex-col items-center justify-center text-vindex-success space-y-4">
         <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
         <p className="text-gray-500 dark:text-gray-400">Verificando credenciais de segurança...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;