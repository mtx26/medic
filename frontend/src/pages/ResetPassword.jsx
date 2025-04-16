import React, { useState } from 'react';
import { resetPassword } from "../services/authService";

function ResetPassword() {
  const [email, setEmail] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    resetPassword(email);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: "500px", width: "100%", borderRadius: "1rem" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>Reset Password</h5>
            <p>Enter your email address to receive a reset link.</p>
          </div>

          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
