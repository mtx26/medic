import React, { useState } from 'react';
import { resetPassword } from "../services/authService";

function ResetPassword() {
  const [email, setEmail] = useState(""); // État pour l'adresse e-mail

  
  // 🔄 Réinitialisation du mot de passe
  const handleReset = (e) => {
    e.preventDefault();
    resetPassword(email);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: "500px", width: "100%", borderRadius: "1rem" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>Réinitialiser le mot de passe</h5>
            <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
          </div>

          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-outline-primary w-100">
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
