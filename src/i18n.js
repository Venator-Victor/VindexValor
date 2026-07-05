import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US'];

const detectLanguage = () => {
  if (typeof window === 'undefined') return 'pt-BR';

  const saved = localStorage.getItem('language');
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;

  const browserLanguages = navigator.languages || [navigator.language];
  for (const lang of browserLanguages) {
    if (SUPPORTED_LANGUAGES.includes(lang)) return lang;
    const base = lang.split('-')[0];
    const match = SUPPORTED_LANGUAGES.find((supported) => supported.startsWith(base));
    if (match) return match;
  }

  return 'pt-BR';
};

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
  lng: detectLanguage(),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => localStorage.setItem('language', lng));
}

export default i18n;