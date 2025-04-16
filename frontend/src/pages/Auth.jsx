import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GoogleHandleLogin, registerWithEmail, loginWithEmail } from "../services/authService";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const location = useLocation();

  useEffect(() => {
    setActiveTab(location.pathname === "/register" ? "register" : "login");
  }, [location.pathname]);

  const switchTab = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: "500px", width: "100%", borderRadius: "1rem" }}>
        <div className="card-body p-4">
          {/* Tabs */}
          <ul className="nav nav-pills nav-justified mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>
                Login
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "register" ? "active" : ""}`} onClick={() => switchTab("register")}>
                Register
              </button>
            </li>
          </ul>

          {/* Login Form */}
          {activeTab === "login" && (
            <>
              <div className="text-center mb-3">
                <p>Sign in with:</p>
                <button className="btn btn-outline-dark rounded-circle" onClick={GoogleHandleLogin}>
                  <i className="fab fa-google"></i>
                </button>
                <p className="text-center mt-3">or:</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); loginWithEmail(email, password); }}>
                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-3 position-relative">
                  <label className="form-label">Password</label>
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

                <div className="mb-3 text-end">
                  <a href="/reset-password">Forgot password?</a>
                </div>

                <button type="submit" className="btn btn-primary w-100">Sign in</button>
              </form>
            </>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <>
              <div className="text-center mb-3">
                <p>Sign up with:</p>
                <button className="btn btn-outline-dark rounded-circle" onClick={GoogleHandleLogin}>
                  <i className="fab fa-google"></i>
                </button>
                <p className="text-center mt-3">or:</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); registerWithEmail(email, password, name); }}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-3 position-relative">
                  <label className="form-label">Password</label>
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

                <div className="form-check mb-3 text-center">
                  <input className="form-check-input" type="checkbox" required id="terms" />
                  <label className="form-check-label" htmlFor="terms">
                    I have read and agree to the terms
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-100">Sign up</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
