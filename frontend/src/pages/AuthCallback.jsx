// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getGlobalReloadUser } from '../contexts/UserContext';
import { log } from '../utils/logger';

const AuthCallback = () => {
  const navigate = useNavigate();
  const reloadUser = getGlobalReloadUser();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        log.error("Échec de récupération de session après OAuth", error?.message, {
          origin: "CALLBACK_ERROR",
          uid: null,
        });
        return navigate('/login');
      }

      const user = session.user;
      reloadUser();

      log.info("Connexion réussie via callback", {
        origin: "CALLBACK_SUCCESS",
        uid: user.id,
      });

      navigate('/'); // redirection vers ta page principale
    };

    handleRedirect();
  }, [navigate, reloadUser]);

  return <p>Connexion en cours...</p>;
};

export default AuthCallback;
