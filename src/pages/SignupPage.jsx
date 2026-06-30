import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw as Loader2, Eye, EyeSlash as EyeOff } from '@/components/BxIcon';
import VindexLogo from '@/components/VindexLogo';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "As senhas não coincidem.",
      });
      return;
    }

    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast({
        variant: "destructive",
        title: "Senha Fraca",
        description: "A senha deve ter mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo.",
      });
      return;
    }

    const { error } = await signUp(formData.email, formData.password);

    if (!error) {
      navigate('/dashboard');
    }
  };

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none hover:border-primary transition-all duration-200";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Cadastro - VindexValor</title>
      </Helmet>

      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <VindexLogo textColor="text-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-6">Crie sua conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Senha</Label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {[
                  { label: 'Mínimo 8 caracteres', met: formData.password.length >= 8 },
                  { label: 'Uma letra maiúscula', met: /[A-Z]/.test(formData.password) },
                  { label: 'Um número', met: /[0-9]/.test(formData.password) },
                ].map(({ label, met }) => (
                  <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="text-base leading-none">{met ? '✓' : '·'}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Senha</Label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11 transition-all"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
