import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';

function HomePage() {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  
  const handleAccess = () => navigate('/calendars');
  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <>
      <header className="bg-light border-bottom shadow-sm py-5 rounded-3">
        <div className="container text-center">
          <i className="bi bi-capsule display-1 text-primary" aria-hidden="true"></i>
          <h1 className="mt-3 fw-bold text-primary">{t('app.title')}</h1>
          <p className="lead text-muted">{t('app.subtitle')}</p>
          <div className="mt-4 d-flex flex-column flex-md-row justify-content-center gap-3">
            {userInfo ? (
              <button
                className="btn btn-primary btn-lg px-4"
                onClick={handleAccess}
                aria-label={t('app.access')}
                title={t('app.access')}
              >
                {t('app.access')}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-lg px-4 shadow rounded-3"
                  onClick={handleLogin}
                  aria-label={t('app.login')}
                  title={t('app.login')}
                >
                  {t('app.login')}
                </button>
                <button
                  className="btn btn-outline-primary btn-lg px-4 shadow rounded-3"
                  onClick={handleRegister}
                  aria-label={t('app.register')}
                  title={t('app.register')}
                >
                  {t('app.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="container py-5">
        <div className="row text-center mb-5">
          <div className="col-md-4">
            <i className="bi bi-calendar-check display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">{t('features.title1')}</h3>
            <p>{t('features.desc1')}</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-people display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">{t('features.title2')}</h3>
            <p>{t('features.desc2')}</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-lock-fill display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">{t('features.title3')}</h3>
            <p>{t('features.desc3')}</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="fw-bold text-primary">{t('why.title')}</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '800px' }}>
            {t('why.desc')}
          </p>
        </div>
      </section>

      <section className="bg-light py-5">
        <div className="container text-center">
          <h2 className="fw-bold text-primary mb-4">{t('testimonials.title')}</h2>
          <blockquote className="blockquote mx-auto" style={{ maxWidth: '700px' }}>
            <p className="mb-3 fst-italic">{t('testimonials.quote')}</p>
            <footer className="blockquote-footer">{t('testimonials.author')}</footer>
          </blockquote>
        </div>
      </section>

      <section className="bg-white border-top py-5">
        <div className="container text-center">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <i className="bi bi-phone display-1 text-primary" aria-hidden="true"></i>
            </div>
            <div className="col-md-6">
              <h2 className="fw-bold text-primary mb-3">{t('mobile.title')}</h2>
              <p className="text-muted">{t('mobile.desc')}</p>
              <ul className="list-unstyled text-start d-inline-block mt-3">
                <li>
                  <i className="bi bi-check-circle-fill text-primary me-2"></i>
                  {t('mobile.feature1')}
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-primary me-2"></i>
                  {t('mobile.feature2')}
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-primary me-2"></i>
                  {t('mobile.feature3')}
                </li>
              </ul>

              {isIOS && (
                <div
                  className="alert alert-info mt-4"
                  dangerouslySetInnerHTML={{ __html: t('mobile.ios') }}
                />
              )}

              {isAndroid && (
                <div
                  className="alert alert-info mt-4"
                  dangerouslySetInnerHTML={{ __html: t('mobile.android') }}
                />
              )}

              {!isIOS && !isAndroid && (
                <div className="alert alert-secondary mt-4">
                  {t('mobile.other')}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold">{t('cta.title')}</h2>
          <p className="lead mb-4">{t('cta.desc')}</p>
          <button
            className="btn btn-light btn-lg px-4"
            onClick={handleRegister}
            aria-label={t('app.register')}
            title={t('app.register')}
          >
            {t('cta.button')}
          </button>
        </div>
      </section>

      <section className="bg-white border-top py-4">
        <div className="container text-center">
          <a
            href="/privacy"
            className="text-muted text-decoration-none small me-3"
          >
            {t('privacy')}
          </a>
          <span className="text-muted small">|</span>
          <a
            href="/terms"
            className="text-muted   text-decoration-none small ms-3"
          >
            {t('terms')}
          </a>
        </div>
      </section>
    </>
  );
}

export default HomePage;
