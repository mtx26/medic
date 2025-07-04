import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlagsSelect from 'react-flags-select';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language?.toUpperCase() || 'FR');

  const onSelect = (code) => {
    setSelected(code);
    const lang = code === 'FR' ? 'fr' : 'en'; // adapte selon map
    i18n.changeLanguage(lang);
  };

  return (
    <ReactFlagsSelect
      selected={selected}
      onSelect={onSelect}
      countries={['FR', 'GB']}        // langues disponibles
      customLabels={{ FR: 'Français', GB: 'English' }}
      placeholder="Choisissez une langue"
      searchable={false}
      showSelectedLabel={true}
      showOptionLabel={true}
      optionsSize={14}
      selectedSize={14}
      alignOptions="right"
    />
  );
}

export default LanguageSelector;
