import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { logSecurityEvent } from '@/utils/securityUtils';

const ProtectedRoute = ({ children }) => {
  const { session, loading, user } = useAuth();
  const location = useLocation();
  const [authVerified, setAuthVerified] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (session && user) {
        setAuthVerified(true);
      } else {
        logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', null, { path: location.pathname });
        setAuthError('Você precisa estar logado para acessar esta página.');
      }
    }
  }, [loading, session, user, location.pathname]);

  if (loading || (!authVerified && !authError)) {
    return (
      <div className="min-h-screen bg-vindex-bg flex flex-col items-center justify-center text-vindex-success space-y-4">
         <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
         <p className="text-gray-500 dark:text-gray-400">Verificando credenciais de segurança...</p>
      </div>
    );
  }

  if (authError || !session) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;