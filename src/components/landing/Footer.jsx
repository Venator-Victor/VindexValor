import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ArrowRight } from 'lucide-react';
import VindexLogo from '@/components/VindexLogo';

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4 transition-opacity hover:opacity-90">
              {/* Task 1: Replaced "V" icon with VindexLogo and set text to white */}
              <VindexLogo textColor="text-white" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">
              O VindexValor é um web app de gestão financeira pessoal inteligente, 
              desenvolvido como Trabalho de Conclusão de Curso (TCC) para a Pós-Graduação 
              em Desenvolvimento Full Stack pela PUC-RS.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <span className="block font-bold text-lg mb-4">Links Rápidos</span>
            <ul className="space-y-2">
              <li><a href="#home" className="text-muted-foreground hover:text-primary text-sm transition-colors">Home</a></li>
              <li><a href="#sobre" className="text-muted-foreground hover:text-primary text-sm transition-colors">Sobre</a></li>
              <li><a href="#funcionalidades" className="text-muted-foreground hover:text-primary text-sm transition-colors">Funcionalidades</a></li>
              <li><a href="#tecnologias" className="text-muted-foreground hover:text-primary text-sm transition-colors">Tecnologias</a></li>
            </ul>
          </div>

          <div>
            <span className="block font-bold text-lg mb-4">Legal e Acesso</span>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="flex items-center gap-1 text-primary hover:underline text-sm font-semibold transition-colors">
                  Fazer Login <ArrowRight size={14} />
                </Link>
              </li>
              <li>
                <Link to="/signup" className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm transition-colors">
                  Criar Conta
                </Link>
              </li>
              <li className="pt-2 mt-2 border-t border-border/50">
                <Link to="/privacy" className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
          
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} VindexValor. TCC PUC-RS. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <span className="text-muted-foreground text-sm">Desenvolvimento Full Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;