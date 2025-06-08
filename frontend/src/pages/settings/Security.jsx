import React, { useState, useContext } from 'react';
import { updateUserPassword } from '../../services/authService';
import { UserContext } from '../../contexts/UserContext';
import AlertSystem from '../../components/AlertSystem';
import { supabase } from '../../services/supabaseClient';

const Security = ({ sharedProps }) => {
  // 👤 Contexte utilisateur
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  // 🔒 Changement de mot de passe
  const [oldPassword, setOldPassword] = useState(''); // État pour l'ancien mot de passe
  const [newPassword, setNewPassword] = useState(''); // État pour le nouveau mot de passe
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false); // État pour l'affichage de l'ancien mot de passe
  const [newPasswordVisible, setNewPasswordVisible] = useState(false); // État pour l'affichage du nouveau mot de passe

  // ⚠️ Alertes
  const [alertMessage, setAlertMessage] = useState(null); // État pour le message d'alerte
  const [alertType, setAlertType] = useState("info"); // État pour le type d'alerte (par défaut : info)

  const isGoogleUser = userInfo?.provider === 'google';

  const reauthenticate = async () => {
    if (!userInfo || !oldPassword) throw new Error('Ancien mot de passe requis.');
    const { error } = await supabase.auth.updateUser({
      password: oldPassword,
    });
    if (error) throw new Error(error.message);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await reauthenticate();
      await updateUserPassword(newPassword);

      setAlertType('success');
      setAlertMessage('✅ Mot de passe mis à jour avec succès.');

      // Réinitialiser les champs
      setNewPassword('');
      setOldPassword('');

    } catch (error) {
      setAlertType('danger');
      setAlertMessage(error.message);
    }
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Gestion de compte</h2>

      <AlertSystem
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertMessage(null)}
      />

      <div className="mb-4">
        <h5>Email actuel:</h5>
        <p>{userInfo.email}</p>
      </div>

      {isGoogleUser ? (
        <div className="alert alert-info">
          Connecté avec Google. Vous ne pouvez pas modifier votre email ou mot de passe.
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword}>
          {/* Champ Username visible */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              aria-label="Email"
              autoComplete="email"
              className="form-control"
              value={userInfo?.email || ''}
              readOnly
            />
          </div>

          {/* Ancien mot de passe */}
          <div className="mb-3 position-relative">
            <label htmlFor="oldPassword" className="form-label">Mot de passe actuel</label>
            <input
              type={oldPasswordVisible ? "text" : "password"}
              className="form-control"
              id="oldPassword"
              name="current-password"
              aria-label="Mot de passe actuel"
              autoComplete="current-password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Entrez le mot de passe actuel"
            />
            <i
              className={`bi bi-${oldPasswordVisible ? "eye-slash" : "eye"} position-absolute`}
              role="button"
              tabIndex="0"
              aria-label={oldPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
              onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOldPasswordVisible(!oldPasswordVisible);
                }
              }}
            ></i>

          </div>

          {/* Nouveau mot de passe */}
          <div className="mb-3 position-relative">
            <label htmlFor="newPassword" className="form-label">Nouveau mot de passe</label>
            <input
              type={newPasswordVisible ? "text" : "password"}
              className="form-control"
              id="newPassword"
              name="new-password"
              aria-label="Nouveau mot de passe"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Entrez le nouveau mot de passe"
              required
            />
            <i
              className={`bi bi-${newPasswordVisible ? "eye-slash" : "eye"} position-absolute`}
              role="button"
              tabIndex="0"
              aria-label={newPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
              onClick={() => setNewPasswordVisible(!newPasswordVisible)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setNewPasswordVisible(!newPasswordVisible);
                }
              }}
            ></i>
          </div>

          <button
            type="submit"
            className="btn btn-outline-primary mt-2"
            aria-label="Mettre à jour le mot de passe"
            title="Mettre à jour le mot de passe"
          >
            Mettre à jour le mot de passe
          </button>
        </form>
      )}
    </div>
  );
};

export default Security;
