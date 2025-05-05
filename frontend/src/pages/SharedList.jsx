import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem'; 
import HoveredUserProfile from "../components/HoveredUserProfile";

const REACT_URL = process.env.REACT_APP_REACT_URL;

function SharedList({ sharedTokens, calendars, sharedUsers, invitations }) {
  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(AuthContext); // Contexte de l'utilisateur connecté

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
  const [hoveredUser, setHoveredUser] = useState(null); // Utilisateur actuellement survolé


  // 📅 Date du jour
  const today = new Date().toISOString().split('T')[0]; // Date du jour au format 'YYYY-MM-DD'


  useEffect(() => {
    const load = async () => {
      if (authReady && currentUser) {
        await sharedTokens.fetchTokens();
        await calendars.fetchCalendars();
        setLoading(false);
      }
    };
    load();
  }, [authReady, currentUser, calendars.fetchCalendars, sharedTokens.fetchTokens]);

  const setGroupedSharedFunction = async () => {
    const grouped = {};

    for (const calendar of calendars.calendarsData) {
      grouped[calendar.calendar_id] = {
        tokens: [],
        users: [],
        calendar_name: calendar.calendar_name,
      };

      const rep = await sharedUsers.fetchSharedUsers(calendar.calendar_id);
      if (rep.success) {
        grouped[calendar.calendar_id].users = rep.data;
      }
      // Initialisation pour l'ajout d'un lien de partage
      setPermissions(prev => ({ ...prev, [calendar.calendar_id]: "read" }));
      setExpiresAt(prev => ({ ...prev, [calendar.calendar_id]: null }));
    }

    for (const token of sharedTokens.tokensList) {
      if (grouped[token.calendar_id]) {
        grouped[token.calendar_id].tokens.push(token);
      }
    }

    setGroupedShared(grouped);
    setLoadingGroupedShared(false);
  };
  
  useEffect(() => {
    if (loading === false && authReady && currentUser && calendars.calendarsData) {
      setGroupedSharedFunction();
    }
  }, [loading, authReady, currentUser, calendars.calendarsData, sharedTokens.tokensList]);
  

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

      {Object.entries(groupedShared).map(([calendarId, data]) => (
        <div key={calendarId} className="card mb-4">
          <div className="card-body">
            <h3 className="card-title">{data.calendar_name}</h3>
            <hr />

            {/* Lien de partage */}
            <ul className="list-group">
              <h6 className="">Liens de partage :</h6>
              {data.tokens.map((token) => (
                <div key={token.token}>

                  {/* Alert */}
                  {alertMessage && alertId === token.token && (
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
                    
                  <li key={token.token} className="list-group-item">
                    <div className="row align-items-center g-2">

                      {/* Lien */}
                      <div className="col-md-4">
                        <div className="input-group">
                          <span className="input-group-text bg-primary text-white">
                            <i className="bi bi-link-45deg"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            value={`${REACT_URL}/shared-token-calendar/${token.token}`}
                            readOnly
                          />
                          <button
                            className="btn btn-outline-primary"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`${REACT_URL}/shared-token-calendar/${token.token}`);
                                setAlertType("success");
                                setAlertMessage("👍 Lien de partage copié dans le presse-papiers.");
                                setAlertId(token.token);
                              } catch (error) {
                                setAlertType("danger");
                                setAlertMessage("❌ Une erreur est survenue lors de la copie du lien de partage.");
                                setAlertId(token.token);
                              }
                            }}
                            title="Copier le lien"
                          >
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </div>

                      {/* Jamais + Expiration */}
                      <div className={`d-flex align-items-center gap-2 col-md-4`}>
                        <select
                          className="form-select"
                          value={token.expires_at === null ? "" : "date"}
                          onChange={async (e) => {
                            const value = e.target.value;
                            if (value === "") {
                              const rep = await sharedTokens.updateTokenExpiration(token.token, null);
                              if (rep.success) {
                                setAlertType("success");
                                setAlertMessage("✅ "+rep.message);
                                setAlertId(token.token);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ "+rep.error);
                                setAlertId(token.token);
                              }
                            } else {
                              const rep = await sharedTokens.updateTokenExpiration(token.token, new Date().toISOString().slice(0, 16));
                              if (rep.success) {
                                setAlertType("success");
                                setAlertMessage("✅ "+rep.message);
                                setAlertId(token.token);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ "+rep.error);
                                setAlertId(token.token);
                              }
                            }
                          }}
                          title="Expiration"
                        >
                          <option value="">Jamais</option>
                          <option value="date">Expiration le</option>
                        </select>

                        {token.expires_at !== null && (
                          <input
                            type="date"
                            className="form-control"
                            style={{ minWidth: "120px" }}
                            value={
                              token.expires_at
                                ? today
                                : ""
                            }
                            onChange={async (e) => {
                              const rep = await sharedTokens.updateTokenExpiration(token.token, e.target.value + "T00:00")
                              if (rep.success) {
                                setAlertType("success");
                                setAlertMessage("✅ "+rep.message);
                                setAlertId(token.token);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ "+rep.error);
                                setAlertId(token.token);
                              }
                            }}
                            title="Choisir une date d'expiration"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        )}
                      </div>



                      {/* Permissions */}
                      <div className="col-md-2">
                        <select
                          className="form-select"
                          value={token.permissions}
                          onChange={async (e) => {
                            const rep = await sharedTokens.updateTokenPermissions(token.token, e.target.value);
                            if (rep.success) {
                              setAlertType("success");
                              setAlertMessage("✅ "+rep.message);
                              setAlertId(token.token);
                            } else {
                              setAlertType("danger");
                              setAlertMessage("❌ "+rep.error);
                              setAlertId(token.token);
                            }
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
                            const rep = await sharedTokens.updateRevokeToken(token.token)
                            if (rep.success) {
                              setAlertType("success");
                              setAlertMessage(token.revoked ? "✅ "+rep.message : "✅ "+rep.message);
                              setAlertId(token.token);
                            } else {
                              setAlertType("danger");
                              setAlertMessage(token.revoked ? "❌ "+rep.error : "❌ "+rep.error);
                              setAlertId(token.token);
                            }
                          }}
                          title={token.revoked ? "Réactiver" : "Désactiver"}
                        >
                          <i className={`bi ${token.revoked ? 'bi-toggle-off' : 'bi-toggle-on'} button-icon`}></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => {
                            setAlertType("confirm-danger");
                            setAlertMessage("❌ Confirmez-vous la suppression du lien de partage ?");
                            setAlertId(token.token);
                            setOnConfirmAction(() => async () => {
                              const rep = await sharedTokens.deleteToken(token.token)
                              if (rep.success) {
                                setAlertType("success");
                                setAlertMessage("✅ "+rep.message);
                                setAlertId(token.token);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ "+rep.error);
                                setAlertId(token.token);
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
                        className="btn btn-outline-primary"
                        title="Ajouter"
                        onClick={async () => {
                          const rep = await sharedTokens.createToken(calendarId, expiresAt[calendarId], permissions[calendarId]);
                          if (rep.success) {
                            setAlertType("success");
                            setAlertMessage("✅ "+ rep.message);
                            setAlertId("newLink-"+calendarId);
                          } else {
                            setAlertType("danger");
                            setAlertMessage("❌ "+rep.error);
                            setAlertId("newLink-"+calendarId);
                          }
                        }}
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
              {data.users.map((user) => (
                <div key={user.receiver_uid}>
                  {alertMessage && alertId === user.receiver_uid && (
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
                  <li key={user.receiver_uid} className="list-group-item px-3">
                    <div className="row align-items-center g-2">

                      <div 
                        className={`d-flex align-items-center gap-2 col-md-4`}
                        onMouseEnter={() => setHoveredUser(user.receiver_uid)}
                        onMouseLeave={() => setHoveredUser(null)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        
                        {/* Image */}
                        <div className="">
                          <img src={user.photo_url} alt="Profil" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
                        </div>

                        {/* Nom */}
                        <div className="">
                          <strong>{user.display_name}</strong>
                        </div>

                        {/* Statut */}
                        <div className="">
                          <span className={`badge rounded-pill ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}>
                            {user.accepted ? "Accepté" : "En attente"}
                          </span>
                        </div>

                        {/* Tooltip */}
                        {hoveredUser === user.receiver_uid && (
                          <HoveredUserProfile
                            user={{
                              photo_url: user.photo_url,
                              display_name: user.display_name,
                              receiver_email: user.receiver_email
                            }}
                            style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)' }}
                          />
                        )}
                  
                      </div>

                      {/* Permissions*/}
                      <div className="col-md-2 offset-md-4">
                          <select
                            className="form-select"
                            value={user.access}
                            onChange={(e) => {
                              setAlertType("info");
                              setAlertMessage("Vous ne pouvez pas modifier l'accès d'un utilisateur partagé.");
                              setAlertId(user.receiver_uid);
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
                            setAlertId(user.receiver_uid);
                            setOnConfirmAction(() => async () => {
                              const rep = await sharedUsers.deleteSharedUser(calendarId, user.receiver_uid)
                              if (rep.success) {
                                setAlertType("success");
                                setAlertMessage("✅ "+rep.message);
                                setAlertId(user.receiver_uid);
                                setTimeout(async () => {
                                  await setGroupedSharedFunction();
                                }, 1000);
                              } else {
                                setAlertType("danger");
                                setAlertMessage("❌ "+rep.error);
                                setAlertId(user.receiver_uid);
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
                          type="email"
                          className="form-control"
                          placeholder="Email du destinataire"
                          onChange={(e) => setEmailsToInvite(prev => ({ ...prev, [calendarId]: e.target.value }))}
                          value={emailsToInvite[calendarId] ?? ""}
                        />
                        <button
                          className="btn btn-outline-primary"
                          title="Envoyer une invitation"
                          onClick={async () => {
                            const rep = await invitations.sendInvitation(emailsToInvite[calendarId], calendarId);
                            if (rep.success) {

                              setAlertType("success");
                              setAlertMessage("✅ "+ rep.message);
                              setAlertId("addUser-"+calendarId);
                              setTimeout(async () => {
                                await setGroupedSharedFunction();
                              }, 1000);
                              setEmailsToInvite(prev => ({ ...prev, [calendarId]: "" }));
                            } else {
                              setAlertType("danger");
                              setAlertMessage("❌ "+ rep.error);
                              setAlertId("addUser-"+calendarId);
                            }
                          }}
                        >
                          Partager
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
