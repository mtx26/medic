import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GoogleHandleLogin, registerWithEmail, loginWithEmail } from "../services/authService";
import AlertSystem from "../components/AlertSystem";
import { getFirebaseAuthErrorMessage } from "../utils/getFirebaseAuthErrorMessage";
import { log } from "../utils/logger";


function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");


  const location = useLocation();

  useEffect(() => {
    setActiveTab(location.pathname === "/register" ? "register" : "login");
  }, [location.pathname]);

  const switchTab = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow-sm w-100" style={{ maxWidth: "500px", borderRadius: "1rem" }}>
        <div className="card-body p-4">
          {/* Tabs */}
          <ul className="nav nav-pills nav-justified mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                onClick={() => switchTab("login")}
              >
                Connexion
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "register" ? "active" : ""}`}
                onClick={() => switchTab("register")}
              >
                Inscription
              </button>
            </li>
          </ul>

          {/* Auth Form */}
          <div className="text-center mb-3">
            <p>{activeTab === "login" ? "Se connecter avec :" : "S'inscrire avec :"}</p>
            <button className="btn btn-outline-danger rounded-pill px-4 py-2" onClick={GoogleHandleLogin}>
              <i className="fab fa-google me-2"></i> Google
            </button>
            <p className="text-center mt-3 mb-0 text-muted">ou avec email :</p>
          </div>

          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />


          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (activeTab === "login") {
                  await loginWithEmail(email, password);
                  setAlertMessage("Connexion réussie !");
                  setAlertType("success");
                } else {
                  await registerWithEmail(email, password, name);
                  setAlertMessage("Inscription réussie !");
                  setAlertType("success");
                }
              } catch (err) {
                log.error("Firebase auth error", {
                  id: "AUTH-ERROR",
                  origin: "App.js",
                  stack: err.stack,
                });
                setAlertMessage(getFirebaseAuthErrorMessage(err.code));
                setAlertType("danger");
              }
            }}
          >
            {activeTab === "register" && (
              <div className="mb-3">
                <label className="form-label">Nom complet</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label">Mot de passe</label>
              <input
                type={passwordVisible ? "text" : "password"}
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`fas fa-${passwordVisible ? "eye-slash" : "eye"} position-absolute`}
                style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
                onClick={() => setPasswordVisible(!passwordVisible)}
              ></i>
            </div>

            {activeTab === "login" && (
              <div className="mb-3 text-end">
                <a href="/reset-password" className="text-decoration-none">Mot de passe oublié ?</a>
              </div>
            )}

            {activeTab === "register" && (
              <div className="form-check mb-3 text-left">
                <input className="form-check-input" type="checkbox" required id="terms" />
                <label className="form-check-label" htmlFor="terms">
                  J’accepte les <a href="#" className="text-decoration-none">conditions générales</a>
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100">
              {activeTab === "login" ? "Se connecter" : "S'inscrire"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
