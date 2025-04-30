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
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des calendriers partagés</h2>

      {Object.entries(groupedTokens).map(([calendarName, data]) => (
        <div key={calendarName} className="mb-4">
          <h4>{calendarName} :</h4>
          <ul className="list-group">
            {data.tokens.map((token) => (
            <div>
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
              className="list-group-item">
                <div className="row g-3 align-items-start">

                  <div className="col-12 col-lg-6">
                    <label className="form-label fw-semibold text-secondary">Lien de partage</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={`${REACT_URL}/shared-calendar/${token.token}`}
                        readOnly
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${REACT_URL}/shared-calendar/${token.token}`);
                          } catch (err) {
                            console.error("Erreur lors de la copie :", err);
                          }
                        }}
                        title="Copier le lien"
                      />
                      <button
                        className="btn btn-outline-primary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${REACT_URL}/shared-calendar/${token.token}`);
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

                  <div className="col-6 col-lg-2">
                    <label className="form-label fw-semibold text-secondary">Expiration</label>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`neverExpire-${token.token}`}
                        checked={token.expires_at === "never"}
                        onChange={(e) => tokens.updateTokenExpiration(
                          token.token,
                          e.target.checked ? "never" : new Date().toISOString().slice(0, 16)
                        )}
                      />
                      <label className="form-check-label" htmlFor={`neverExpire-${token.token}`}>
                        Jamais
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
                        const val = e.target.value;
                        if (val) tokens.updateTokenExpiration(token.token, val + "T00:00");
                      }}
                      title="Date d'expiration"
                    />
                  </div>

                  <div className="col-6 col-lg-2">
                    <label className="form-label fw-semibold text-secondary">Permissions</label>
                    <select
                      className="form-select"
                      value={token.permissions}
                      onChange={(e) => tokens.updateTokenPermissions(token.token, e.target.value)}
                      title="Permissions"
                    >
                      <option value="read">Lecture seule</option>
                      <option value="edit">Lecture + Édition</option>
                    </select>
                  </div>

                  <div className="col-12 col-lg-2">
                    <label className="form-label fw-semibold text-secondary">Actions</label>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className={`btn btn-sm ${token.revoked ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => tokens.revokeToken(token.token)}
                        title={token.revoked ? "Réactiver" : "Désactiver"}
                        style={{ width: "40px", height: "40px" }}
                      >
                        <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setAlertType("confirm-danger");
                          setAlertMessage("❌ Confirmez-vous la suppression du lien de partage ?");
                          setOnConfirmAction(() => () => tokens.deleteSharedTokenCalendar(token.token));
                          setAlertTokenId(token.token);
                        }}
                        title="Supprimer"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </div>
            ))}
          </ul>
        
        </div>
      ))}
    </div>
  );
}

export default TokensList;
