import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem'; 

const REACT_URL = process.env.REACT_APP_REACT_URL;

function SharedList({ tokens, calendars, sharedUsers }) {
  const { authReady, currentUser } = useContext(AuthContext);
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [alertTokenId, setAlertTokenId] = useState(null);
  const [alertUserId, setAlertUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true);
  const [groupedShared, setGroupedShared] = useState({});
  const [expiresAt, setExpiresAt] = useState(null);
  const [permissions, setPermissions] = useState("read");

  useEffect(() => {
    const load = async () => {
      if (authReady && currentUser) {
        await tokens.fetchTokens();
        await calendars.fetchCalendars();
        setLoading(false);
      }
    };
    load();
  }, [authReady, currentUser, calendars.fetchCalendars, tokens.fetchTokens]);

  const setGroupedSharedFunction = async () => {
    const grouped = {};

    for (const calendar of calendars.calendarsData) {
      grouped[calendar] = {
        tokens: [],
        users: [],
      };
    }

    for (const token of tokens.tokensList) {
      const name = token.calendar_name;
      if (grouped[name]) {
        grouped[name].tokens.push(token);
      }
    }

    for (const calendar of calendars.calendarsData) {
      const users = await sharedUsers.fetchSharedUsers(calendar);
      grouped[calendar].users = users;
    }

    setGroupedShared(grouped);
    setLoadingGroupedShared(false);
  };
  
  useEffect(() => {
    if (loading === false && authReady && currentUser && calendars.calendarsData) {
      setGroupedSharedFunction();
    }
  }, [loading, authReady, currentUser, calendars.calendarsData, tokens.tokensList]);
  

  if (loading || loadingGroupedShared) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des liens partagés...</span>
        </div>
      </div>
    );
  };


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des calendriers partagés</h2>

      {Object.entries(groupedShared).map(([calendarName, data]) => (
        <div key={calendarName}>
          <div className="mb-4">
            <h4>{calendarName} :</h4>
            <ul className="list-group">
              <h6 className="mt-4">Liens de partage :</h6>
              {data.tokens.map((token) => (
              <div key={token.token}>
                  {alertMessage && alertTokenId === token.token && (
                      <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage("");
                        setOnConfirmAction(null);
                        setAlertTokenId(null);
                      }}
                      onConfirm={async () => {
                        if (onConfirmAction) await onConfirmAction();
                      }}
                    />
                  )}
                  
                  <li key={token.token} className="list-group-item">
                    <div className="row align-items-center g-2">
                      {/* Lien */}
                      <div className="col-md-5">
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={`${REACT_URL}/shared-calendar/${token.token}`}
                            readOnly
                          />
                          <button
                            className="btn btn-outline-primary"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`${REACT_URL}/shared-calendar/${token.token}`);
                                setAlertType("success");
                                setAlertMessage("👍 Lien de partage copié dans le presse-papiers.");
                                setAlertTokenId(token.token);
                              } catch (error) {
                                setAlertType("danger");
                                setAlertMessage("❌ Une erreur est survenue lors de la copie du lien de partage.");
                                setAlertTokenId(token.token);
                              }
                            }}
                            title="Copier le lien"
                          >
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </div>

                      {/* Jamais + Expiration */}
                      <div className="col-md-3 d-flex align-items-center gap-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`neverExpire-${token.token}`}
                          checked={token.expires_at === ""}
                          onChange={(e) =>
                            tokens.updateTokenExpiration(token.token, e.target.checked ? "" : new Date().toISOString().slice(0, 16))
                          }
                          title="Expire jamais"
                        />
                        <label className="form-check-label" htmlFor={`neverExpire-${token.token}`} title="Expire jamais">Jamais</label>
                        <input
                          type="date"
                          className="form-control"
                          style={{ minWidth: "120px" }}
                          value={token.expires_at !== "" ? new Date(token.expires_at).toISOString().split("T")[0] : ""}
                          onChange={(e) => tokens.updateTokenExpiration(token.token, e.target.value + "T00:00")}
                          title="Expiration"
                        />
                      </div>

                      {/* Permissions */}
                      <div className="col-md-2">
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

                      {/* Actions */}
                      <div className="col-md-2 d-flex justify-content-end gap-2">
                        <button
                          className={`btn ${token.revoked ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={async () => {
                            const success = await tokens.revokeToken(token.token)
                            if (success) {
                              setAlertType("success");
                              setAlertMessage(token.revoked ? "👍 Lien de partage réactivé avec succès." : "👍 Lien de partage désactivé avec succès.");
                              setAlertTokenId(token.token);
                            } else {
                              setAlertType("danger");
                              setAlertMessage(token.revoked ? "❌ Une erreur est survenue lors de la réactivation du lien de partage." : "❌ Une erreur est survenue lors de la désactivation du lien de partage.");
                              setAlertTokenId(token.token);
                            }
                          }}
                          title={token.revoked ? "Réactiver" : "Désactiver"}
                        >
                          <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => {
                            setAlertType("confirm-danger");
                            setAlertMessage("❌ Confirmez-vous la suppression du lien de partage ?");
                            setAlertTokenId(token.token);
                            setOnConfirmAction(() => async () => {
                              const success = await tokens.deleteSharedTokenCalendar(token.token)
                              if (success) {
                                setAlertType("success");
                                setAlertMessage("👍 Lien de partage supprimé avec succès.");
                                setAlertTokenId(token.token);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ Une erreur est survenue lors de la suppression du lien de partage.");
                                setAlertTokenId(token.token);
                              }
                            });
                          }}
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>

                  </li>

              </div>
              ))}
              <li className="list-group-item">
                <div className="row align-items-center g-2">
                  <h6 className="col-md-4">Ajouter un lien de partage</h6>

                  {/* Jamais + Expiration */}
                  <div className={`d-flex align-items-center gap-2 ${expiresAt === null ? 'col-md-2' : 'col-md-4'}`}>
                    <select
                      className="form-select"
                      value={expiresAt === null ? '' : 'date'}
                      title="Expire jamais"
                      onChange={(e) => {
                        setExpiresAt(e.target.value === '' ? null : '');
                      }}
                    >
                      <option value=''>Jamais</option>
                      <option value="date">Choisir une date</option>
                    </select>
                    {expiresAt !== null && (
                      <input
                        type="date"
                        className="form-control"
                        style={{ minWidth: "120px" }}
                        title="Expiration"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                    )}
                  </div>
                  
                  {/* Permissions */}
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={permissions}
                      title="Permissions"
                      onChange={(e) => {
                        setPermissions(e.target.value);
                      }}
                    >
                      <option value="read">Lecture seule</option>
                      <option value="edit">Lecture + Édition</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className={`d-flex justify-content-end gap-2 ${expiresAt === null ? 'col-md-4' : 'col-md-2'}`}>
                    <button 
                    className="btn btn-outline-primary"
                    title="Ajouter"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              </li>
            </ul>
            <ul className="list-group">
              <h6 className="mt-4">Utilisateurs partagés :</h6>
              {data.users.map((user) => (
                <div key={user.receiver_uid}>
                  {alertMessage && alertUserId === user.receiver_uid && (
                      <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage("");
                        setOnConfirmAction(null);
                        setAlertUserId(null);
                      }}
                      onConfirm={() => {
                        if (onConfirmAction) onConfirmAction();
                      }}
                    />
                  )}
                  <li key={user.receiver_uid} className="list-group-item px-3">
                    <div className="row align-items-center g-2">
                      {/* Email */}
                      <div className="col-md-3">
                        <strong>{user.receiver_email}</strong>
                      </div>

                      {/* Statut */}
                      <div className="col-md-5">
                        <span className={`badge rounded-pill ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}>
                          {user.accepted ? "Accepté" : "En attente"}
                        </span>
                      </div>

                      {/* Permissions*/}
                      <div className="col-md-2">
                          <select
                            className="form-select"
                            value={user.access}
                            onChange={(e) => {
                              setAlertType("info");
                              setAlertMessage("Vous ne pouvez pas modifier l'accès d'un utilisateur partagé.");
                              setAlertUserId(user.receiver_uid);
                            }}
                            title="Accès"
                            disabled={true}
                          >
                            <option value="read">Lecture seule</option>
                            <option value="edit">Lecture + Édition</option>
                          </select>
                        </div>

                      {/* 🗑️ Supprimer */}
                      <div className="col-md-2 d-flex justify-content-end">
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => {
                            setAlertType("confirm-danger");
                            setAlertMessage("❌ Confirmez-vous la suppression de l'accès à ce calendrier ?");
                            setAlertUserId(user.receiver_uid);
                            setOnConfirmAction(() => async () => {
                              const success = await sharedUsers.deleteSharedUser(calendarName, user.receiver_uid)
                              if (success) {
                                setAlertType("success");
                                setAlertMessage("👍 L'accès a été supprimé avec succès.");
                                setAlertUserId(user.receiver_uid);
                                setTimeout(async () => {
                                  await setGroupedSharedFunction();
                                }, 1000);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ Une erreur est survenue lors de la suppression de l'accès.");
                                setAlertUserId(user.receiver_uid);
                              }
                            });                            
                          }}
                          title="Supprimer l'accès"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>

                  </li>
                </div>
              ))}
            </ul>
          </div>
          {Object.entries(groupedShared).length > 1 && (
            <hr />
          )}
        </div>
      ))}
    </div>
  );
}

export default SharedList;
