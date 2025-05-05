import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem';
import HoveredUserProfile from '../components/HoveredUserProfile';




function SelectCalendar({ calendars, sharedTokens, invitations, sharedUsers }) {

  const navigate = useNavigate(); 
  const { authReady, currentUser } = useContext(AuthContext); // Contexte d'authentification

  // 📅 Gestion des calendriers
  const [loadingCalendars, setLoadingCalendars] = useState(true); // État de chargement des calendriers
  const [newCalendarName, setNewCalendarName] = useState(''); // État pour le nom du nouveau calendrier
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage de calendrier
  const [count, setCount] = useState({}); // État pour le nombre de médicaments par calendrier

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(""); // État pour le type d'alerte
  const [alertMessage, setAlertMessage] = useState(""); // État pour le message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // État pour l'action à confirmer
  const [selectedAlert, setSelectedAlert] = useState(null); // État pour l'alerte sélectionnée

  // 🔗 Partage de calendrier (par lien ou utilisateur)
  const [showShareModal, setShowShareModal] = useState(false); // État pour l'ouverture du modal de partage
  const [calendarNameToShare, setCalendarNameToShare] = useState(''); // État pour le calendrier à partager
  const [calendarIdToShare, setCalendarIdToShare] = useState(''); // État pour le calendrier à partager
  const [shareMethod, setShareMethod] = useState('link'); // État pour la méthode de partage (par défaut : lien)
  const [expiresAt, setExpiresAt] = useState(null); // État pour la date d'expiration du lien de partage
  const [permissions, setPermissions] = useState('read'); // État pour les permissions (par défaut : lecture seule)
  const [existingShareToken, setExistingShareToken] = useState(null); // État pour un jeton de partage déjà existant

  // 👥 Partage ciblé par utilisateur
  const [emailToInvite, setEmailToInvite] = useState(''); // État pour l'adresse e-mail à inviter
  const [sharedUsersData, setSharedUsersData] = useState([]); // État pour les données des utilisateurs ayant accès
  const [hoveredUser, setHoveredUser] = useState(null); // État pour l'utilisateur actuellement survolé

  const REACT_URL = process.env.REACT_APP_REACT_URL


  useEffect(() => {
    const load = async () => {
      if (authReady) { // authReady doit être prêt
        if (currentUser) {
          calendars.setCalendarsData([]); // Bien vider l'ancien
          setLoadingCalendars(true);
          await calendars.fetchPersonalCalendars(); // Recharger pour le nouvel utilisateur
          await calendars.fetchSharedCalendars(); // Recharger pour le nouvel utilisateur
          await sharedTokens.fetchTokens();
          setLoadingCalendars(false);
        } else {
          setLoadingCalendars(false);
        }
      }
    };
    load();
  }, [authReady, currentUser]);
  
  
  // Chargement du nombre de médicaments pour chaque calendrier
  useEffect(() => {
    if (authReady && currentUser && calendars.calendarsData.length > 0) {
    const loadCounts = async () => {
      const counts = {};
      for (const calendarData of calendars.calendarsData) {
        const rep = await calendars.getMedicineCount(calendarData.calendar_id);
        if (rep.success) {
          counts[calendarData.calendar_id] = rep.count;
        } else {
          counts[calendarData.calendar_id] = 0;
        }
      }
      for (const calendarData of calendars.sharedCalendarsData) {
        const rep = await calendars.getSharedMedicineCount(calendarData.calendar_id, calendarData.owner_uid);
        if (rep.success) {
          counts[calendarData.calendar_id] = rep.count;
        } else {
          counts[calendarData.calendar_id] = 0;
        }
      }
      setCount(counts); 
    };
    loadCounts();
    }
  }, [calendars.calendarsData, calendars.sharedCalendarsData, authReady, currentUser]);

  if (loadingCalendars) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des calendriers...</span>
        </div>
      </div>
    );
  }
  
  

  return (
<div className="container align-items-center d-flex flex-column gap-3">
  {/* Modal pour partager un calendrier */}
  {showShareModal && (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Partager le calendrier <strong>{calendarNameToShare}</strong></h5>
            <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
          </div>
          <div className="modal-body">

            {/* Choix du mode */}
            <div className="mb-4 text-center">
              <div className="btn-group" role="group" aria-label="Méthode de partage">
                <button
                  type="button"
                  className={`btn ${shareMethod === 'link' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShareMethod('link')}
                >
                  <i className="bi bi-link"></i> Lien
                </button>
                <button
                  type="button"
                  className={`btn ${shareMethod === 'account' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShareMethod('account')}
                >
                  <i className="bi bi-person-plus-fill"></i> Compte
                </button>
              </div>
            </div>

            {/* PARTAGE PAR LIEN */}
            {shareMethod === 'link' ? (
              <div className="d-flex flex-column gap-3">
                {existingShareToken ? (
                  <>
                    <p>Un lien existe déjà pour ce calendrier.</p>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={`${REACT_URL}/shared-token-calendar/${existingShareToken.token}`}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-warning"
                        onClick={() => navigate(`/shared-calendar`)}
                        title="Gérer le lien"
                      >
                        <i className="bi bi-gear"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${REACT_URL}/shared-token-calendar/${existingShareToken.token}`);
                            setAlertType("success");
                            setSelectedAlert("calendar");
                            setAlertMessage("🔗 Lien existant copié dans le presse-papiers !");
                            setShowShareModal(false);
                          } catch (error) {
                            setAlertType("danger");
                            setSelectedAlert("calendar");
                            setAlertMessage("❌ Erreur lors de la copie du lien.");
                          }
                        }}
                        title="Copier le lien"
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Un lien sera généré pour <strong>{calendarNameToShare}</strong>.</p>
                    <div>
                      <label className="form-label">Expiration du lien</label>
                      <select
                        className="form-select mb-2"
                        value={expiresAt === null ? '' : 'date'}
                        onChange={(e) => {
                          setExpiresAt(e.target.value === '' ? null : '');
                        }}
                        title="Date d'expiration"
                      >
                        <option value="">Jamais</option>
                        <option value="date">Choisir une date</option>
                      </select>

                      {expiresAt !== null && (
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          title="Date d'expiration"
                        />
                      )}
                    </div>

                    <div>
                      <label className="form-label">Permissions</label>
                      <select
                        className="form-select"
                        value={permissions}
                        onChange={(e) => setPermissions(e.target.value)}
                        title="Permissions"
                      >
                        <option value="read">Lecture seule</option>
                        <option value="edit">Lecture + Édition</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // PARTAGE PAR COMPTE
              <div>
                {sharedUsersData.length > 0 && (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <h5 className="mb-0">Utilisateurs partagés</h5>
                    </div>

                    <ul className="list-group mb-3">
                      {sharedUsersData.map((user) => (
                        <li 
                          key={user.receiver_uid} 
                          className="list-group-item d-flex justify-content-between align-items-center"
                          onMouseEnter={() => setHoveredUser(user.receiver_uid)}
                          onMouseLeave={() => setHoveredUser(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <img src={user.photo_url} alt="Profil" className="rounded-circle" style={{ width: "40px", height: "40px" }}/>
                            <span>
                              <strong>{user.display_name}</strong><br />
                              Accès : {user.access}
                            </span>
                            <span className={`badge ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}>
                              {user.accepted ? "Accepté" : "En attente"}
                            </span>
                          </div>

                          {/* Tooltip */}
                          {hoveredUser === user.receiver_uid && (
                            <HoveredUserProfile
                              user={user}
                              style={{ top: '110%', left: '25%', transform: 'translateX(-50%)' }}
                            />
                          )}
                          <button
                            className="btn btn-outline-warning"
                            title="Gérer les utilisateurs partagés"
                            onClick={() => navigate('/shared-calendar')}
                          >
                            <i className="bi bi-gear"></i>
                          </button>

                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p>Envoyer une invitation pour accéder à <strong>{calendarNameToShare}</strong>.</p>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email du destinataire"
                    onChange={(e) => setEmailToInvite(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={async () => {
                      const rep = await invitations.sendInvitation(emailToInvite, calendarIdToShare);
                      if (rep.success) {
                        setAlertType("success");
                        setSelectedAlert("calendar");
                        setAlertMessage("✅ "+ rep.message);
                      } else {
                        setAlertType("danger");
                        setSelectedAlert("calendar");
                        setAlertMessage("❌ "+ rep.error);
                      }
                      setShowShareModal(false);
                    }}
                  >
                    Partager
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer seulement si nécessaire */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowShareModal(false)}>Fermer</button>
            {!existingShareToken && shareMethod === 'link' && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={async () => {
                  const rep = await sharedTokens.createToken(calendarIdToShare, expiresAt, permissions);
                  if (rep.success) {
                    try {
                      await navigator.clipboard.writeText(`${REACT_URL}/shared-token-calendar/${rep.token}`);
                      setAlertType("success");
                      setSelectedAlert("calendar");
                      setAlertMessage("✅ "+ rep.message);
                    } catch (error) {
                      setAlertType("danger");
                      setSelectedAlert("calendar");
                      setAlertMessage("❌ Erreur lors de la copie du lien.");
                    }
                  } else {
                    setAlertType("danger");
                    setSelectedAlert("calendar");
                    setAlertMessage("❌ " + rep.error);
                  }
                  setShowShareModal(false);
                }}
              >
                Partager
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )}


  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '800px' }}>
    <h5 className="mb-3">Mes calendriers</h5>
    {selectedAlert === "header" && (
      <AlertSystem
        type={alertType}
        message={alertMessage}
        onClose={() => {
          setAlertMessage("");
          setOnConfirmAction(null);
          setSelectedAlert(null);
        }}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
        }}
      />
    )}

    {/* Champ pour ajouter un nouveau calendrier */}
    <div className="input-group mb-4">
      <input
      type="text"
      className="form-control"
      placeholder="Nom du calendrier"
      value={newCalendarName}
      onChange={(e) => setNewCalendarName(e.target.value)} // Mise à jour du nom du nouveau calendrier
      />
      <button
      onClick={async() => {
        const rep = await calendars.addCalendar(newCalendarName);
        if (rep.success) {
          setAlertMessage("✅ " + rep.message);
          setAlertType("success");
          setSelectedAlert("header");
        } else {
          setAlertMessage("❌ " + rep.error);
          setAlertType("danger");
          setSelectedAlert("header");
        }
        setNewCalendarName("");
      }} // Ajout d'un nouveau calendrier
      className="btn btn-outline-primary"
      title="Ajouter un calendrier"
      >
      <i className="bi bi-plus-lg"></i>
      <span> Ajouter</span>
      </button>
    </div>

    {selectedAlert === "calendar" && (
      <AlertSystem
        type={alertType}
        message={alertMessage}
        onClose={() => {
          setAlertMessage("");
          setOnConfirmAction(null);
          setSelectedAlert(null);
        }}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
        }}
      />
    )}

    {/* Liste des calendriers */}
    <div className="list-group">
      {calendars.calendarsData.map((calendarData, index) => (
      <div
        key={index}
        className="list-group-item"
      >
        {selectedAlert === "calendar"+calendarData.calendar_id && (
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => {
              setAlertMessage("");
              setOnConfirmAction(null);
              setSelectedAlert(null);
            }}
            onConfirm={() => {
              if (onConfirmAction) onConfirmAction();
            }}
          />
        )}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        {/* Partie gauche : Nom du calendrier et nombre de médicaments */}
        <div className="flex-grow-1">
          <strong>{calendarData.calendar_name}</strong>
          <div className="text-muted small">
          Nombre de médicaments :
          <span className="fw-semibold ms-1">
            {count[calendarData.calendar_id] ?? "..."} {/* Affichage du nombre ou "..." */}
          </span>
          </div>
        </div>

        {/* Partie pour renommer un calendrier */}
        <div className="input-group input-group w-100 w-md-auto">
          <input
          type="text"
          className="form-control form-control"
          placeholder="Nouveau nom"
          value={renameValues[calendarData.calendar_id] || ""} // Valeur du champ de renommage
          onChange={(e) =>
            setRenameValues({ ...renameValues, [calendarData.calendar_id]: e.target.value }) // Mise à jour de l'état
          }
          />
          <button
          className="btn btn-outline-warning"
          title="Renommer"
          onClick={() => {
            setAlertType("confirm-safe");
            setSelectedAlert("calendar"+calendarData.calendar_id);
            setAlertMessage("✅ Confirmez-vous le renommage du calendrier ?");
            setOnConfirmAction(() => async () => {
              const rep = await calendars.renameCalendar(calendarData.calendar_id, renameValues[calendarData.calendar_id]); // Renommage du calendrier
              if (rep.success) {
                setRenameValues({ ...renameValues, [calendarData.calendar_id]: "" }); // Réinitialisation du champ
                setAlertType("success");
                setSelectedAlert("calendar"+calendarData.calendar_id);
                setAlertMessage("✅ " + rep.message);
              } else {
                setAlertType("danger");
                setSelectedAlert("calendar"+calendarData.calendar_id);
                setAlertMessage("❌ " + rep.error);
              }
            });
          }}
          >
          <i className="bi bi-pencil"></i>
          </button>
        </div>

        {/* Boutons d'action : ouvrir ou supprimer */}
        <div className="btn-group btn-group">
          <button
          type="button"
          className="btn btn-outline-success"
          title="Ouvrir"
          onClick={() => navigate('/calendars/' + calendarData.calendar_id)} // Navigation vers le calendrier
          >
          Ouvrir
          </button>

          <button
            type="button"
            className="btn btn-outline-warning"
            title="Partager"
            onClick={async () => {
              setCalendarNameToShare(calendarData.calendar_name);  // On retient quel calendrier partager
              setCalendarIdToShare(calendarData.calendar_id);
              setExistingShareToken(null);
              const token = await sharedTokens.tokensList.find(
                (t) => t.calendar_id === calendarData.calendar_id && !t.revoked && t.owner_uid === currentUser.uid
              );
              const rep = await sharedUsers.fetchSharedUsers(calendarData.calendar_id);
              if (rep.success) {
                setSharedUsersData(rep.data);
              }
              setExistingShareToken(token || null);
              setShowShareModal(true);           // On affiche la modal
            }}
          >
            <i className="bi bi-box-arrow-up"></i>
          </button>


          <button
          type="button"
          className="btn btn-outline-danger"
          title="Supprimer"
          onClick={() => {
            setAlertType("confirm-danger");
            setSelectedAlert("calendar"+calendarData.calendar_id);
            setAlertMessage("❌ Confirmez-vous la suppression du calendrier ?");
            setOnConfirmAction(() => async () => {
              const rep = await calendars.deleteCalendar(calendarData.calendar_id);
              if (rep.success) {
                setAlertType("success");
                setSelectedAlert("calendar"+calendarData.calendar_id);
                setAlertMessage("✅ " + rep.message);
              } else {
                setAlertType("danger");
                setSelectedAlert("calendar"+calendarData.calendar_id);
                setAlertMessage("❌ " + rep.error);
              }
            });
          }}
          >
          <i className="bi bi-trash3"></i>
          </button>
        </div>
        </div>
      </div>
      ))}
    </div>
  </div>


  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '800px' }}>
    <h5 className="mb-3">Calendriers partagés</h5>

    {selectedAlert === "sharedCalendar" && (
      <AlertSystem
      type={alertType}
      message={alertMessage}
      onClose={() => {
        setAlertMessage("");
        setOnConfirmAction(null);
        setSelectedAlert(null);
      }}
      onConfirm={() => {
        if (onConfirmAction) onConfirmAction();
      }}
    />
    )}

    {/* Liste des calendriers partagés */}  
    <div className="list-group">
      {calendars.sharedCalendarsData.map((calendarData, index) => (
      <div key={index} className="list-group-item">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="flex-grow-1">
            <strong>
              {calendarData.calendar_name}{" "}
            </strong>
            <div className="text-muted small">
              Nombre de médicaments :
              <span className="fw-semibold ms-1">
                {count[calendarData.calendar_id] ?? "..."}
              </span>
            </div>
            <div className="text-muted small">
              Propriétaire :
              <span className="fw-semibold ms-1"
              
              >
                {calendarData.owner_name}
              </span>
            </div>
          </div>


          <div className="btn-group btn-group">
            <button
              type="button"
              className="btn btn-outline-success"
              title="Ouvrir"
              onClick={() => navigate('/shared-user-calendar/' + calendarData.calendar_id)}
            >
              Ouvrir
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              title="Supprimer"
              onClick={() => {
                setAlertType("confirm-danger");
                setSelectedAlert("sharedCalendar");
                setAlertMessage("❌ Confirmez-vous la suppression du calendrier partagé ?");
                setOnConfirmAction(() => async () => {
                  const rep = await calendars.deleteSharedCalendar(calendarData.calendar_id);
                  if (rep.success) {
                    setAlertType("success");
                    setSelectedAlert("sharedCalendar");
                    setAlertMessage("✅ " + rep.message);
                  } else {
                    setAlertType("danger");
                    setSelectedAlert("sharedCalendar");
                    setAlertMessage("❌ " + rep.error);
                  }
                });
              }}
            >
              <i className="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
      ))}
    </div>
  </div>

</div>

  );
}

export default SelectCalendar;
