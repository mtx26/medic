import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem'; // Si tu l'utilises
// Assure-toi que REACT_APP_REACT_URL est bien dans ton .env
const REACT_URL = process.env.REACT_APP_REACT_URL;

function TokensList({ tokens }) {
  const { authReady, currentUser } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      if (authReady && currentUser) {
        await tokens.fetchTokens();
      }
    };
    load();
  }, [authReady, currentUser]);
  
  const groupedTokens = tokens.tokensList.reduce((acc, token) => {
    if (!acc[token.calendar_name]) {
      acc[token.calendar_name] = { tokens: [], users: [] }; // users vide pour plus tard
    }
    acc[token.calendar_name].tokens.push(token);
    return acc;
  }, {});
  


  const handleToggleToken = (clickedToken) => {
    console.log("Toggle :", clickedToken);
  };

  const handleDeleteToken = (token) => {
    console.log("Supprimer :", token);
  };

  return (
<div className="container mt-4" style={{ maxWidth: "800px" }}>
  <h2 className="mb-4">Gestion des liens partagés</h2>

  {Object.entries(groupedTokens).map(([calendarName, data]) => (
    <div key={calendarName} className="mb-4">
      <h4>{calendarName} :</h4>
      <ul className="list-group">
        {data.tokens.map((token) => (
          <div>
            <span className="me-3"> Lien de partage :</span>
            <li
              key={token.token}
              className="list-group-item d-flex justify-content-between align-items-center"
              style={{ padding: "0.75rem 1rem", fontSize: "1rem" }}
            >
              <div className="d-flex align-items-center flex-wrap flex-grow-1">
                <div className="input-group" style={{ minWidth: "300px", maxWidth: "450px" }}>
                  <input
                    type="text"
                    className="form-control"
                    value={`${REACT_URL}/shared-calendar/${token.token}`}
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={async () => {
                      try {
                        const fullLink = `${REACT_URL}/shared-calendar/${token.token}`;
                        await navigator.clipboard.writeText(fullLink);
                        console.log("Lien copié :", fullLink);
                      } catch (err) {
                        console.error("Erreur lors de la copie :", err);
                      }
                    }}
                    title="Copier le lien"
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
              <div className="btn-group ms-3" role="group">
                <button
                  type="button"
                  className={`btn ${token.revoked ? 'btn-outline-danger' : 'btn-outline-success'}`}
                  onClick={() => handleToggleToken(token)}
                  title={token.revoked ? "Réactiver le lien" : "Désactiver le lien"}
                >
                  <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDeleteToken(token)}
                  title="Supprimer définitivement"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </li>
          </div>
        ))}
      </ul>

      {/* Ici tu pourras ajouter très facilement la liste des utilisateurs partagés */}
    </div>
  ))}
</div>

  
  );
}

export default TokensList;
