import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ShieldAlt as ShieldCheck, Database, Lock, UserCheck, Envelope as Mail, Cookie, Cog as Settings2 } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useConsent } from '@/context/ConsentContext';
import VindexLogo from '@/components/VindexLogo';

const PrivacyPage = () => {
  const { setIsModalOpen } = useConsent();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>Política de Privacidade e Cookies - VindexValor</title>
        <meta name="description" content="Política de Privacidade e Termos de Uso de Cookies do VindexValor em conformidade com a LGPD." />
      </Helmet>

      {/* Header Minimal */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <VindexLogo textColor="text-foreground" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Política de Privacidade</h1>
            <p className="text-muted-foreground text-lg">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-12 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm text-card-foreground">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-primary" /> Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O VindexValor ("nós", "nosso") está comprometido em proteger sua privacidade. Esta Política de 
                Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações 
                pessoais e financeiras quando você utiliza nosso aplicativo web de gestão financeira pessoal,
                em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Database className="text-primary" /> Coleta de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos informações necessárias para fornecer o serviço principal do VindexValor:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li><strong>Dados de Registro:</strong> Nome, e-mail e senha (criptografada) fornecidos durante a criação da conta.</li>
                <li><strong>Dados Financeiros:</strong> Informações sobre contas bancárias, saldos, transações (receitas/despesas), categorias, metas e investimentos inseridos manualmente por você.</li>
                <li><strong>Dados de Uso:</strong> Preferências de interface (tema, idioma, visualizações padrão) e interações básicas no app.</li>
              </ul>
            </section>

            {/* How We Use Your Data */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="text-primary" /> Como Usamos Suas Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Seus dados são utilizados estritamente para os propósitos a seguir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>Processar cálculos financeiros (saldo total, orçamentos, rendimentos, projeções).</li>
                <li>Sincronizar seus dados entre múltiplos dispositivos via nosso banco de dados em nuvem (Supabase).</li>
                <li>Gerar relatórios visuais e gráficos no seu Dashboard.</li>
                <li>Personalizar a sua experiência e reter suas configurações preferidas (ex: modo escuro).</li>
              </ul>
              <p className="text-muted-foreground mt-4 italic">
                Não compartilhamos, vendemos ou alugamos seus dados financeiros para empresas terceiras, corretoras ou anunciantes.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="text-primary" /> Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos as práticas modernas de segurança de mercado, alavancando a infraestrutura robusta do Supabase. 
                Os dados em repouso são criptografados. Além disso, todas as regras de acesso ao banco de dados usam 
                Row Level Security (RLS) para garantir que apenas você, com seu token de autenticação válido, possa 
                ler, editar ou deletar as informações financeiras atreladas à sua conta.
              </p>
            </section>

            {/* Cookies */}
            <section id="cookies">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Cookie className="text-primary" /> Política de Cookies e Armazenamento
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O VindexValor utiliza <code>localStorage</code>, <code>sessionStorage</code> e cookies técnicos para 
                garantir o funcionamento, segurança e personalização da plataforma.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="p-4 border border-border rounded-lg bg-background">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary" /> Cookies Essenciais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    São vitais para o funcionamento da plataforma. Incluem tokens de autenticação (via Supabase) para 
                    manter você logado com segurança e evitar fraudes (CSRF). Estes não podem ser desativados no sistema, 
                    pois o aplicativo não funcionaria sem eles.
                  </p>
                </div>

                <div className="p-4 border border-border rounded-lg bg-background">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Settings2 size={18} className="text-blue-500" /> Preferências e Funcionais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Armazenamos localmente suas preferências de tema (claro/escuro) e o estado do menu lateral. 
                    Isso melhora sua experiência ao retornar ao site.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <h4 className="font-bold text-foreground">Suas Escolhas (LGPD)</h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode revisar e alterar suas permissões de rastreamento a qualquer momento.
                  </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} variant="outline" className="shrink-0 shadow-sm bg-background">
                  Gerenciar Cookies
                </Button>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="text-primary" /> Seus Direitos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A qualquer momento, você possui o direito de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
                <li>Acessar as informações que mantemos sobre você.</li>
                <li>Corrigir dados imprecisos ou incompletos.</li>
                <li>Revogar consentimentos previamente concedidos para cookies não-essenciais.</li>
                <li>Excluir sua conta e solicitar o apagamento permanente de todo o seu histórico financeiro (direito ao esquecimento).</li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Mail className="text-primary" /> Contato
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver alguma dúvida sobre esta Política de Privacidade ou sobre as práticas de proteção 
                de dados do VindexValor, por favor, entre em contato através da nossa página de <Link to="/suporte" className="text-primary hover:underline">Suporte</Link> dentro do aplicativo ou envie um e-mail para os desenvolvedores do projeto (TCC).
              </p>
            </section>

          </div>
          
          <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto px-8 font-semibold shadow-md">
                Voltar para a Página Inicial
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
      
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} VindexValor. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;