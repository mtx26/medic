import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem';



function SelectCalendar({ calendars, tokens, invitations }) {

  const navigate = useNavigate();
  const { authReady, currentUser } = useContext(AuthContext); // Récupération du contexte d'authentification
  const [newCalendarName, setNewCalendarName] = useState(''); // État pour le nom du nouveau calendrier
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage
  const [count, setCount] = useState({}); // État pour stocker le nombre de médicaments par calendrier
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [calendarToShare, setCalendarToShare] = useState('');
  const [shareMethod, setShareMethod] = useState('link'); 
  const [expiresAt, setExpiresAt] = useState(null); // Date d'expiration
  const [permissions, setPermissions] = useState('read'); // Par défaut : lecture seule
  const [existingShareToken, setExistingShareToken] = useState(null);
  const [emailToInvite, setEmailToInvite] = useState('');
  
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const REACT_URL = process.env.REACT_APP_REACT_URL

  const deleteSharedCalendar = (calendarName) => {
    console.log(calendarName);
  }

  useEffect(() => {
    const load = async () => {
      if (authReady) { // authReady doit être prêt
        if (currentUser) {
          calendars.setCalendarsData([]); // Bien vider l'ancien
          setLoadingCalendars(true);
          await calendars.fetchCalendars(); // Recharger pour le nouvel utilisateur
          await calendars.fetchSharedCalendars(); // Recharger pour le nouvel utilisateur
          await tokens.fetchTokens();
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
      for (const calendarName of calendars.calendarsData) {
        const c = await calendars.getMedicineCount(calendarName); // Récupération du nombre de médicaments
        counts[calendarName] = c;
      }
      console.log("Calendriers partagés récupérés :", calendars.sharedCalendarsData);
      for (const calendarName of calendars.sharedCalendarsData) {
        const c = await calendars.getSharedMedicineCount(calendarName.calendar_name, calendarName.calendar_owner_uid); // Récupération du nombre de médicaments
        counts[calendarName.calendar_name] = c;
      }
      setCount(counts); // Mise à jour de l'état avec les nombres
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
            <h5 className="modal-title">Partager le calendrier <strong>{calendarToShare}</strong></h5>
            <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <div className="d-flex justify-content-center gap-3" role="group" aria-label="Méthode de partage">
                <button
                  type="button"
                  className={`btn btn-outline-primary ${shareMethod === 'link' ? 'active' : ''}`}
                  onClick={() => setShareMethod('link')}
                  title="Partager via un lien"
                >
                  <i className="bi bi-link"></i> Lien
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-primary ${shareMethod === 'account' ? 'active' : ''}`}
                  onClick={() => setShareMethod('account')}
                  title="Partager avec un compte"
                >
                  <i className="bi bi-person-plus-fill"></i> Compte
                </button>
              </div>
            </div>


            {shareMethod === 'link' ? (
              <div className="d-flex flex-column gap-3">
                {existingShareToken ? (
                  <>
                    <p>Un lien existe déjà pour ce calendrier.</p>
                    <div className="input-group">
                      <input 
                        type="text"
                        className="form-control"
                        value={`${REACT_URL}/shared-calendar/${existingShareToken.token}`}
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
                            await navigator.clipboard.writeText(`${REACT_URL}/shared-calendar/${existingShareToken.token}`);
                            setAlertType("success");
                            setAlertMessage("🔗 Lien existant copié dans le presse-papiers !");
                          } catch (error) {
                            setAlertType("danger");
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
                    <p>Un lien sera généré pour <strong>{calendarToShare}</strong>.</p>

                    <div>
                      <label className="form-label">Expiration du lien</label>
                      <select
                        className="form-select mb-2"
                        value={expiresAt === null ? 'never' : 'date'}
                        onChange={(e) => {
                          if (e.target.value === 'never') {
                            setExpiresAt(null);
                          } else {
                            setExpiresAt('');
                          }
                        }}
                        title="Date d'expiration"
                      >
                        <option value="never">Jamais</option>
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
              <div>
                <p>Envoyer une invitation pour accéder à <strong>{calendarToShare}</strong>.</p>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="Email du compte"
                  onChange={(e) => setEmailToInvite(e.target.value)}
                />
              </div>
            )}


          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowShareModal(false)}>Fermer</button>
            <button 
              type="button" 
              className="btn btn-outline-primary" 
              onClick={async () => {
                if (shareMethod === 'link') {
                  const {token, success} = await tokens.createSharedTokenCalendar(calendarToShare, expiresAt, permissions);
                  if (success) {
                    try {
                      await navigator.clipboard.writeText(`${REACT_URL}/shared-calendar/${token}`); // Copier dans presse-papier
                      setAlertType("success");
                    setAlertMessage("🔗 Lien copié dans le presse-papiers !");
                  } catch (error) {
                    setAlertType("danger");
                      setAlertMessage("❌ Erreur lors de la copie du lien.");
                    }
                  } else {
                    setAlertType("danger");
                    setAlertMessage("❌ Erreur lors de la création du lien.");
                  }
                } else {
                  const success = await invitations.sendInvitation(emailToInvite, calendarToShare);
                  if (success) {
                    setAlertType("success");
                    setAlertMessage("✅ Invitation envoyée avec succès !");
                  } else {
                    setAlertType("danger");
                    setAlertMessage("❌ Erreur lors de l'envoi de l'invitation.");
                  }
                }
                setShowShareModal(false);
              }}
            >
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '800px' }}>
    <h5 className="mb-3">Mes calendriers</h5>

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
        const success = await calendars.addCalendar(newCalendarName);
        if (success) {
          setAlertMessage("✅ Calendrier ajouté avec succès !");
          setAlertType("success");
        } else {
          setAlertMessage("❌ Erreur lors de l'ajout du calendrier.");
          setAlertType("danger");
        }
        setOnConfirmAction(null);
        setTimeout(() => {
          setAlertMessage("");
          setAlertType("");
        }, 3000);
        setNewCalendarName("");
      }} // Ajout d'un nouveau calendrier
      className="btn btn-outline-primary"
      title="Ajouter un calendrier"
      >
      <i class="bi bi-plus-lg"></i>
      <span> Ajouter</span>
      </button>
    </div>

    <AlertSystem
      type={alertType}
      message={alertMessage}
      onClose={() => {
        setAlertMessage("");
        setOnConfirmAction(null);
      }}
      onConfirm={() => {
        if (onConfirmAction) onConfirmAction();
      }}
    />

    {/* Liste des calendriers */}
    <div className="list-group">
      {calendars.calendarsData.map((calendarName, index) => (
      <div
        key={index}
        className="list-group-item"
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        {/* Partie gauche : Nom du calendrier et nombre de médicaments */}
        <div className="flex-grow-1">
          <strong>{calendarName}</strong>
          <div className="text-muted small">
          Nombre de médicaments :
          <span className="fw-semibold ms-1">
            {count[calendarName] ?? "..."} {/* Affichage du nombre ou "..." */}
          </span>
          </div>
        </div>

        {/* Partie pour renommer un calendrier */}
        <div className="input-group input-group w-100 w-md-auto">
          <input
          type="text"
          className="form-control form-control"
          placeholder="Nouveau nom"
          value={renameValues[calendarName] || ""} // Valeur du champ de renommage
          onChange={(e) =>
            setRenameValues({ ...renameValues, [calendarName]: e.target.value }) // Mise à jour de l'état
          }
          />
          <button
          className="btn btn-outline-warning"
          title="Renommer"
          onClick={() => {
            setAlertType("confirm-safe");
            setAlertMessage("✅ Confirmez-vous le renommage du calendrier ?");
            setOnConfirmAction(() => () => {
              calendars.RenameCalendar(calendarName, renameValues[calendarName]); // Renommage du calendrier
              setRenameValues({ ...renameValues, [calendarName]: "" }); // Réinitialisation du champ
            });
          }}
          >
          <i class="bi bi-pencil"></i>
          </button>
        </div>

        {/* Boutons d'action : ouvrir ou supprimer */}
        <div className="btn-group btn-group">
          <button
          type="button"
          className="btn btn-outline-success"
          title="Ouvrir"
          onClick={() => navigate('/calendars/' + calendarName)} // Navigation vers le calendrier
          >
          Ouvrir
          </button>

          <button
            type="button"
            className="btn btn-outline-warning"
            title="Partager"
            onClick={async () => {
              setCalendarToShare(calendarName);  // On retient quel calendrier partager
              setExistingShareToken(null);
              const token = await tokens.tokensList.find(
                (t) => t.calendar_name === calendarName && !t.revoked && t.calendar_owner_uid === currentUser.uid
              );
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
            setAlertMessage("❌ Confirmez-vous la suppression du calendrier ?");
            setOnConfirmAction(() => () => {
              calendars.deleteCalendar(calendarName);
            });
          }}
          >
          <i class="bi bi-trash3"></i>
          </button>
        </div>
        </div>
      </div>
      ))}
    </div>
  </div>
  
  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '800px' }}>
    <h5 className="mb-3">Calendriers partagés</h5>
      {/* Liste des calendriers partagés */}
      <div className="list-group">
        {calendars.sharedCalendarsData.map((calendarName, index) => (
        <div key={index} className="list-group-item">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="flex-grow-1">
              <strong>
                {calendarName.calendar_name}{" "}
              </strong>
              <div className="text-muted small">
                Nombre de médicaments :
                <span className="fw-semibold ms-1">
                  {count[calendarName.calendar_name] ?? "..."}
                </span>
              </div>
              <div className="text-muted small">
                Propriétaire :
                <span className="fw-semibold ms-1">
                  {calendarName.calendar_owner_email ?? "Propriétaire inconnu"}
                </span>
              </div>
            </div>


            <div className="btn-group btn-group">
              <button
                type="button"
                className="btn btn-outline-success"
                title="Ouvrir"
                onClick={() => navigate('/calendars/' + calendarName.calendar_name)}
              >
                Ouvrir
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                title="Supprimer"
                onClick={() => {
                  setAlertType("confirm-danger");
                  setAlertMessage("❌ Confirmez-vous la suppression du calendrier partagé ?");
                  setOnConfirmAction(() => () => {
                    deleteSharedCalendar(calendarName.calendar_name);
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
