// Footer.js
import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-light border-top mt-5 py-3 text-center">
      <div className="container">
        <p className="mb-1 text-muted">
          © {new Date().getFullYear()} Medic Copresser — Tous droits réservés.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/about" className="text-decoration-none text-muted">
            À propos
          </Link>
          <Link to="/terms" className="text-decoration-none text-muted">
            Conditions d'utilisation
          </Link>
          <Link to="/privacy" className="text-decoration-none text-muted">
            Confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
