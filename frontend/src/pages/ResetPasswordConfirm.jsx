import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import AlertSystem from '../components/AlertSystem';
import { log } from '../utils/logger';

export default function ResetPasswordConfirm() {
  const [password, setPassword] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertMessage, setAlertMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      const hash = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
  
      if (!access_token || !refresh_token) {
        log.error("Token manquant dans l'URL", null, {
          origin: 'RESET_PASSWORD_CONFIRM',
        });
        setAlertType('danger');
        setAlertMessage("Lien de réinitialisation invalide ou expiré.");
        return;
      }
  
      console.log(access_token);
      console.log(refresh_token);
  
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  
      if (error) {
        log.error("Erreur lors du setSession", error.message, {
          origin: 'RESET_PASSWORD_CONFIRM',
        });
        setAlertType('danger');
        setAlertMessage("Session invalide. Merci de redemander un lien.");
        return;
      }
  
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      if (!session || !session.user) {
        setAlertType('danger');
        setAlertMessage("Session invalide. Merci de redemander un lien.");
        return;
      }
  
      setSessionReady(true);
      log.info("Session rétablie avec succès", {
        origin: 'RESET_PASSWORD_CONFIRM',
        uid: session.user.id,
      });
    };
  
    initSession();
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!sessionReady) {
      setAlertType('danger');
      setAlertMessage("Impossible de modifier le mot de passe : session invalide.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      log.error("Erreur lors du changement de mot de passe", error, {
        origin: "RESET_PASSWORD_CONFIRM",
      });
      setAlertType('danger');
      setAlertMessage(error.message);
    } else {
      setAlertType('success');
      setAlertMessage("Votre mot de passe a bien été modifié.");
      setTimeout(() => navigate('/login'), 2500);
    }

    setLoading(false);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: '500px', width: '100%', borderRadius: '1rem' }}>
        <div className="card-body p-4">
          <h5 className="text-center mb-3">🔐 Nouveau mot de passe</h5>
          <p className="text-muted text-center">
            Saisissez un nouveau mot de passe pour votre compte MediTime.
          </p>
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Nouveau mot de passe</label>
              <input
                type="password"
                id="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || !sessionReady}
            >
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
