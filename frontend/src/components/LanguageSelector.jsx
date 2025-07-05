import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlagsSelect from 'react-flags-select';

const LANGUAGES = {
  FR: { code: 'fr', label: 'Français' },
  GB: { code: 'en', label: 'English' },
  RU: { code: 'ru', label: 'Русский' },
  TR: { code: 'tr', label: 'Türkçe' },      // à activer plus tard
  CN: { code: 'zh', label: '中文' },          // à activer plus tard
  SA: { code: 'ar', label: 'العربية' },     // à activer plus tard
  ES: { code: 'es', label: 'Español' },     // à activer plus tard
};

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState('FR');

  useEffect(() => {
    const currentCode = Object.entries(LANGUAGES).find(
      ([, val]) => val.code === i18n.language
    )?.[0] || 'FR';
    setSelected(currentCode);
  }, [i18n.language]);

  const onSelect = (countryCode) => {
    setSelected(countryCode);
    const lang = LANGUAGES[countryCode]?.code || 'fr';
    i18n.changeLanguage(lang);
  };

  const enabledCountries = ['FR', 'GB', 'RU']; // ➕ ajoute ici TR, CN, etc. plus tard
  const customLabels = Object.fromEntries(
    enabledCountries.map(code => [code, LANGUAGES[code].label])
  );

  return (
    <ReactFlagsSelect
      selected={selected}
      onSelect={onSelect}
      countries={enabledCountries}
      customLabels={customLabels}
      placeholder="Choisissez une langue"
      searchable={false}
      showSelectedLabel
      showOptionLabel
      optionsSize={14}
      selectedSize={14}
      alignOptions="right"
    />
  );
}

export default LanguageSelector;
