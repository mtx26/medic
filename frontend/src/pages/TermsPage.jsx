import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <section className="container my-5">
      <>
        <h2>{t('terms.title')}</h2>
        <p>
          <strong>{t('terms.last_update')}</strong>
        </p>

        <h3>{t('terms.section1.title')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('terms.section1.p1') }} />
        <p>{t('terms.section1.p2')}</p>

        <hr />

        <h3>{t('terms.section2.title')}</h3>
        <p>{t('terms.section2.p1')}</p>
        <ul>
          <li>{t('terms.section2.item1')}</li>
          <li>{t('terms.section2.item2')}</li>
          <li>{t('terms.section2.item3')}</li>
        </ul>
        <p>{t('terms.section2.p2')}</p>

        <hr />

        <h3>{t('terms.section3.title')}</h3>
        <p>{t('terms.section3.p1')}</p>
        <ul>
          <li>{t('terms.section3.item1')}</li>
          <li>{t('terms.section3.item2')}</li>
        </ul>
        <p>{t('terms.section3.p2')}</p>

        <hr />

        <h3>{t('terms.section4.title')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('terms.section4.p1') }} />

        <hr />

        <h3>{t('terms.section5.title')}</h3>
        <p>{t('terms.section5.p1')}</p>
        <p>{t('terms.section5.p2')}</p>
        <ul>
          <li>{t('terms.section5.item1')}</li>
          <li>{t('terms.section5.item2')}</li>
          <li>{t('terms.section5.item3')}</li>
        </ul>

        <hr />

        <h3>{t('terms.section6.title')}</h3>
        <p>{t('terms.section6.p1')}</p>
        <ul>
          <li>{t('terms.section6.item1')}</li>
          <li>{t('terms.section6.item2')}</li>
        </ul>
        <p>{t('terms.section6.p2')}</p>

        <hr />

        <h3>{t('terms.section7.title')}</h3>
        <p>{t('terms.section7.p1')}</p>

        <hr />

        <h3>{t('terms.section8.title')}</h3>
        <p>{t('terms.section8.p1')}</p>
        <p>
          <strong>Matis Gillet</strong>
          <br />
          📧 <a href="mailto:mtx_26@outlook.be">mtx_26@outlook.be</a>
          <br />
          🌐{' '}
          <a href="https://meditime-app.com" target="_blank">
            meditime-app.com
          </a>
          <br />
          🐙{' '}
          <a href="https://github.com/mtx26" target="_blank">
            GitHub – mtx26
          </a>
        </p>
      </>
    </section>
  );
}
