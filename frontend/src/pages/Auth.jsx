import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GoogleHandleLogin, registerWithEmail, loginWithEmail, handleLogout } from "../services/authService";
import AlertSystem from "../components/AlertSystem";
import { getFirebaseAuthErrorMessage } from "../utils/getFirebaseAuthErrorMessage";
import { log } from "../utils/logger";
import { useNavigate } from "react-router-dom";



function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");


  const location = useLocation();
  const navigate = useNavigate();

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
                <i className="bi bi-box-arrow-in-right"></i>
                <span> Connexion</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "register" ? "active" : ""}`}
                onClick={() => switchTab("register")}
              >
                <i className="bi bi-person-plus"></i>
                <span> Inscription</span>
              </button>
            </li>
          </ul>

          {/* Auth Form */}
          <div className="text-center mb-3">
            <p>{activeTab === "login" ? "Se connecter avec :" : "S'inscrire avec :"}</p>
            <button className="btn btn-outline-danger rounded-pill px-3 py-2" onClick={GoogleHandleLogin}>
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
                  
                } else {
                  await registerWithEmail(email, password, name);
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
                autoComplete="email"
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
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`bi bi-${passwordVisible ? "eye-slash" : "eye"} position-absolute`}
                style={{ top: "38px", right: "15px", cursor: "pointer", color: "#6c757d" }}
                onClick={() => setPasswordVisible(!passwordVisible)}
              ></i>
            </div>

            {activeTab === "login" && (
              <div className="mb-3 text-end">
                <a onClick={() => navigate("/reset-password")} className="text-decoration-none">Mot de passe oublié ?</a>
              </div>
            )}

            {activeTab === "register" && (
              <div className="form-check mb-3 text-left">
                <input className="form-check-input" type="checkbox" required id="terms" />
                <label className="form-check-label" htmlFor="terms">
                  J’accepte les <a onClick={() => navigate("/terms")} className="text-decoration-none">conditions générales</a>
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-outline-primary w-100">
              {activeTab === "login" ? "Connexion" : "Inscription"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
