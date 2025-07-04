// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getGlobalReloadUser } from '../contexts/UserContext';
import { log } from '../utils/logger';
import { useTranslation } from 'react-i18next';

const AuthCallback = () => {
  const navigate = useNavigate();
  const reloadUser = getGlobalReloadUser();
  const { t } = useTranslation();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        log.error(t('auth_callback.session_error'), error?.message, {
          origin: "CALLBACK_ERROR",
          uid: null,
        });
        return navigate('/login');
      }

      const user = session.user;
      reloadUser();

      log.info(t('auth_callback.success'), {
        origin: "CALLBACK_SUCCESS",
        uid: user.id,
      });

      navigate('/'); // redirection vers ta page principale
    };

    handleRedirect();
  }, [navigate, reloadUser]);

  return <p>{t('auth_callback.loading')}</p>;
};

export default AuthCallback;
