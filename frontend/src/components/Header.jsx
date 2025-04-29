import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { handleLogout } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  return (
    <>
      {/* NAVBAR PC */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 d-none d-lg-flex">
        <div className="container">
          <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
            <i className="bi bi-capsule"></i> Medic Copresser
          </Link>

          <div className="collapse navbar-collapse justify-content-end">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <i className="bi bi-calendar-date"></i> Calendriers
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/shared-calendar" className="nav-link">
                  <i className="bi bi-box-arrow-up"></i> Partagés
                </Link>
              </li>
              {userInfo?.role === "admin" && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link">
                    <i className="bi bi-lock"></i> Admin
                  </Link>
                </li>
              )}
              <li className="nav-item dropdown">
                <button
                  className="nav-link position-relative bg-transparent border-0"
                  type="button"
                  id="notifDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Notifications"
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notifications.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="notifDropdown" style={{ minWidth: "250px" }}>
                  {notifications.length === 0 ? (
                    <li className="dropdown-item text-muted">Aucune notification</li>
                  ) : (
                    notifications.map((notif) => (
                      <li key={notif.id} className="dropdown-item small">
                        {notif.message}
                      </li>
                    ))
                  )}
                </ul>
              </li>

              {/* Dropdown utilisateur */}
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle d-flex align-items-center border-0 bg-transparent"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {userInfo?.photoURL ? (
                    <img
                      src={userInfo.photoURL}
                      alt="Profil"
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <i className="fas fa-user-circle fa-lg me-2"></i>
                  )}
                  {userInfo?.displayName || "Compte"}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {userInfo ? (
                    <>
                      <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person"></i> Mon profil</Link></li>
                      <li><Link className="dropdown-item" to="/account"><i className="bi bi-gear"></i> Paramètres</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={handleLogout}><i className="bi bi-unlock"></i> Déconnexion</button></li>
                    </>
                  ) : (
                    <>
                      <li><Link className="dropdown-item" to="/login"><i className="bi bi-box-arrow-in-right"></i> Connexion</Link></li>
                      <li><Link className="dropdown-item" to="/register"><i className="bi bi-person-plus"></i> Inscription</Link></li>
                    </>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* NAVBAR MOBILE */}
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm py-2 d-lg-none">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
            <i className="bi bi-capsule"></i> Medic Copresser
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasNavbar"
            aria-controls="offcanvasNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="offcanvas offcanvas-end"
            tabIndex="-1"
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
                Menu
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav">
                {/* Navigation */}
                <li className="nav-item">
                  <button onClick={() => navigate("/")} className="nav-link" data-bs-dismiss="offcanvas">
                    <i className="bi bi-calendar-date"></i> Calendriers
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => navigate("/shared-calendar")} className="nav-link" data-bs-dismiss="offcanvas">
                    <i className="bi bi-box-arrow-up"></i> Partagés
                  </button>
                </li>
                {userInfo?.role === "admin" && (
                  <li className="nav-item">
                    <button onClick={() => navigate("/admin")} className="nav-link" data-bs-dismiss="offcanvas">
                      <i className="bi bi-lock"></i> Admin
                    </button>
                  </li>
                )}

                {userInfo && (
                  <>
                    <hr />
                    <li className="nav-item">
                      <button onClick={() => navigate("/profile")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-person"></i> Mon profil
                      </button>
                    </li>
                    <li className="nav-item">
                      <button onClick={() => navigate("/account")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-gear"></i> Paramètres
                      </button>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link btn btn-link text-start" onClick={handleLogout} data-bs-dismiss="offcanvas">
                        <i className="bi bi-unlock"></i> Déconnexion
                      </button>
                    </li>
                  </>
                )}

                {!userInfo && (
                  <>
                    <hr />
                    <li className="nav-item">
                      <button onClick={() => navigate("/login")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-box-arrow-in-right"></i> Connexion
                      </button>
                    </li>
                    <li className="nav-item">
                      <button onClick={() => navigate("/register")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-person-plus"></i> Inscription
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
