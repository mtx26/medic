import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enabledLanguageCodes } from './config/languages';

const translationFiles = import.meta.glob('./locales/*/translation.json', { eager: true });

const resources = {};

for (const path in translationFiles) {
  const match = path.match(/\.\/locales\/(.*?)\/translation\.json$/);
  if (match) {
    const lang = match[1];
    if (enabledLanguageCodes.includes(lang)) {
      resources[lang] = { translation: translationFiles[path].default };
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
