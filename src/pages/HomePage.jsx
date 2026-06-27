import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet, ArrowCross as ArrowRightLeft, Repeat, PieChart, TrendingUp, Target } from '@/components/BxIcon';
import { ViteJs, ReactIcon, Nodejs, Supabase as SupabaseIcon, TailwindCss, Landmark } from '@boxicons/react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import FeatureCard from '@/components/landing/FeatureCard';
import TechBadge from '@/components/landing/TechBadge';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Helmet>
        <title>VindexValor - Gestão Financeira Pessoal Inteligente</title>
        <meta name="description" content="Controle suas finanças com facilidade, acompanhe investimentos e alcance suas metas com VindexValor." />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section id="home" className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/hero.jpg" alt="Finanças e Planejamento" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center text-white">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Vindex<span className="text-primary">Valor</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
                Gestão Financeira Pessoal Inteligente. Assuma o controle do seu dinheiro, acompanhe investimentos e alcance seus objetivos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 shadow-lg hover:scale-105 transition-transform bg-primary text-black hover:bg-primary/90">
                    Começar Agora <ArrowRight size={20} />
                  </Button>
                </Link>
                <a href="#sobre">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md">
                    Saber Mais
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SOBRE SECTION */}
        <section id="sobre" className="py-24 bg-card text-card-foreground">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre o Projeto</h2>
                <div className="w-20 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  O VindexValor é um web app de gestão financeira pessoal inteligente, desenvolvido como
                  <strong className="text-foreground"> Trabalho de Conclusão de Curso (TCC)</strong> para a Pós-Graduação
                  em <strong className="text-foreground">Desenvolvimento Full Stack pela PUC-RS</strong>.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  O objetivo é facilitar o controle financeiro, oferecendo ferramentas intuitivas para gestão de despesas, projeções contra a inflação (IPCA), metas e acompanhamento detalhado do seu patrimônio ao longo do tempo.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  O projeto é <strong className="text-foreground">open source</strong> — contribuições e feedbacks são bem-vindos.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FUNCIONALIDADES SECTION */}
        <section id="funcionalidades" className="py-24 bg-background border-t border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades Principais</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo o que você precisa para uma vida financeira mais saudável e previsível, reunido em uma só plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={Wallet} title="Gestão de Contas Bancárias" description="Cadastre e gerencie múltiplas accounts (Corrente, Poupança, Cartão de Crédito) com visão unificada de saldos e limites." />
              <FeatureCard icon={ArrowRightLeft} title="Registro de Transações" description="Controle total sobre Entradas e Saídas, transferências entre contas e categorização flexível." />
              <FeatureCard icon={Repeat} title="Transações Recorrentes" description="Gerencie contas fixas, parcelamentos e salários com o motor inteligente de recorrências automáticas." />
              <FeatureCard icon={PieChart} title="Análise de Gastos" description="Visualize seus hábitos de consumo por categoria com gráficos interativos e limites de orçamento (budgets)." />
              <FeatureCard icon={TrendingUp} title="Acompanhamento de Investimentos" description="Registre rendimentos, tipos de aplicações e simule o crescimento do seu patrimônio com base em taxas históricas." />
              <FeatureCard icon={Target} title="Metas Financeiras" description="Defina e acompanhe objetivos como 'Comprar um Carro' ou 'Fundo de Emergência', associando saldos reais aos seus sonhos." />
            </div>
          </div>
        </section>

        {/* TECNOLOGIAS SECTION */}
        <section id="tecnologias" className="py-24 bg-card text-card-foreground border-t border-border">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Tecnologias Utilizadas</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Construído com tecnologias modernas para garantir performance, segurança e a melhor experiência de usuário.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              <TechBadge
                name="Node.js"
                icon={Nodejs}
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              />
              <TechBadge
                name="React"
                icon={ReactIcon}
                className="bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800"
              />
              <TechBadge
                name="Vite"
                icon={ViteJs}
                className="bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
              />
              <TechBadge
                name="Supabase"
                icon={SupabaseIcon}
                className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
              />
              <TechBadge
                name="Tailwind CSS"
                icon={TailwindCss}
                className="bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800"
              />
              <TechBadge
                name="API do Banco Central"
                icon={Landmark}
                className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700"
              />
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
          
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para controlar suas finanças?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Crie sua conta e tenha uma maneira simples, moderna e segura de acompanhar suas finanças. Organize contas, registre transações e visualize seus gastos em um só lugar.
            </p>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold shadow-xl hover:scale-105 transition-transform text-black bg-white hover:bg-gray-100">
                Criar Conta
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;