import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCw as Loader2, Eye, EyeSlash as EyeOff } from '@/components/BxIcon';
import VindexLogo from '@/components/VindexLogo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Login - VindexValor</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          {/* Using branding logo with default or specific text color */}
          <VindexLogo textColor="text-foreground" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground mb-6">Bem-vindo de volta!</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none hover:border-primary transition-all duration-200"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
               <Label htmlFor="password" className="text-foreground">Senha</Label>
               <Link to="/reset-password" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none hover:border-primary transition-all duration-200"
                required
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
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11 transition-all"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/signup" className="text-primary hover:underline font-bold">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;