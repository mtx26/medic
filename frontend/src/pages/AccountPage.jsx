import React, { useState, useContext } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { updateUserPassword } from '../services/authService';
import { UserContext } from '../contexts/UserContext';
import AlertSystem from '../components/AlertSystem';
import { auth } from '../services/firebase';

const AccountPage = () => {
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


  const isGoogleUser = Array.isArray(userInfo?.providerData) && userInfo.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  const reauthenticate = async () => {
    if (!userInfo || !oldPassword) throw new Error('Ancien mot de passe requis.');
    const credential = EmailAuthProvider.credential(userInfo.email, oldPassword);
    const user = auth.currentUser;
    await reauthenticateWithCredential(user, credential);
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
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Account Management</h2>

      <AlertSystem
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertMessage(null)}
      />

      <div className="mb-4">
        <h5>Current Email:</h5>
        <p>{userInfo.email}</p>
      </div>

      {isGoogleUser ? (
        <div className="alert alert-info">
          Connecté avec Google. Vous ne pouvez pas modifier votre email ou mot de passe.
        </div>
      ) : (
        <form autoComplete="on" method="post" action="/">
          {/* Champ Username visible */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="username"
              autoComplete="username"
              className="form-control"
              value={userInfo?.email || ''}
              readOnly
            />
          </div>

          {/* Ancien mot de passe */}
          <div className="mb-3 position-relative">
            <label htmlFor="oldPassword" className="form-label">Current Password</label>
            <input
              type={oldPasswordVisible ? "text" : "password"}
              className="form-control"
              id="oldPassword"
              name="current-password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <i
              className={`bi bi-${oldPasswordVisible ? "eye-slash" : "eye"} position-absolute`}
              style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
              onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
            ></i>
          </div>

          {/* Nouveau mot de passe */}
          <div className="mb-3 position-relative">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              type={newPasswordVisible ? "text" : "password"}
              className="form-control"
              id="newPassword"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <i
              className={`bi bi-${newPasswordVisible ? "eye-slash" : "eye"} position-absolute`}
              style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
              onClick={() => setNewPasswordVisible(!newPasswordVisible)}
            ></i>
          </div>

          <button
            type="submit"
            className="btn btn-outline-primary mt-2"
            onClick={handleUpdatePassword}
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
};

export default AccountPage;
