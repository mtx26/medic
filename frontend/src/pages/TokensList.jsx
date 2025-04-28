import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem'; 
import { useNavigate } from "react-router-dom";

const REACT_URL = process.env.REACT_APP_REACT_URL;

function TokensList({ tokens }) {
  const { authReady, currentUser } = useContext(AuthContext);
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [alertTokenId, setAlertTokenId] = useState(null);
  const navigate = useNavigate();
  const [loadingTokens, setLoadingTokens] = useState(true);
  useEffect(() => {
    const load = async () => {
      if (authReady && currentUser) {
        setLoadingTokens(true);
        await tokens.fetchTokens();
        setLoadingTokens(false);
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

  if (loadingTokens) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des liens partagés...</span>
        </div>
      </div>
    );
  }
  return (
<div className="container mt-4" style={{ maxWidth: "1000px" }}>
  <h2 className="mb-4">Gestion des calendriers partagés</h2>
  {Object.entries(groupedTokens).map(([calendarName, data]) => (
    <div key={calendarName} className="mb-4">
      <h4>{calendarName} :</h4>
      <ul className="list-group">
        {data.tokens.map((token) => (
          <div>
            <span className="me-3"> Lien de partage :</span>
            {alertMessage && alertTokenId === token.token && (
              <AlertSystem
                type={alertType}
                message={alertMessage}
                onClose={() => {
                  setAlertMessage("");
                  setOnConfirmAction(null);
                  setAlertTokenId(null);
                }}
                onConfirm={() => {
                  if (onConfirmAction) onConfirmAction();
                }}
              />
            )}

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

              {/* expiration date */}
              <div className="ms-3">
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="neverExpireCheckbox"
                    checked={token.expires_at === "never"}
                    onChange={(e) => tokens.updateTokenExpiration(token.token, e.target.checked ? "never" : new Date().toISOString().slice(0, 16))}
                    title="Ne jamais expirer"
                  />
                  <label className="form-check-label" htmlFor="neverExpireCheckbox">
                    Ne jamais expirer
                  </label>
                </div>

                <input
                  type="date"
                  className="form-control"
                  value={
                    token.expires_at !== "never"
                      ? new Date(token.expires_at).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      tokens.updateTokenExpiration(token.token, dateValue + "T00:00");
                    }
                  }}
                  title="Date d'expiration"
                />
              </div>
              
              {/* permissions */}
              <div className="ms-3">
                <div className="form-check">
                  <select 
                  className="form-select" 
                  value={token.permissions} 
                  onChange={(e) => tokens.updateTokenPermissions(token.token, e.target.value)} 
                  title="Permissions">
                    <option value="read">Lecture seule</option>
                    <option value="edit">Lecture + Édition</option>
                  </select>
                </div>
              </div>


              <div className="btn-group ms-3" role="group">
                <button
                  type="button"
                  className={`btn ${token.revoked ? 'btn-outline-danger' : 'btn-outline-success'}`}
                  onClick={() => tokens.revokeToken(token.token)}
                  title={token.revoked ? "Réactiver le lien" : "Désactiver le lien"}
                >
                  <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => {
                    setAlertType("confirm-danger");
                    setAlertMessage("❌ Confirmez-vous la suppression du lien de partage ?");
                    setOnConfirmAction(() => () => {
                      tokens.deleteSharedCalendar(token.token);
                    });
                    setAlertTokenId(token.token);
                  }}
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
