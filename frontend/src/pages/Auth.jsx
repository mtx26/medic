import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GoogleHandleLogin,
  registerWithEmail,
  loginWithEmail,
  GithubHandleLogin,
  TwitterHandleLogin,
  DiscordHandleLogin,
  FacebookHandleLogin
} from '../services/authService';
import AlertSystem from '../components/AlertSystem';
import { getSupabaseErrorMessage } from '../utils/SupabaseErrorMessage';
import { useTranslation } from 'react-i18next';
import { log } from '../utils/logger';
import { Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

function Auth() {
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  // 👤 Authentification utilisateur
  const [email, setEmail] = useState(''); // État pour l'adresse e-mail
  const [password, setPassword] = useState(''); // État pour le mot de passe
  const [name, setName] = useState(''); // État pour le nom d'utilisateur
  const [passwordVisible, setPasswordVisible] = useState(false); // État pour l'affichage du mot de passe
  const [activeTab, setActiveTab] = useState('login'); // État pour l'onglet actif (login/register)

  // ⚠️ Alertes
  const [alertMessage, setAlertMessage] = useState(null); // État pour le message d'alerte
  const [alertType, setAlertType] = useState('info'); // État pour le type d'alerte (par défaut : info)
  const [duration, setDuration] = useState(2000); // État pour la durée de l'alerte

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setActiveTab(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  const switchTab = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div
        className="card shadow-sm w-100"
        style={{ maxWidth: '500px', borderRadius: '1rem' }}
      >
        <div className="card-body p-4">
          {/* Tabs */}
          <ul className="nav nav-pills nav-justified mb-4">
            <li className="nav-item">
              <button
                className={` shadow-sm nav-link ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
                aria-label={t('auth.login-tab')}
                title={t('auth.login-tab')}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                <span> {t('auth.login-tab')}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={` shadow-sm nav-link ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => switchTab('register')}
                aria-label={t('auth.register-tab')}
                title={t('auth.register-tab')}
              >
                <i className="bi bi-person-plus"></i>
                <span> {t('auth.register-tab')}</span>
              </button>
            </li>
          </ul>

          {/* Auth Form */}
          <div className="text-center mb-3">
            <p>
              {activeTab === 'login'
                ? t('auth.login-with')
                : t('auth.register-with')}
            </p>
            <div className="gap-1 d-flex justify-content-center align-items-center flex-wrap">
              <div className="d-flex flex-column align-items-center">
                <div className="px-2">
                  <button
                    className="btn btn-outline-danger rounded-pill py-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={GoogleHandleLogin}
                    aria-label={t('auth.login-with-google')}
                    title={t('auth.login-with-google')}
                  >
                    <i className="bi bi-google fs-4"></i>
                  </button>
                </div>
                <span>{t('auth.google')}</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className="px-2">
                  <button
                    className="btn btn-outline-secondary rounded-pill py-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={GithubHandleLogin}
                    aria-label={t('auth.login-with-github')}
                    title={t('auth.login-with-github')}
                  >
                    <i className="bi bi-github fs-4"></i>
                  </button>
                </div>
                <span>{t('auth.github')}</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className="px-2">
                  <button
                    className="btn btn-outline-primary rounded-pill py-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={DiscordHandleLogin}
                    aria-label={t('auth.login-with-discord')}
                    title={t('auth.login-with-discord')}
                  >
                    <i className="bi bi-discord fs-4"></i>
                  </button>
                </div>
                <span>{t('auth.discord')}</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className="px-2">
                  <button
                    className="btn btn-outline-info rounded-pill py-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={TwitterHandleLogin}
                    aria-label={t('auth.login-with-twitter')}
                    title={t('auth.login-with-twitter')}
                  >
                    <i className="bi bi-twitter fs-4"></i>
                  </button>
                </div>
                <span>{t('auth.twitter')}</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className="px-2">
                  <button
                    className="btn btn-outline-primary rounded-pill py-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={FacebookHandleLogin}
                    aria-label={t('auth.login-with-facebook')}
                    title={t('auth.login-with-facebook')}
                  >
                    <i className="bi bi-facebook fs-4"></i>
                  </button>
                </div>
                <span>{t('auth.facebook')}</span>
              </div>
            </div>
            <p className="text-center mt-3 mb-0 text-muted">{t('auth.or-with-email')}</p>
          </div>

          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
            duration={duration}
          />

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (activeTab === 'login') {
                  const error = await loginWithEmail(email, password);
                  if (error) {
                    setAlertMessage('❌ ' + t(getSupabaseErrorMessage(error.message)));
                    setAlertType('danger');
                  } else {
                    log.info('Connexion réussie', {
                      id: 'LOGIN-SUCCESS',
                      origin: 'Auth.jsx',
                      user: userInfo.uid,
                    });
                  }
                } else {
                  const error = await registerWithEmail(email, password, name);
                  if (error) {
                    console.log(error.message);
                    setAlertMessage('❌ ' + t(getSupabaseErrorMessage(error.message)));
                    setAlertType('danger');
                  } else {
                    setDuration(5000);
                    setAlertMessage('📩 ' + t('auth.verification-link-sent'));
                    setAlertType('success');
                    log.info('Inscription réussie', {
                      id: 'REGISTER-SUCCESS',
                      origin: 'Auth.jsx',
                      user: userInfo.uid,
                    });
                  }
                }
              } catch (err) {
                log.error('Supabase auth error', {
                  id: 'AUTH-ERROR',
                  origin: 'Auth.jsx',
                  stack: err.stack,
                });
              }
            }}
          >
            {activeTab === 'register' && (
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  {t('auth.full-name-label')}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  aria-label={t('auth.full-name-label')}
                  required
                  value={name}
                  autoComplete={activeTab === 'login' ? 'name' : 'new-name'}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                {t('auth.email-label')}
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                aria-label={t('auth.email-label')}
                required
                value={email}
                autoComplete={activeTab === 'login' ? 'email' : 'new-email'}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3 position-relative">
              <label htmlFor="password" className="form-label">
                {t('auth.password-label')}
              </label>
              <input
                type={passwordVisible ? 'text' : 'password'}
                className="form-control"
                id="password"
                aria-label={t('auth.password-label')}
                required
                value={password}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`bi bi-${passwordVisible ? 'eye-slash' : 'eye'} position-absolute`}
                role="button"
                tabIndex="0"
                aria-label={
                  passwordVisible
                    ? t('auth.hide-password')
                    : t('auth.show-password')
                }
                style={{
                  top: '38px',
                  right: '15px',
                  cursor: 'pointer',
                  color: '#6c757d',
                }}
                onClick={() => setPasswordVisible(!passwordVisible)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPasswordVisible(!passwordVisible);
                  }
                }}
              ></i>
            </div>

            {activeTab === 'login' && (
              <div className="mb-3 text-end">
                <Link to="/reset-password" className="text-decoration-none">
                  {t('auth.forgot-password')}
                </Link>
              </div>
            )}

            {activeTab === 'register' && (
              <div
                className="form-check mb-3 text-left"
                style={{ cursor: 'pointer' }}
              >
                <input
                  className="form-check-input"
                  style={{ cursor: 'pointer' }}
                  type="checkbox"
                  required
                  id="terms"
                  name="terms"
                  aria-label={t('auth.accept-terms-aria')}
                />
                <label
                  className="form-check-label"
                  style={{ cursor: 'pointer' }}
                  htmlFor="terms"
                >
                  {t('auth.accept-terms')} {' '}
                  <Link to="/terms" className="text-decoration-none">
                    {t('terms')}
                  </Link>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-outline-primary w-100 shadow-sm"
              aria-label={
                activeTab === 'login'
                  ? t('auth.login-submit')
                  : t('auth.register-submit')
              }
              title={
                activeTab === 'login'
                  ? t('auth.login-submit')
                  : t('auth.register-submit')
              }
            >
              {activeTab === 'login'
                ? t('auth.login-submit')
                : t('auth.register-submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
