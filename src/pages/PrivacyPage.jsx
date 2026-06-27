import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowLeft, ShieldAlt as ShieldCheck, Database, Lock, UserCheck,
  Envelope as Mail, Cookie, Cog as Settings2, AlertShield, Cloud,
  File as FileText, Clock5 as Clock,
} from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useConsent } from '@/context/ConsentContext';
import VindexLogo from '@/components/VindexLogo';

const LAST_UPDATED = '27 de junho de 2026';

const Section = ({ icon: Icon, title, id, children }) => (
  <section id={id}>
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
      <Icon className="text-primary flex-shrink-0" /> {title}
    </h2>
    {children}
  </section>
);

const PrivacyPage = () => {
  const { setIsModalOpen } = useConsent();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <title>Política de Privacidade — VindexValor</title>
        <meta name="description" content="Política de Privacidade e Cookies do VindexValor, em conformidade com a LGPD (Lei 13.709/2018)." />
      </Helmet>

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/"><VindexLogo textColor="text-foreground" /></Link>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Política de Privacidade</h1>
            <p className="text-muted-foreground text-lg">Última atualização: {LAST_UPDATED}</p>
            <p className="text-sm text-muted-foreground mt-2">Em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)</p>
          </div>

          <div className="space-y-12 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm text-card-foreground">

            {/* 1. Introdução */}
            <Section icon={ShieldCheck} title="1. Introdução">
              <p className="text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">VindexValor</strong> é um aplicativo web de gestão financeira pessoal,
                desenvolvido como Trabalho de Conclusão de Curso (TCC) para a Pós-Graduação em Desenvolvimento
                Full Stack pela PUC-RS. Esta Política descreve como coletamos, usamos, armazenamos e protegemos
                seus dados pessoais, em plena conformidade com a LGPD.
              </p>
            </Section>

            {/* 2. Controlador */}
            <Section icon={UserCheck} title="2. Controlador dos Dados">
              <p className="text-muted-foreground leading-relaxed mb-3">
                O <strong className="text-foreground">controlador</strong> responsável pelo tratamento dos seus dados pessoais é:
              </p>
              <div className="p-4 bg-background border border-border rounded-lg space-y-1 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Nome:</strong> Victor Schramm</p>
                <p><strong className="text-foreground">Projeto:</strong> VindexValor (TCC — PUC-RS)</p>
                <p><strong className="text-foreground">E-mail:</strong>{' '}
                  <a href="mailto:signal@venatorvictor.com" className="text-primary hover:underline">signal@venatorvictor.com</a>
                </p>
                <p><strong className="text-foreground">GitHub:</strong>{' '}
                  <a href="https://github.com/Venator-Victor" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/Venator-Victor</a>
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Por se tratar de um projeto acadêmico individual de pequeno porte, o próprio controlador exerce
                as funções de encarregado de dados (DPO), conforme previsto no Art. 41, §3º da LGPD.
              </p>
            </Section>

            {/* 3. Dados coletados */}
            <Section icon={Database} title="3. Dados Coletados">
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos apenas os dados estritamente necessários para o funcionamento do serviço:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li><strong className="text-foreground">Dados de cadastro:</strong> e-mail e senha (armazenada com hash seguro pelo Supabase Auth).</li>
                <li><strong className="text-foreground">Dados financeiros:</strong> contas, transações, categorias, faturas, investimentos, metas e recorrências — todos inseridos manualmente por você.</li>
                <li><strong className="text-foreground">Dados de preferências:</strong> tema (claro/escuro), idioma, estado do menu lateral — armazenados localmente no seu dispositivo (localStorage).</li>
                <li><strong className="text-foreground">Dados técnicos:</strong> tokens de sessão gerenciados pelo Supabase Auth para manter o login ativo com segurança.</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4 italic">
                Não coletamos dados de localização, dispositivo, comportamento de navegação, nem utilizamos trackers ou pixels de terceiros.
              </p>
            </Section>

            {/* 4. Base legal */}
            <Section icon={FileText} title="4. Base Legal do Tratamento">
              <p className="text-muted-foreground leading-relaxed mb-3">
                Nos termos do Art. 7º da LGPD, o tratamento dos seus dados se fundamenta nas seguintes bases legais:
              </p>
              <div className="space-y-3">
                {[
                  {
                    base: 'Consentimento (Art. 7º, I)',
                    desc: 'Ao criar sua conta, você consente com o tratamento dos seus dados para uso do serviço. O consentimento pode ser revogado a qualquer momento mediante exclusão da conta.',
                  },
                  {
                    base: 'Execução de contrato (Art. 7º, V)',
                    desc: 'O tratamento de dados financeiros é necessário para fornecer as funcionalidades do app (cálculo de saldo, relatórios, sincronização entre dispositivos).',
                  },
                  {
                    base: 'Legítimo interesse (Art. 7º, IX)',
                    desc: 'Tokens de autenticação e medidas de segurança (RLS) são necessários para proteger sua conta e impedir acesso não autorizado.',
                  },
                ].map(({ base, desc }) => (
                  <div key={base} className="p-4 bg-background border border-border rounded-lg">
                    <p className="font-semibold text-foreground text-sm mb-1">{base}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 5. Uso */}
            <Section icon={UserCheck} title="5. Como Usamos Seus Dados">
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>Processar cálculos financeiros (saldo, orçamentos, rendimentos, projeções de inflação).</li>
                <li>Sincronizar seus dados entre dispositivos via banco de dados em nuvem (Supabase).</li>
                <li>Gerar relatórios, gráficos e análises no Dashboard.</li>
                <li>Manter a sessão autenticada e proteger sua conta.</li>
              </ul>
              <p className="text-muted-foreground mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                <strong className="text-foreground">Não compartilhamos, vendemos ou cedemos</strong> seus dados financeiros a terceiros, anunciantes, corretoras ou qualquer outra entidade.
              </p>
            </Section>

            {/* 6. Operadores / terceiros */}
            <Section icon={Cloud} title="6. Operadores e Transferência Internacional">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para operar o serviço, utilizamos o seguinte suboperador de dados:
              </p>
              <div className="p-4 bg-background border border-border rounded-lg text-sm text-muted-foreground mb-4">
                <p className="font-semibold text-foreground mb-1">Supabase Inc. (Operador)</p>
                <p>Plataforma de banco de dados em nuvem que armazena e processa seus dados financeiros e de autenticação.</p>
                <p className="mt-2">
                  <strong className="text-foreground">Infraestrutura:</strong> os dados podem ser armazenados em servidores localizados nos <strong className="text-foreground">Estados Unidos</strong>.
                  Esta transferência internacional ocorre com base nas garantias contratuais (DPA) e nas Cláusulas Contratuais Padrão adotadas pelo Supabase, nos termos do Art. 33, II da LGPD.
                </p>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">
                  Política de privacidade do Supabase →
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum outro serviço terceiro tem acesso aos seus dados pessoais ou financeiros.
              </p>
            </Section>

            {/* 7. Segurança */}
            <Section icon={Lock} title="7. Segurança dos Dados">
              <p className="text-muted-foreground leading-relaxed">
                Adotamos as seguintes medidas técnicas de proteção:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-3">
                <li><strong className="text-foreground">Row Level Security (RLS):</strong> todas as tabelas do banco de dados têm políticas que garantem que apenas você, autenticado, pode ler ou modificar seus próprios dados.</li>
                <li><strong className="text-foreground">Criptografia em repouso e em trânsito:</strong> dados armazenados e transferidos com criptografia TLS/AES-256 via infraestrutura Supabase.</li>
                <li><strong className="text-foreground">Senhas:</strong> nunca armazenadas em texto puro — gerenciadas pelo Supabase Auth com bcrypt.</li>
                <li><strong className="text-foreground">Sanitização de entrada:</strong> todos os dados inseridos pelo usuário são sanitizados antes de serem persistidos no banco.</li>
              </ul>
            </Section>

            {/* 8. Retenção */}
            <Section icon={Clock} title="8. Retenção dos Dados">
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são mantidos <strong className="text-foreground">enquanto sua conta estiver ativa</strong>.
                Ao solicitar a exclusão da conta, todos os dados pessoais e financeiros associados são removidos
                permanentemente do banco de dados em até <strong className="text-foreground">30 dias</strong>,
                salvo obrigação legal que exija retenção por prazo maior.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Dados armazenados localmente no seu dispositivo (localStorage) são apagados automaticamente ao limpar os dados do navegador ou desinstalar o app.
              </p>
            </Section>

            {/* 9. Cookies */}
            <section id="cookies">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Cookie className="text-primary flex-shrink-0" /> 9. Cookies e Armazenamento Local
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O VindexValor utiliza <code>localStorage</code> e cookies técnicos para garantir funcionamento, segurança e personalização.
              </p>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg bg-background">
                  <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" /> Cookies Essenciais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tokens de autenticação (Supabase Auth) para manter a sessão ativa com segurança. Não podem ser desativados — o app não funciona sem eles. Base legal: execução de contrato.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-background">
                  <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                    <Settings2 size={16} className="text-primary" /> Preferências Funcionais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tema (claro/escuro), estado do menu lateral e progresso do onboarding — armazenados apenas no seu dispositivo via <code>localStorage</code>. Nunca enviados ao servidor.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <h4 className="font-bold text-foreground">Gerenciar preferências de cookies</h4>
                  <p className="text-sm text-muted-foreground">Revise ou altere suas permissões a qualquer momento.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} variant="outline" className="shrink-0 shadow-sm bg-background">
                  Gerenciar Cookies
                </Button>
              </div>
            </section>

            {/* 10. Direitos do titular */}
            <Section icon={AlertShield} title="10. Seus Direitos (Art. 18 da LGPD)">
              <p className="text-muted-foreground leading-relaxed mb-3">
                Como titular dos dados, você tem os seguintes direitos, exercíveis a qualquer momento mediante solicitação:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { right: 'Confirmação', desc: 'Saber se tratamos dados seus.' },
                  { right: 'Acesso', desc: 'Obter cópia dos dados que mantemos.' },
                  { right: 'Correção', desc: 'Retificar dados incompletos ou incorretos.' },
                  { right: 'Anonimização ou bloqueio', desc: 'Solicitar anonimização ou bloqueio de dados desnecessários.' },
                  { right: 'Portabilidade', desc: 'Receber seus dados em formato exportável (JSON disponível em Configurações).' },
                  { right: 'Eliminação', desc: 'Solicitar exclusão permanente de todos os seus dados (direito ao esquecimento).' },
                  { right: 'Revogação do consentimento', desc: 'Retirar seu consentimento a qualquer momento, sem prejuízo de tratamentos anteriores.' },
                  { right: 'Informação sobre compartilhamento', desc: 'Saber com quais entidades seus dados são compartilhados.' },
                  { right: 'Petição à ANPD', desc: 'Reclamar ao órgão regulador (Autoridade Nacional de Proteção de Dados).' },
                ].map(({ right, desc }) => (
                  <div key={right} className="p-3 bg-background border border-border rounded-lg">
                    <p className="font-semibold text-foreground text-sm">{right}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Para exercer seus direitos, entre em contato pelo e-mail{' '}
                <a href="mailto:signal@venatorvictor.com" className="text-primary hover:underline">signal@venatorvictor.com</a>.
                Responderemos em até <strong className="text-foreground">15 dias úteis</strong>, conforme Art. 18, §5º da LGPD.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Caso não receba resposta satisfatória, você pode peticionar à{' '}
                <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Autoridade Nacional de Proteção de Dados (ANPD)
                </a>.
              </p>
            </Section>

            {/* 11. Alterações */}
            <Section icon={FileText} title="11. Alterações nesta Política">
              <p className="text-muted-foreground leading-relaxed">
                Esta política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas através do próprio aplicativo.
                A data de "Última atualização" no topo desta página indica a versão vigente.
                O uso continuado do serviço após alterações implica concordância com os novos termos.
              </p>
            </Section>

            {/* 12. Contato */}
            <Section icon={Mail} title="12. Contato">
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas, solicitações de direitos ou reclamações relacionadas a esta Política de Privacidade:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 ml-2 mt-3 text-sm">
                <li>📧 <a href="mailto:signal@venatorvictor.com" className="text-primary hover:underline">signal@venatorvictor.com</a></li>
                <li>💼 <a href="https://github.com/Venator-Victor/vindexvalor/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub — abra uma issue</a></li>
                <li>🔗 <a href="https://www.linkedin.com/in/victor-schramm/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn — Victor Schramm</a></li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Página de <Link to="/suporte" className="text-primary hover:underline">Suporte</Link> disponível dentro do aplicativo.
              </p>
            </Section>

          </div>

          <div className="mt-8 text-center">
            <Button size="lg" className="px-8 font-semibold shadow-md" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="py-6 border-t border-border mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} VindexValor — Victor Schramm. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;