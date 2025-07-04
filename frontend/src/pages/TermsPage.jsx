import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslation } from 'react-i18next';

function TermsSection({ titleKey, paragraphs = [], list = [], conclusionKey }) {
  const { t } = useTranslation();
  return (
    <>
      <h3>
        <i className="bi bi-file-earmark-text me-2" />
        {t(titleKey)}
      </h3>
      {paragraphs.map((pKey) => (
        <p key={pKey}>{t(pKey)}</p>
      ))}
      {list.length > 0 && (
        <ul>
          {list.map((itemKey) => (
            <li key={itemKey}>{t(itemKey)}</li>
          ))}
        </ul>
      )}
      {conclusionKey && <p>{t(conclusionKey)}</p>}
      <hr />
    </>
  );
}

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <section className="container my-5">
      <>
        <h2>
          <i className="bi bi-file-text me-2" />
          {t('terms.title')}
        </h2>
        <p>
          <strong>{t('terms.last_update')}</strong>
        </p>

        <TermsSection
          titleKey="terms.section1.title"
          paragraphs={['terms.section1.p1', 'terms.section1.p2']}
        />

        <TermsSection
          titleKey="terms.section2.title"
          paragraphs={['terms.section2.intro']}
          list={[
            'terms.section2.list.item1',
            'terms.section2.list.item2',
            'terms.section2.list.item3',
          ]}
          conclusionKey="terms.section2.disclaimer"
        />

        <TermsSection
          titleKey="terms.section3.title"
          paragraphs={['terms.section3.intro']}
          list={[
            'terms.section3.list.item1',
            'terms.section3.list.item2',
          ]}
          conclusionKey="terms.section3.conclusion"
        />

        <TermsSection
          titleKey="terms.section4.title"
          paragraphs={['terms.section4.content']}
        />

        <TermsSection
          titleKey="terms.section5.title"
          paragraphs={['terms.section5.p1', 'terms.section5.p2']}
          list={[
            'terms.section5.list.item1',
            'terms.section5.list.item2',
            'terms.section5.list.item3',
          ]}
        />

        <TermsSection
          titleKey="terms.section6.title"
          paragraphs={['terms.section6.intro']}
          list={[
            'terms.section6.list.item1',
            'terms.section6.list.item2',
          ]}
          conclusionKey="terms.section6.conclusion"
        />

        <TermsSection
          titleKey="terms.section7.title"
          paragraphs={['terms.section7.content']}
        />

        <h3>
          <i className="bi bi-info-circle me-2" />
          {t('terms.section8.title')}
        </h3>
        <p>{t('terms.section8.intro')}</p>
        <p>
          <strong>Matis Gillet</strong>
          <br />
          <i className="bi bi-envelope-fill me-1" />
          <a href="mailto:mtx_26@outlook.be">mtx_26@outlook.be</a>
          <br />
          <i className="bi bi-globe me-1" />
          <a href="https://meditime-app.com" target="_blank" rel="noreferrer">
            meditime-app.com
          </a>
          <br />
          <i className="bi bi-github me-1" />
          <a href="https://github.com/mtx26" target="_blank" rel="noreferrer">
            GitHub – mtx26
          </a>
        </p>
      </>
    </section>
  );
}
