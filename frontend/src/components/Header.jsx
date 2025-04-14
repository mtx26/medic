import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
          💊 Medic Copresser
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
          <ul className="navbar-nav gap-2">
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link px-3 py-2 rounded`}
              >
                📅 Calendrier
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/medicaments"
                className={`nav-link px-3 py-2 rounded`}
              >
                💊 Médicaments
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
