import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <section className="container my-5">
      <>
        <h2><i className="bi bi-shield-lock-fill me-2" />{t('privacy.title')}</h2>
        <p>
          <strong>{t('privacy.last_update')}</strong>
        </p>

        <h3>{t('privacy.section1.title')}</h3>
        <p>{t('privacy.section1.content')}</p>

        <hr />

        <h3>{t('privacy.section2.title')}</h3>

        <h4><i className="bi bi-person-badge-fill me-2" />{t('privacy.section2.personal_data.title')}</h4>
        <ul>
          <li>{t('privacy.section2.personal_data.email')}</li>
          <li>{t('privacy.section2.personal_data.uid')}</li>
        </ul>

        <h4><i className="bi bi-capsule-pill me-2" />{t('privacy.section2.treatment_data.title')}</h4>
        <ul>
          <li>{t('privacy.section2.treatment_data.medicines')}</li>
          <li>{t('privacy.section2.treatment_data.boxes')}</li>
          <li>{t('privacy.section2.treatment_data.history')}</li>
        </ul>

        <h4><i className="bi bi-phone me-2" />{t('privacy.section2.tech_data.title')}</h4>
        <ul>
          <li>{t('privacy.section2.tech_data.tokens')}</li>
          <li>{t('privacy.section2.tech_data.device')}</li>
        </ul>

        <hr />

        <h3>{t('privacy.section3.title')}</h3>
        <ul>
          <li>{t('privacy.section3.sync')}</li>
          <li>{t('privacy.section3.reminders')}</li>
          <li>{t('privacy.section3.sharing')}</li>
          <li>{t('privacy.section3.stability')}</li>
        </ul>
        <p>
          <strong>{t('privacy.section3.no_ads')}</strong>
        </p>

        <hr />

        <h3>{t('privacy.section4.title')}</h3>
        <ul>
          <li>{t('privacy.section4.supabase')}</li>
          <li>{t('privacy.section4.firebase')}</li>
        </ul>
        <p>{t('privacy.section4.location')}</p>

        <hr />

        <h3>{t('privacy.section5.title')}</h3>
        <ul>
          <li>{t('privacy.section5.encryption')}</li>
          <li>{t('privacy.section5.auth')}</li>
          <li>{t('privacy.section5.passwords')}</li>
        </ul>

        <hr />

        <h3>{t('privacy.section6.title')}</h3>
        <p>{t('privacy.section6.intro')}</p>
        <ul>
          <li>{t('privacy.section6.access')}</li>
          <li>{t('privacy.section6.delete')}</li>
          <li>{t('privacy.section6.revoke')}</li>
          <li>{t('privacy.section6.disable')}</li>
        </ul>
        <p>
          {t('privacy.section6.contact')} <br />
          <i className="bi bi-envelope-fill me-2" />
          <a href="mailto:mtx_26@outlook.be">
            <strong>mtx_26@outlook.be</strong>
          </a>
        </p>

        <hr />

        <h3>{t('privacy.section7.title')}</h3>
        <p>
          {t('privacy.section7.developer')}
          <br />
          <i className="bi bi-envelope-fill me-2" />
          <a href="mailto:mtx_26@outlook.be">mtx_26@outlook.be</a>
          <br />
          <i className="bi bi-globe me-2" />
          <a href="https://meditime-app.com" target="_blank" rel="noreferrer">
            meditime-app.com
          </a>
          <br />
          <i className="bi bi-github me-2" />
          <a href="https://github.com/mtx26" target="_blank" rel="noreferrer">
            GitHub – mtx26
          </a>
        </p>
      </>
    </section>
  );
}
