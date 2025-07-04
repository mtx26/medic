import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';

function Footer() {
  const location = useLocation();
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();

  const hiddenFooterRoutes = [
    '/login',
    '/register',
    '/reset-password',
    '/verify-email',
  ];

  const shouldShowFooter = !hiddenFooterRoutes.includes(location.pathname);
  if (!shouldShowFooter) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-light border-top mt-5 pt-4 pb-3 d-none d-lg-block">
      <div className="container">
        <div className="row gy-4 align-items-center">
          {/* Colonne liens */}
          <div className="col-md-8">
            <div className="row gy-2">
              <div className="col-sm-6">
                <ul className="list-unstyled">
                  <li>
                    <i className="bi bi-house me-2 text-primary"></i>
                    <Link
                      to="/"
                      className="text-muted text-decoration-none link-hover"
                    >
                      {t('home')}
                    </Link>
                  </li>
                  <li>
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    <Link
                      to="/about"
                      className="text-muted text-decoration-none link-hover"
                    >
                      {t('about')}
                    </Link>
                  </li>
                  <li>
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                    <Link
                      to="/terms"
                      className="text-muted text-decoration-none link-hover"
                    >
                      {t('terms')}
                    </Link>
                  </li>
                  <li>
                    <i className="bi bi-shield-lock me-2 text-primary"></i>
                    <Link
                      to="/privacy"
                      className="text-muted text-decoration-none link-hover"
                    >
                      {t('privacy')}
                    </Link>
                  </li>
                </ul>
              </div>
              {userInfo && (
                <div className="col-sm-6">
                  <ul className="list-unstyled">
                    <li>
                      <i className="bi bi-person-gear me-2 text-primary"></i>
                      <Link
                        to="/account"
                        className="text-muted text-decoration-none link-hover"
                      >
                        {t('account')}
                      </Link>
                    </li>
                    <li>
                      <i className="bi bi-calendar2-week me-2 text-primary"></i>
                      <Link
                        to="/calendars"
                        className="text-muted text-decoration-none link-hover"
                      >
                        {t('my_calendars')}
                      </Link>
                    </li>
                    <li>
                      <i className="bi bi-box-arrow-up me-2 text-primary"></i>
                      <Link
                        to="/shared-calendars"
                        className="text-muted text-decoration-none link-hover"
                      >
                        {t('shared_calendars')}
                      </Link>
                    </li>
                    <li>
                      <i className="bi bi-bell me-2 text-primary"></i>
                      <Link
                        to="/notifications"
                        className="text-muted text-decoration-none link-hover"
                      >
                        {t('notifications')}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
              <div className="col-sm-6">
                <ul className="list-unstyled">
                  <li>
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    <a
                      href="mailto:mtx_26@hotmail.com"
                      className="text-muted text-decoration-none link-hover"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('contact')}
                    </a>
                  </li>
                  <li>
                    <i className="bi bi-github me-2 text-primary"></i>
                    <a
                      href="https://github.com/mtx26/medic"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted text-decoration-none link-hover"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Logo + copyright */}
          <div className="col-md-4 text-md-end text-center">
            <div className="fw-bold text-primary fs-5">
              <i className="bi bi-capsule me-2"></i> MediTime
            </div>
            <div className="text-muted small">
              © {currentYear} — {t('rights_reserved')}
            </div>
          </div>
        </div>
      </div>

      {/* Style pour le hover souligné */}
      <style>{`
        .link-hover:hover {
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}

export default Footer;
