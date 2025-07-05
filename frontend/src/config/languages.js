export const LANGUAGES = [
  { flag: 'FR', code: 'fr', locale: 'fr-FR', label: 'Français' },
  { flag: 'US', code: 'en', locale: 'en-US', label: 'English' },
  { flag: 'ES', code: 'es', locale: 'es-ES', label: 'Español' },
  { flag: 'DE', code: 'de', locale: 'de-DE', label: 'Deutsch' },
  { flag: 'IT', code: 'it', locale: 'it-IT', label: 'Italiano' },
  { flag: 'JP', code: 'ja', locale: 'ja-JP', label: '日本語' },
  { flag: 'CN', code: 'zh', locale: 'zh-CN', label: '中文' },
  { flag: 'PT', code: 'pt', locale: 'pt-BR', label: 'Português' },
  { flag: 'RU', code: 'ru', locale: 'ru-RU', label: 'Русский' }
];

export const getLocale = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.locale || code;
};

export const getLabel = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.label || code;
};

export const enabledLanguageCodes = LANGUAGES.map(lang => lang.code);
