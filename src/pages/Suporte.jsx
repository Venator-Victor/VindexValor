import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, Envelope, Phone, MessageDots } from '@/components/BxIcon';

const Suporte = () => {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      question: 'O que é um Ativo e Passivo?',
      answer: 'Ativos são bens e direitos que você possui e que têm valor (dinheiro, investimentos, imóveis). Passivos são suas obrigações financeiras, ou seja, dívidas e contas a pagar.',
    },
    {
      question: 'O que é Patrimônio Líquido?',
      answer: 'É o resultado da subtração dos seus Passivos (o que você deve) dos seus Ativos (o que você tem). É a medida real da sua riqueza acumulada.',
    },
    {
      question: 'O que é Receita e Despesa?',
      answer: 'Receitas são entradas de dinheiro (salário, vendas, dividendos). Despesas são saídas de dinheiro (contas, compras, pagamentos).',
    },
    {
      question: 'O que é Saldo?',
      answer: 'É o valor disponível em uma conta em um determinado momento. Ele é calculado somando as receitas e subtraindo as despesas daquela conta.',
    },
    {
      question: 'Quanto preciso colocar na Reserva de Emergência?',
      answer: 'Especialistas recomendam guardar entre 3 a 6 meses do seu custo de vida mensal. Esse valor deve estar em uma aplicação segura e de fácil resgate.',
    },
    {
      question: 'O que são Juros?',
      answer: 'Juros são o "custo do dinheiro". Quando você investe, você recebe juros (o dinheiro trabalha para você). Quando você pega um empréstimo ou parcela compras, você paga juros (o custo de usar o dinheiro de outra pessoa).',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Mensagem enviada!",
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>VindexValor - Suporte</title>
        <meta name="description" content="Central de ajuda e suporte ao cliente" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-vindex-text mb-2">Suporte</h1>
        <p className="text-gray-500 dark:text-vindex-text/70">Encontre respostas ou entre em contato conosco</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Perguntas Frequentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-vindex-bg rounded-lg overflow-hidden border border-gray-200 dark:border-vindex-border/50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-vindex-border/30 transition-colors"
                >
                  <span className="text-gray-900 dark:text-vindex-text font-medium">{faq.question}</span>
                  <ChevronDown size={20} className={`text-gray-500 dark:text-vindex-text/60 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-3"
                  >
                    <p className="text-gray-600 dark:text-vindex-text/70 text-sm">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">Entre em Contato</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text focus:ring-2 focus:ring-vindex-success/50 outline-none"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text focus:ring-2 focus:ring-vindex-success/50 outline-none"
                required
              />
            </div>
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text focus:ring-2 focus:ring-vindex-success/50 outline-none"
                required
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-vindex-bg border border-gray-200 dark:border-vindex-border rounded-lg text-gray-900 dark:text-vindex-text resize-none focus:ring-2 focus:ring-vindex-success/50 outline-none"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-vindex-border dark:hover:bg-vindex-border/80 dark:text-vindex-text dark:border dark:border-vindex-border/50 rounded-lg">
              Enviar Mensagem
            </Button>
          </form>
        </motion.div>
      </div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Envelope size={24} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-vindex-text/60">Email</p>
            <p className="text-gray-900 dark:text-vindex-text font-medium">suporte@vindexvalor.com</p>
          </div>
        </div>

        <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-vindex-success/10 flex items-center justify-center">
            <Phone size={24} className="text-green-600 dark:text-vindex-success" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-vindex-text/60">Telefone</p>
            <p className="text-gray-900 dark:text-vindex-text font-medium">(11) 9999-9999</p>
          </div>
        </div>

        <div className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <MessageDots size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-vindex-text/60">Chat Online</p>
            <p className="text-gray-900 dark:text-vindex-text font-medium">Seg-Sex, 9h-18h</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Suporte;