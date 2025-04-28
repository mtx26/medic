import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { AuthContext } from "../contexts/LoginContext";
import { handleLogout } from "../services/authService";

function Navbar() {
  const { userInfo } = useContext(UserContext);
  const { setLogin } = useContext(AuthContext);

  console.log(userInfo);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
          <i class="bi bi-capsule"></i>
          <span> Medic Copresser</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-2">
            <li className="nav-item">
              <Link to="/" className="nav-link px-3 py-2 rounded">
              <i class="bi bi-calendar-date"></i> 
              <span> Liste des calendriers</span>
              </Link>
            </li>
            {userInfo?.role === "admin" && (
              <li className="nav-item">
                <Link to="/admin" className="nav-link px-3 py-2 rounded">
                <i class="bi bi-lock"></i>
                <span> Admin</span>
                </Link>
              </li>
            )}

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
                    <li><Link className="dropdown-item" to="/profile"><i class="bi bi-person"></i><span> Mon profil</span></Link></li>
                    <li><Link className="dropdown-item" to="/settings"><i class="bi bi-gear"></i><span> Paramètres</span></Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={() => handleLogout(setLogin)}>
                      <i class="bi bi-unlock"></i>
                      <span> Déconnexion</span>
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link className="dropdown-item" to="/login"><i class="bi bi-box-arrow-in-right"></i><span> Connexion</span></Link></li>
                    <li><Link className="dropdown-item" to="/register"><i class="bi bi-person-plus"></i><span> Inscription</span></Link></li>
                  </>
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
