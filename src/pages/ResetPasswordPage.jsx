import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import VindexLogo from '@/components/VindexLogo';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const { isRecoveryMode, resetPasswordForEmail, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(email);
    setIsSubmitting(false);
    if (!error) {
      setLinkSent(true);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não conferem." });
      return;
    }
    setIsSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);
    if (!error) {
      toast({ title: "Senha atualizada!", description: "Você já pode usar sua nova senha." });
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
          {isRecoveryMode ? 'Nova Senha' : 'Recuperar Senha'}
        </h1>

        {isRecoveryMode ? (
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
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Atualizar Senha'}
            </Button>
          </form>
        ) : linkSent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <MailCheck className="w-12 h-12 text-vindex-success" />
            <p className="text-vindex-text font-medium">Link enviado!</p>
            <p className="text-sm text-vindex-text/70">
              Verifique sua caixa de entrada em <span className="font-semibold text-vindex-text">{email}</span> e clique no link para redefinir sua senha.
            </p>
            <button
              type="button"
              onClick={() => setLinkSent(false)}
              className="text-xs text-vindex-success hover:underline mt-2"
            >
              Reenviar para outro email
            </button>
          </div>
        ) : (
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
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Link'}
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
