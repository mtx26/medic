import React, { useState } from 'react';
import { resetPassword } from '../services/authService';
import AlertSystem from '../components/AlertSystem';

function ResetPassword() {
  const [email, setEmail] = useState(''); // État pour l'adresse e-mail
  const [formValid, setFormValid] = useState(true);
  const [alertType, setAlertType] = useState('info');
  const [alertMessage, setAlertMessage] = useState(null);

  // 🔄 Réinitialisation du mot de passe
  const handleReset = async (e) => {
    e.preventDefault();
    const isFormValid =
      typeof email === 'string' && email.includes('@') && email.includes('.');
    setFormValid(isFormValid);
    if (isFormValid) {
      try {
        await resetPassword(email);
      } catch (error) {}
      setAlertType('success');
      setAlertMessage(
        'Un lien de réinitialisation a été envoyé à votre adresse email.'
      );
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div
        className="card shadow"
        style={{ maxWidth: '500px', width: '100%', borderRadius: '1rem' }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>Réinitialiser le mot de passe</h5>
            <p>
              Entrez votre adresse email pour recevoir un lien de
              réinitialisation.
            </p>
          </div>
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">
                Email
              </label>
              <input
                type="email"
                className={`form-control ${!formValid ? 'is-invalid' : ''}`}
                id="emailInput"
                aria-label="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="btn btn-outline-primary w-100"
              type="submit"
              disabled={!formValid}
              aria-label="Envoyer le lien"
              title="Envoyer le lien"
            >
              <i className="bi bi-envelope-paper"></i>
              <span> Envoyer le lien</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
