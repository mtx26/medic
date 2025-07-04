import { useTranslation } from 'react-i18next';

function NotFound() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('not_found.title')}</h1>
      <p>{t('not_found.message')}</p>
    </div>
  );
}

export default NotFound;
