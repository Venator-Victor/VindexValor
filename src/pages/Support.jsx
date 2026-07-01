import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronDown } from '@/components/BxIcon';

const Support = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  const faqGroups = [
    {
      group: t('support.faq_group_start'),
      items: [
        { question: t('support.faq_q1'), answer: t('support.faq_a1') },
        { question: t('support.faq_q2'), answer: t('support.faq_a2') },
        { question: t('support.faq_q3'), answer: t('support.faq_a3') },
        { question: t('support.faq_q4'), answer: t('support.faq_a4') },
        { question: t('support.faq_q5'), answer: t('support.faq_a5') },
        { question: t('support.faq_q6'), answer: t('support.faq_a6') },
      ],
    },
    {
      group: t('support.faq_group_transactions'),
      items: [
        { question: t('support.faq_q7'), answer: t('support.faq_a7') },
        { question: t('support.faq_q8'), answer: t('support.faq_a8') },
        { question: t('support.faq_q9'), answer: t('support.faq_a9') },
      ],
    },
    {
      group: t('support.faq_group_simulators'),
      items: [
        { question: t('support.faq_q10'), answer: t('support.faq_a10') },
        { question: t('support.faq_q11'), answer: t('support.faq_a11') },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>VindexValor - {t('support.title')}</title>
        <meta name="description" content={t('support.subtitle')} />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-vindex-text mb-2">{t('support.title')}</h1>
        <p className="text-gray-500 dark:text-vindex-text/70">{t('support.subtitle')}</p>
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-vindex-text mb-4">{t('support.faq_title')}</h2>
        <div className="space-y-6">
          {(() => {
            let globalIndex = 0;
            return faqGroups.map((group) => (
              <div key={group.group}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-vindex-text/40 mb-2 px-1">
                  {group.group}
                </p>
                <div className="space-y-2">
                  {group.items.map((faq) => {
                    const idx = globalIndex++;
                    return (
                      <div
                        key={idx}
                        className={`bg-gray-50 dark:bg-vindex-bg rounded-lg overflow-hidden border transition-colors ${
                          openFaq === idx
                            ? 'border-l-2 border-primary border-t border-r border-b border-gray-200 dark:border-vindex-border/50'
                            : 'border-gray-200 dark:border-vindex-border/50'
                        }`}
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-vindex-border/30 transition-colors"
                        >
                          <span className="text-gray-900 dark:text-vindex-text font-medium pr-4">{faq.question}</span>
                          <ChevronDown
                            size={20}
                            className={`text-gray-500 dark:text-vindex-text/60 transition-transform duration-200 flex-shrink-0 ${
                              openFaq === idx ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </button>
                        {openFaq === idx && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 pb-4 pt-0"
                          >
                            <p className="text-gray-600 dark:text-vindex-text/70 text-sm leading-relaxed">{faq.answer}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* CTA */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-vindex-border/30 flex items-center justify-between">
          <p className="text-sm text-gray-400 dark:text-vindex-text/50">{t('support.not_found')}</p>
          <a
            href="https://github.com/Venator-Victor/vindexvalor/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('support.open_issue')}
          </a>
        </div>
      </motion.div>

      {/* Contact cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-vindex-text mb-3">{t('support.contact_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://github.com/Venator-Victor/vindexvalor/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-vindex-bg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-700 dark:text-vindex-text group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-vindex-text font-medium group-hover:text-primary transition-colors">{t('support.contact_github_title')}</p>
              <p className="text-sm text-gray-500 dark:text-vindex-text/60 mt-0.5">{t('support.contact_github_desc')}</p>
            </div>
          </a>

          <a
            href="mailto:signal@venatorvictor.com"
            className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-vindex-bg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-700 dark:text-vindex-text group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-vindex-text font-medium group-hover:text-primary transition-colors">{t('support.contact_email_title')}</p>
              <p className="text-sm text-gray-500 dark:text-vindex-text/60 mt-0.5">signal@venatorvictor.com</p>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/in/victor-schramm/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border flex items-center gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-vindex-bg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-700 dark:text-vindex-text group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 dark:text-vindex-text font-medium group-hover:text-primary transition-colors">{t('support.contact_linkedin_title')}</p>
              <p className="text-sm text-gray-500 dark:text-vindex-text/60 mt-0.5">victor-schramm</p>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Support;