import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import VindexLogo from '@/components/VindexLogo';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false); // True if updating password, false if requesting link
  
  const { resetPasswordForEmail, updatePassword, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we are in recovery flow (url has #access_token or similar handled by supabase auth listener, but typically we check for session recovery)
    // Actually, supabase automatically handles session on link click. If we have a session but came here, we might be resetting.
    // A simple check is hash presence or if user is logged in via recovery link.
    // For simplicity, we'll assume if the user is authenticated (via recovery link), they see the form.
    // However, since we wrapped App with ProtectedRoute logic, we need to be careful.
    // This page should be public.
    
    // Check for hash which indicates recovery redirect
    if (location.hash && location.hash.includes('type=recovery')) {
      setIsResetMode(true);
    }
  }, [location]);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    await resetPasswordForEmail(email);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
       toast({ variant: "destructive", title: "Erro", description: "Senhas não conferem" });
       return;
    }
    const { error } = await updatePassword(newPassword);
    if (!error) {
        navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-vindex-bg flex items-center justify-center p-4">
      <Helmet>
        <title>Redefinir Senha - VindexValor</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-vindex-card rounded-xl border border-vindex-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <VindexLogo />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-vindex-text mb-6">
          {isResetMode ? 'Nova Senha' : 'Recuperar Senha'}
        </h1>
        
        {!isResetMode ? (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <p className="text-sm text-vindex-text/70 text-center mb-4">
              Digite seu email e enviaremos um link para você redefinir sua senha.
            </p>
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text focus:ring-1 focus:ring-vindex-success outline-none"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-vindex-success hover:bg-vindex-success/90 text-white font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Link'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-sm text-vindex-text/70 text-center mb-4">
              Digite sua nova senha abaixo.
            </p>
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text focus:ring-1 focus:ring-vindex-success outline-none"
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text focus:ring-1 focus:ring-vindex-success outline-none"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-vindex-success hover:bg-vindex-success/90 text-white font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Atualizar Senha'}
            </Button>
          </form>
        )}
        
        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-vindex-success hover:underline font-bold">
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;