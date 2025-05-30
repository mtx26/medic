import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GoogleHandleLogin, registerWithEmail, loginWithEmail } from "../services/authService";
import AlertSystem from "../components/AlertSystem";
import { getFirebaseErrorMessage } from "../utils/FirebaseErrorMessage";
import { log } from "../utils/logger";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";



function Auth() {
  // 👤 Authentification utilisateur
  const [email, setEmail] = useState(""); // État pour l'adresse e-mail
  const [password, setPassword] = useState(""); // État pour le mot de passe
  const [name, setName] = useState(""); // État pour le nom d'utilisateur
  const [passwordVisible, setPasswordVisible] = useState(false); // État pour l'affichage du mot de passe
  const [activeTab, setActiveTab] = useState("login"); // État pour l'onglet actif (login/register)

  // ⚠️ Alertes
  const [alertMessage, setAlertMessage] = useState(null); // État pour le message d'alerte
  const [alertType, setAlertType] = useState("info"); // État pour le type d'alerte (par défaut : info)



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
                className={` shadow-sm nav-link ${activeTab === "login" ? "active" : ""}`}
                onClick={() => switchTab("login")}
                aria-label="Connexion"
                title="Connexion"
              >
                <i className="bi bi-box-arrow-in-right"></i>
                <span> Connexion</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={` shadow-sm nav-link ${activeTab === "register" ? "active" : ""}`}
                onClick={() => switchTab("register")}
                aria-label="Inscription"
                title="Inscription"
              >
                <i className="bi bi-person-plus"></i>
                <span> Inscription</span>
              </button>
            </li>
          </ul>

          {/* Auth Form */}
          <div className="text-center mb-3">
            <p>{activeTab === "login" ? "Se connecter avec :" : "S'inscrire avec :"}</p>
            <button 
              className="btn btn-outline-danger rounded-pill px-3 py-2 shadow-sm" 
              onClick={GoogleHandleLogin}
              aria-label="Connexion avec Google"
              title="Connexion avec Google"
            >
              <i className="bi bi-google"></i>
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
                  log.info("Connexion réussie", {
                    id: "LOGIN-SUCCESS",
                    origin: "Auth.jsx",
                    user: auth.currentUser,
                  });
                  
                } else {
                  await registerWithEmail(email, password, name);
                  log.info("Inscription réussie", {
                    id: "REGISTER-SUCCESS",
                    origin: "Auth.jsx",
                    user: auth.currentUser,
                  });
                }
              } catch (err) {
                log.error("Firebase auth error", {
                  id: "AUTH-ERROR",
                  origin: "App.js",
                  stack: err.stack,
                });
                setAlertMessage("❌ " + getFirebaseErrorMessage(err.code));
                setAlertType("danger");
              }
            }}
          >
            {activeTab === "register" && (
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Nom complet</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  aria-label="Nom complet"
                  required
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                id="email"
                aria-label="Adresse e-mail"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3 position-relative">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                type={passwordVisible ? "text" : "password"}
                className="form-control"
                id="password"
                aria-label="Mot de passe"
                required
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`bi bi-${passwordVisible ? "eye-slash" : "eye"} position-absolute`}
                role="button"
                tabIndex="0"
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
                onClick={() => setPasswordVisible(!passwordVisible)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPasswordVisible(!passwordVisible);
                  }
                }}
              ></i>
            </div>

            {activeTab === "login" && (
              <div className="mb-3 text-end">
                <Link to="/reset-password" className="text-decoration-none">Mot de passe oublié ?</Link>
              </div>
            )}

            {activeTab === "register" && (
              <div 
                className="form-check mb-3 text-left"
                style={{ cursor: "pointer" }}
              >
                <input className="form-check-input" style={{ cursor: "pointer" }} type="checkbox" required id="terms" name="terms" aria-label="Accepter les conditions générales"/>
                <label className="form-check-label" style={{ cursor: "pointer" }} htmlFor="terms">
                  J’accepte les <Link to="/terms" className="text-decoration-none">conditions générales</Link>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-outline-primary w-100 shadow-sm"
              aria-label={activeTab === "login" ? "Connexion" : "Inscription"}
              title={activeTab === "login" ? "Connexion" : "Inscription"}
            >
              {activeTab === "login" ? "Connexion" : "Inscription"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
