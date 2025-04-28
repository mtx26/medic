import React, { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { updateUserEmail, updateUserPassword } from '../services/authService';
import { getGlobalReloadUser } from '../contexts/UserContext';
import { auth } from '../services/firebase';
import AlertSystem from '../components/AlertSystem';

const AccountPage = () => {
  const reloadUserInfo = getGlobalReloadUser();
  const user = auth.currentUser;

  const [oldPassword, setOldPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);

  const isGoogleUser = user?.providerData.some((provider) => provider.providerId === "google.com");

  const reauthenticate = async () => {
    if (!user || !oldPassword) throw new Error('Ancien mot de passe requis.');
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const handleUpdateEmail = async () => {
    setAlert({ type: '', message: '' });
    try {
      await reauthenticate();
      await updateUserEmail(newEmail);
      reloadUserInfo();
      setAlert({ type: 'success', message: 'Email updated successfully.' });
      setNewEmail('');
    } catch (error) {
      setAlert({ type: 'danger', message: error.message });
    }
  };

  const handleUpdatePassword = async () => {
    setAlert({ type: '', message: '' });
    try {
      await reauthenticate();
      await updateUserPassword(newPassword);
      setAlert({ type: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
    } catch (error) {
      setAlert({ type: 'danger', message: error.message });
    }
  };


  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Account Management</h2>

      <AlertSystem
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      <div className="mb-4">
        <h5>Current Email:</h5>
        <p>{user.email}</p>
      </div>

      {isGoogleUser ? (
        <div className="alert alert-info">
          Connected with Google. You cannot modify your email or password.
        </div>
      ) : (
        <>
          {/* Current Password */}
          <div className="mb-3 position-relative">
            <label htmlFor="oldPassword" className="form-label">Current Password</label>
            <input
              type={oldPasswordVisible ? "text" : "password"}
              className="form-control"
              id="oldPassword"
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

          {/* New Email */}
          <div className="mb-3 position-relative">
            <label htmlFor="newEmail" className="form-label">New Email</label>
            <input
              type="email"
              className="form-control"
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
            />
            <button className="btn btn-outline-primary mt-2" onClick={handleUpdateEmail}>
              Update Email
            </button>
          </div>

          {/* New Password */}
          <div className="mb-3 position-relative">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              type={newPasswordVisible ? "text" : "password"}
              className="form-control"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <i
              className={`bi bi-${newPasswordVisible ? "eye-slash" : "eye"} position-absolute`}
              style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
              onClick={() => setNewPasswordVisible(!newPasswordVisible)}
            ></i>
            <button className="btn btn-outline-primary mt-2" onClick={handleUpdatePassword}>
              Update Password
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountPage;
