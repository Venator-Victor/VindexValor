import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import VindexLogo from '@/components/VindexLogo';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
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

    if (formData.password.length < 8) {
       toast({
        variant: "destructive",
        title: "Senha Fraca",
        description: "A senha deve ter pelo menos 8 caracteres.",
      });
      return;
    }

    // Removed fullName from signUp call
    const { error } = await signUp(formData.email, formData.password);
    
    if (!error) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-vindex-bg flex items-center justify-center p-4">
      <Helmet>
        <title>Cadastro - VindexValor</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-vindex-card rounded-xl border border-vindex-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <VindexLogo />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-vindex-text mb-6">Crie sua conta</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Removed Full Name Field */}

          <div>
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text focus:ring-1 focus:ring-vindex-success outline-none"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha</Label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
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
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text focus:ring-1 focus:ring-vindex-success outline-none"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-vindex-success hover:bg-vindex-success/90 text-white font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cadastrar'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-vindex-text/70">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-vindex-success hover:underline font-bold">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;