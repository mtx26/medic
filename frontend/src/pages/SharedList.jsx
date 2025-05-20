import React, { useEffect, useContext, useState, useCallback } from "react";
import { UserContext } from '../contexts/UserContext';
import AlertSystem from '../components/AlertSystem'; 
import HoveredUserProfile from "../components/HoveredUserProfile";
import { formatToLocalISODate } from "../utils/dateUtils";

const VITE_URL = import.meta.env.VITE_VITE_URL;

function SharedList({ tokenCalendars, personalCalendars, sharedUserCalendars }) {
  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(UserContext); // Contexte de l'utilisateur connecté

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(""); // Type d'alerte (ex. success, error)
  const [alertMessage, setAlertMessage] = useState(""); // Message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // Action à confirmer
  const [alertId, setAlertId] = useState(null); // Identifiant de l'alerte ciblée

  // 🔄 Chargement et données partagées groupées
  const [loading, setLoading] = useState(true); // État de chargement général
  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true); // État de chargement des partages groupés
  const [groupedShared, setGroupedShared] = useState({}); // Données groupées des partages

  // 🔗 Données liées aux partages
  const [expiresAt, setExpiresAt] = useState([]); // Dates d'expiration des liens partagés
  const [permissions, setPermissions] = useState([]); // Permissions associées aux partages
  const [emailsToInvite, setEmailsToInvite] = useState([]); // E-mails à inviter au partage


  // 📅 Date du jour
  const today = formatToLocalISODate(new Date()); // Date du jour au format 'YYYY-MM-DD'

  const handleCopyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(`${VITE_URL}/shared-token-calendar/${token.id}`);
      setAlertType("success");
      setAlertMessage("🔗 Lien copié !");
      setAlertId(token.id);
    } catch {
      setAlertType("danger");
      setAlertMessage("❌ Erreur lors de la copie du lien.");
      setAlertId(token.id);
    }
  };

  const handleUpdateTokenExpiration = async (tokenId, date) => {
    const rep = await tokenCalendars.updateTokenExpiration(tokenId, date);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
  };

  const handleUpdateTokenPermissions = async (tokenId, value) => {
    const rep = await tokenCalendars.updateTokenPermissions(tokenId, value);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
  };

  const handleToggleToken = async (tokenId) => {
    const rep = await tokenCalendars.updateRevokeToken(tokenId);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
  };

  const handleDeleteToken = (tokenId) => {
    setAlertType("confirm-danger");
    setAlertMessage("❌ Supprimer le lien ?");
    setAlertId(tokenId);
    setOnConfirmAction(() => async () => {
      const rep = await tokenCalendars.deleteToken(tokenId);
      if (rep.success) {
        setAlertType("success");
        setAlertMessage("✅ " + rep.message);
      } else {
        setAlertType("danger");
        setAlertMessage("❌ " + rep.error);
      }
      setAlertId(tokenId);
    });
  };

  const handleDeleteUser = async (calendarId, user) => {
    const rep = await sharedUserCalendars.deleteSharedUser(calendarId, user.receiver_uid);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId(user.receiver_uid + "-" + calendarId);
      setTimeout(async () => {
        await setGroupedSharedFunction();
      }, 1000);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId(user.receiver_uid + "-" + calendarId);
    }
  };

  const handleSendInvitation = async (calendarId) => {
    const rep = await sharedUserCalendars.sendInvitation(emailsToInvite[calendarId], calendarId);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId("addUser-" + calendarId);
      setTimeout(async () => {
        await setGroupedSharedFunction();
      }, 1000);
      setEmailsToInvite(prev => ({ ...prev, [calendarId]: "" }));
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId("addUser-" + calendarId);
    }
  }; 

  const handleCreateToken = async (calendarId) => {
    const rep = await tokenCalendars.createToken(calendarId, expiresAt[calendarId], permissions[calendarId]);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId("newLink-" + calendarId);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId("newLink-" + calendarId);
    }
  };

  useEffect(() => {
    if (authReady && currentUser) {
      setLoading(false);
    }
  }, [authReady, currentUser]);

  const setGroupedSharedFunction = useCallback(async () => {
    const grouped = {};

    for (const calendar of personalCalendars.calendarsData) {
      grouped[calendar.id] = {
        tokens: [],
        users: [],
        calendar_name: calendar.name,
      };

      const rep = await sharedUserCalendars.fetchSharedUsers(calendar.id);
      if (rep.success) {
        grouped[calendar.id].users = rep.users;
      }
      // Initialisation pour l'ajout d'un lien de partage
      setPermissions(prev => ({ ...prev, [calendar.id]: "read" }));
      setExpiresAt(prev => ({ ...prev, [calendar.id]: null }));
    }

    for (const token of tokenCalendars.tokensList) {
      if (grouped[token.calendar_id]) {
        grouped[token.calendar_id].tokens.push(token);
      }
    }

    setGroupedShared(grouped);
    setLoadingGroupedShared(false);
  }, [personalCalendars.calendarsData, sharedUserCalendars, tokenCalendars.tokensList]);
  
  
  useEffect(() => {
    if (loading === false && authReady && currentUser && personalCalendars.calendarsData) {
      setGroupedSharedFunction();
    }
  }, [loading, authReady, currentUser, personalCalendars.calendarsData, tokenCalendars.tokensList, setGroupedSharedFunction]);
  

  if (loading || loadingGroupedShared) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <output className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des liens partagés...</span>
        </output>
      </div>
    );
  };


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des calendriers partagés</h2>
      {Object.entries(groupedShared).map(([calendarId, data]) => (
        <div key={calendarId} className="card mb-4">
          <div className="card-body">
            <h3 className="card-title">{data.calendar_name}</h3>
            <hr />

            {/* Lien de partage */}
            <ul className="list-group">
              <h6 className="">Liens de partage :</h6>
              {(data.tokens || []).map((token) => (
                <div key={token.id}>

                  {/* Alert */}
                  {alertMessage && alertId === token.id && (
                    <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage("");
                        setOnConfirmAction(null);
                        setAlertId(null);
                      }}
                      onConfirm={async () => {
                        if (onConfirmAction) await onConfirmAction();
                      }}
                    />
                  )}
                    
                  <li key={token.id} className="list-group-item">
                    <div className="row align-items-center g-2">

                      {/* Lien */}
                      <div className="col-md-4">
                        <div className="input-group">
                          <span className="input-group-text bg-primary text-white">
                            <i className="bi bi-link-45deg"></i>
                          </span>
                          <input
                            id={"tokenLink"+token.id}
                            type="text"
                            className="form-control"
                            value={`${VITE_URL}/shared-token-calendar/${token.id}`}
                            readOnly
                          />
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleCopyLink(token)}
                            title="Copier le lien"
                          >
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </div>

                      {/* Jamais + Expiration */}
                      <div className={`d-flex align-items-center gap-2 col-md-4`}>
                        <select
                          id={"tokenExpiration"+token.id}
                          className="form-select"
                          value={token.expires_at === null ? "" : "date"}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              handleUpdateTokenExpiration(token.id, null);
                            } else {
                              handleUpdateTokenExpiration(token.id, today);
                            }
                          }}
                          title="Expiration"
                        >
                          <option value="">Jamais</option>
                          <option value="date">Expiration le</option>
                        </select>

                        {token.expires_at !== null && (
                          <input
                            id={"tokenDate"+token.id}
                            type="date"
                            className="form-control"
                            style={{ minWidth: "120px" }}
                            value={formatToLocalISODate(token.expires_at)}
                            onChange={(e) => {
                              handleUpdateTokenExpiration(token.id, formatToLocalISODate(e.target.value));
                            }}
                            title="Choisir une date d'expiration"
                            min={formatToLocalISODate(today)}
                          />
                        )}
                      </div>



                      {/* Permissions */}
                      <div className="col-md-2">
                        <select
                          id={"tokenPermissions"+token.id}
                          className="form-select"
                          value={token.permissions}
                          onChange={(e) => {
                            handleUpdateTokenPermissions(token.id, e.target.value);
                          }}
                          title="Permissions"
                        >
                          <option value="read">Lecture seule</option>
                          <option value="edit">Lecture + Édition</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className={`d-flex justify-content-end gap-2 col-md-2`}>
                        <button
                          className={`btn ${token.revoked ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={async () => {
                            handleToggleToken(token.id)
                          }}
                          title={token.revoked ? "Réactiver" : "Désactiver"}
                        >
                          <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'} button-icon`}></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteToken(token.id)}
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>

                  </li>

                </div>
              ))}

              {/* Ajouter un nouveau lien de partage */}
              {data.tokens.length === 0 && (
                <div>

                  {/* Alert */}
                  {alertMessage && alertId === "newLink-"+calendarId && (
                    <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage("");
                        setOnConfirmAction(null);
                        setAlertId(null);
                      }}
                      onConfirm={async () => {
                        if (onConfirmAction) await onConfirmAction();
                      }}
                    />
                  )}
                  <li className="list-group-item" key={calendarId}>
                    <div className="row align-items-center g-2">

                    {/* Lien */}
                    <div className="col-md-4">
                      <div className="input-group">
                        <span className="input-group-text bg-primary text-white">
                          <i className="bi bi-link-45deg"></i>
                        </span>
                        <input
                          id={"newTokenLink"+calendarId}
                          type="text"
                          className="form-control text-muted bg-light"
                          value="Nouveau lien de partage"
                          disabled
                          style={{ fontStyle: 'italic', fontWeight: 500 }}
                        />
                      </div>
                    </div>

                      {/* Jamais + Expiration */}
                      <div className={`d-flex align-items-center gap-2 ${expiresAt[calendarId] === null ? 'col-md-2' : 'col-md-4'}`}>
                        <select
                          id={"newTokenExpiration"+calendarId}
                          className="form-select"
                          value={expiresAt[calendarId] === null ? '' : 'date'}
                          title="Expire jamais"
                          onChange={(e) => {
                            setExpiresAt(prev => ({ ...prev, [calendarId]: e.target.value === '' ? null : today}));
                          }}
                        >
                          <option value=''>Jamais</option>
                          <option value="date">Expiration le</option>
                        </select>
                        {expiresAt[calendarId] !== null && (
                          <input
                            id={"newTokenDate"+calendarId}
                            type="date"
                            className="form-control"
                            style={{ minWidth: "120px" }}
                            title="Expiration"
                            value={expiresAt[calendarId]}
                            onChange={(e) => setExpiresAt(prev => ({ ...prev, [calendarId]: e.target.value }))}
                            min={today}
                          />
                        )}
                      </div>
                      
                      {/* Permissions */}
                      <div className="col-md-2">
                        <select
                          id={"newTokenPermissions"+calendarId}
                          className="form-select"
                          value={permissions[calendarId]}
                          title="Permissions"
                          onChange={(e) => {
                            setPermissions(prev => ({ ...prev, [calendarId]: e.target.value }));
                          }}
                        >
                          <option value="read">Lecture seule</option>
                          <option value="edit">Lecture + Édition</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className={`d-flex justify-content-end gap-2 ${expiresAt[calendarId] === null ? 'col-md-4' : 'col-md-2'}`}>
                        <button 
                        className="btn btn-success"
                        title="Ajouter"
                        onClick={() => handleCreateToken(calendarId)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  </li>
                </div>
              )}
            </ul>

            {/* Utilisateurs partagés */}
            <ul className="list-group">
              <h6 className="mt-4">Utilisateurs partagés :</h6>
              {(data.users || []).map((user) => (
                <div key={user.receiver_uid + "-" + calendarId}>
                  {alertMessage && alertId === user.receiver_uid + "-" + calendarId && (
                      <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage("");
                        setOnConfirmAction(null);
                        setAlertId(null);
                      }}
                      onConfirm={() => {
                        if (onConfirmAction) onConfirmAction();
                      }}
                    />
                  )}
                  <li key={user.receiver_uid + "-" + calendarId} className="list-group-item px-3">
                    <div className="row align-items-center g-2">
                      <div className="col-md-6 d-flex align-items-center justify-content-between">
                        <div>
                          <HoveredUserProfile
                            user={{
                              photo_url: user.receiver_photo_url,
                              display_name: user.receiver_name,
                              email: user.receiver_email,
                            }}
                            trigger={
                              <div className="d-flex align-items-center gap-2">
                                <div>
                                  <img src={user.receiver_photo_url} alt="Profil" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
                                </div>

                                <div>
                                  <strong>
                                    {user.receiver_name}
                                  </strong>
                                </div>
                              </div>
                            }
                          />
                        </div>

                        {/* Statut */}
                        <div>
                          <span className={`badge rounded-pill ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}>
                            {user.accepted ? "Accepté" : "En attente"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Permissions*/}
                      <div className="col-md-2 offset-md-2">
                        <select
                          id={"sharedUserAccess"+user.receiver_uid}
                          className="form-select"
                          value={user.access}
                          onChange={(e) => {
                            setAlertType("info");
                            setAlertMessage("Vous ne pouvez pas modifier l'accès d'un utilisateur partagé.");
                            setAlertId(user.receiver_uid + "-" + calendarId);
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
                            setAlertMessage("❌ Supprimer l'accès ?");
                            setAlertId(user.receiver_uid + "-" + calendarId);
                            setOnConfirmAction(() => () => {
                              handleDeleteUser(calendarId, user)
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

              {/* Ajouter un utilisateur */}
              <div>

                {/* Alert */}
                {alertMessage && alertId === "addUser-"+calendarId && (
                  <AlertSystem
                    type={alertType}
                    message={alertMessage}
                    onClose={() => {
                      setAlertMessage("");
                      setOnConfirmAction(null);
                      setAlertId(null);
                    }}
                    onConfirm={() => {
                      if (onConfirmAction) onConfirmAction();
                    }}
                  />
                )}


                <li className="list-group-item" key={calendarId}>
                  <div className="row align-items-center g-2">
                    <div className="col-md-6">
                      <div className="input-group">
                        <input
                          id={"emailToInvite"+calendarId}
                          type="email"
                          className="form-control"
                          placeholder="Email du destinataire"
                          onChange={(e) => setEmailsToInvite(prev => ({ ...prev, [calendarId]: e.target.value }))}
                          value={emailsToInvite[calendarId] ?? ""}
                        />
                        <button
                          className="btn btn-primary"
                          title="Envoyer une invitation"
                          onClick={() => handleSendInvitation(calendarId)}
                        >
                          <i className="bi bi-envelope-paper"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              </div>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SharedList;
