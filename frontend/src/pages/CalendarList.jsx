import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertSystem from '../components/AlertSystem';
import HoveredUserProfile from '../components/HoveredUserProfile';
import ShareCalendarModal from '../components/ShareCalendarModal';

function SelectCalendar({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  const navigate = useNavigate();

  // 📅 Gestion des calendriers
  const [newCalendarName, setNewCalendarName] = useState(''); // État pour le nom du nouveau calendrier
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage de calendrier

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(''); // État pour le type d'alerte
  const [alertMessage, setAlertMessage] = useState(''); // État pour le message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // État pour l'action à confirmer
  const [selectedAlert, setSelectedAlert] = useState(null); // État pour l'alerte sélectionnée

  // 🔗 Partage de calendrier (par lien ou utilisateur)
  const shareModalRef = useRef(null);
  const [calendarNameToShare, setCalendarNameToShare] = useState(''); // État pour le calendrier à partager
  const [calendarIdToShare, setCalendarIdToShare] = useState(''); // État pour le calendrier à partager
  const [existingShareToken, setExistingShareToken] = useState(null); // État pour un jeton de partage déjà existant

  // 👥 Partage ciblé par utilisateur
  const [sharedUsersData, setSharedUsersData] = useState([]); // État pour les données des utilisateurs ayant accès

  // 🔄 Ajout d'un calendrier
  const handleAddCalendarClick = async () => {
    const rep = await personalCalendars.addCalendar(newCalendarName);
    if (rep.success) {
      setAlertMessage('✅ ' + rep.message);
      setAlertType('success');
      setSelectedAlert('header');
    } else {
      setAlertMessage('❌ ' + rep.error);
      setAlertType('danger');
      setSelectedAlert('header');
    }
    setNewCalendarName('');
  };

  const renameConfirmAction = async (calendarId) => {
    const rep = await personalCalendars.renameCalendar(
      calendarId,
      renameValues[calendarId]
    );
    if (rep.success) {
      setRenameValues((prev) => ({ ...prev, [calendarId]: '' }));
      setAlertType('success');
      setAlertMessage('✅ ' + rep.message);
      setSelectedAlert('calendar' + calendarId);
    } else {
      setAlertType('danger');
      setAlertMessage('❌ ' + rep.error);
      setSelectedAlert('calendar' + calendarId);
    }
  };

  // 🔄 Renommage d'un calendrier
  const handleRenameClick = (calendarId) => {
    setAlertType('confirm-safe');
    setSelectedAlert('calendar' + calendarId);
    setAlertMessage('✅ Renommer le calendrier ?');
    setOnConfirmAction(() => () => renameConfirmAction(calendarId));
  };

  const deleteConfirmAction = async (calendarId) => {
    const rep = await personalCalendars.deleteCalendar(calendarId);
    if (rep.success) {
      setAlertType('success');
      setAlertMessage('✅ ' + rep.message);
      setSelectedAlert('calendar');
    } else {
      setAlertType('danger');
      setAlertMessage('❌ ' + rep.error);
      setSelectedAlert('calendar' + calendarId);
    }
  };

  const handleDeleteCalendarClick = (calendarId) => {
    setAlertType('confirm-danger');
    setSelectedAlert('calendar' + calendarId);
    setAlertMessage('❌ Supprimer le calendrier ?');
    setOnConfirmAction(() => () => deleteConfirmAction(calendarId));
  };

  // 🔗 Partager un calendrier
  const handleShareCalendarClick = async (calendarData) => {
    setCalendarNameToShare(calendarData.name); // On retient quel calendrier partager
    setCalendarIdToShare(calendarData.id);
    setExistingShareToken(null);
    const token = await tokenCalendars.tokensList.find(
      (t) => t.calendar_id === calendarData.id
    );
    const rep = await sharedUserCalendars.fetchSharedUsers(calendarData.id);
    if (rep.success) {
      setSharedUsersData(rep.users);
    }
    setExistingShareToken(token || null);
    shareModalRef.current?.open();
  };

  const deleteSharedCalendarConfirmAction = async (calendarId) => {
    const rep = await sharedUserCalendars.deleteSharedCalendar(calendarId);
    if (rep.success) {
      setAlertType('success');
      setAlertMessage('✅ ' + rep.message);
      setSelectedAlert('sharedCalendar');
    } else {
      setAlertType('danger');
      setAlertMessage('❌ ' + rep.error);
      setSelectedAlert('sharedCalendar' + calendarId);
    }
  };

  const handleDeleteSharedCalendarClick = (calendarId) => {
    setAlertType('confirm-danger');
    setSelectedAlert('sharedCalendar' + calendarId);
    setAlertMessage('❌ Supprimer le calendrier partagé ?');
    setOnConfirmAction(
      () => () => deleteSharedCalendarConfirmAction(calendarId)
    );
  };

  if (personalCalendars.calendarsData === null) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des calendriers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      {/* Modal pour partager un calendrier */}
      <ShareCalendarModal
        ref={shareModalRef}
        calendarId={calendarIdToShare}
        calendarName={calendarNameToShare}
        existingShareToken={existingShareToken}
        sharedUsersData={sharedUsersData}
        tokenCalendars={tokenCalendars}
        sharedUserCalendars={sharedUserCalendars}
        setAlertType={setAlertType}
        setAlertMessage={setAlertMessage}
        setSelectedAlert={setSelectedAlert}
        alertCategory="calendar"
      />

      <div className="w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-calendar-week"></i> Mes calendriers
        </h4>
        {selectedAlert === 'header' && (
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => {
              setAlertMessage('');
              setOnConfirmAction(null);
              setSelectedAlert(null);
            }}
            onConfirm={() => {
              if (onConfirmAction) onConfirmAction();
            }}
          />
        )}

        {/* Champ pour ajouter un nouveau calendrier */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddCalendarClick();
          }}
        >
          <div className="input-group mb-2 shadow-sm">
            <input
              id="newCalendarName"
              aria-label="Nom du calendrier"
              type="text"
              className="form-control"
              placeholder="Nom du calendrier"
              required
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)} // Mise à jour du nom du nouveau calendrier
            />
            <button
              type="submit"
              className="btn btn-primary"
              aria-label="Ajouter un calendrier"
              title="Ajouter un calendrier"
            >
              <i className="bi bi-plus-lg"></i>
              <span> Ajouter</span>
            </button>
          </div>
        </form>

        {selectedAlert === 'calendar' && (
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => {
              setAlertMessage('');
              setOnConfirmAction(null);
              setSelectedAlert(null);
            }}
            onConfirm={() => {
              if (onConfirmAction) onConfirmAction();
            }}
          />
        )}

        {/* Liste des calendriers */}
        {Array.isArray(personalCalendars.calendarsData) &&
        personalCalendars.calendarsData.length > 0 ? (
          <div className="list-group shadow-sm">
            {personalCalendars.calendarsData.map((calendarData, index) => (
              <div key={index} className="list-group-item">
                {selectedAlert === 'calendar' + calendarData.id && (
                  <AlertSystem
                    type={alertType}
                    message={alertMessage}
                    onClose={() => {
                      setAlertMessage('');
                      setOnConfirmAction(null);
                      setSelectedAlert(null);
                    }}
                    onConfirm={() => {
                      if (onConfirmAction) onConfirmAction();
                    }}
                  />
                )}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                  {/* Partie gauche : Nom du calendrier et nombre de médicaments */}
                  <div className="flex-grow-1">
                    <h5 className="mb-1 fs-semibold">{calendarData.name}</h5>
                    <div className="text-muted small">
                      Nombre de médicaments :
                      <span className="fw-semibold ms-1">
                        {calendarData.boxes_count ?? '...'}
                      </span>
                    </div>
                  </div>

                  {/* Partie pour renommer un calendrier */}
                  <form
                    className="input-group input-group w-100 w-md-auto"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameClick(calendarData.id);
                    }}
                  >
                    <input
                      id={'renameCalendarName' + calendarData.id}
                      aria-label="Nouveau nom"
                      type="text"
                      className="form-control form-control"
                      placeholder="Nouveau nom"
                      required
                      value={renameValues[calendarData.id] || ''} // Valeur du champ de renommage
                      onChange={(e) =>
                        setRenameValues({
                          ...renameValues,
                          [calendarData.id]: e.target.value,
                        })
                      } // Mise à jour de l'état
                    />
                    <button
                      className="btn btn-warning"
                      title="Renommer"
                      type="submit"
                      aria-label="Renommer"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </form>

                  {/* Boutons d'action : ouvrir ou supprimer */}
                  <div className="btn-group btn-group w-md-auto">
                    <button
                      className="btn btn-outline-success"
                      title="Ouvrir"
                      aria-label="Ouvrir"
                      onClick={() => navigate('/calendar/' + calendarData.id)} // Navigation vers le calendrier
                    >
                      Ouvrir
                    </button>

                    <button
                      className="btn btn-outline-warning"
                      title="Partager"
                      aria-label="Partager"
                      onClick={() => handleShareCalendarClick(calendarData)}
                    >
                      <i className="bi bi-box-arrow-up"></i>
                    </button>

                    <button
                      className="btn btn-outline-danger"
                      title="Supprimer"
                      aria-label="Supprimer"
                      onClick={() => handleDeleteCalendarClick(calendarData.id)}
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-warning">
            Vous n'avez pas de calendrier personnel.
          </div>
        )}
      </div>

      <div className="w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-people"></i> Calendriers partagés
        </h4>

        {/* 🔔 Alertes et confirmations */}
        {selectedAlert === 'sharedCalendar' && (
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => {
              setAlertMessage('');
              setOnConfirmAction(null);
              setSelectedAlert(null);
            }}
            onConfirm={() => {
              if (onConfirmAction) onConfirmAction();
            }}
          />
        )}

        {/* Liste des calendriers partagés */}
        {Array.isArray(sharedUserCalendars.sharedCalendarsData) &&
        sharedUserCalendars.sharedCalendarsData.length > 0 ? (
          <div className="list-group shadow-sm">
            {sharedUserCalendars.sharedCalendarsData.map(
              (calendarData, index) => (
                <div key={index} className="list-group-item">
                  {/* 🔔 Alertes et confirmations */}
                  {selectedAlert === 'sharedCalendar' + calendarData.id && (
                    <AlertSystem
                      type={alertType}
                      message={alertMessage}
                      onClose={() => {
                        setAlertMessage('');
                        setOnConfirmAction(null);
                        setSelectedAlert(null);
                      }}
                      onConfirm={() => {
                        if (onConfirmAction) onConfirmAction();
                      }}
                    />
                  )}

                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-2">
                    <div className="flex-grow-1">
                      <h5 className="mb-1 fs-semibold">{calendarData.name}</h5>
                      <div className="text-muted small">
                        Nombre de médicaments :
                        <span className="fw-semibold ms-1">
                          {calendarData.boxes_count ?? '...'}
                        </span>
                      </div>
                      <div className="text-muted small d-flex align-items-center ">
                        Propriétaire :
                        <HoveredUserProfile
                          user={{
                            email: calendarData.owner_email,
                            display_name: calendarData.owner_name,
                            photo_url: calendarData.owner_photo_url,
                          }}
                          trigger={
                            <span
                              className="fw-semibold ms-1 position-relative"
                              style={{ cursor: 'pointer' }}
                            >
                              {calendarData.owner_name}
                            </span>
                          }
                        />
                      </div>
                    </div>

                    <div className="btn-group btn-group">
                      <button
                        className="btn btn-outline-success"
                        title="Ouvrir"
                        aria-label="Ouvrir"
                        onClick={() =>
                          navigate('/shared-user-calendar/' + calendarData.id)
                        }
                      >
                        Ouvrir
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title="Supprimer"
                        aria-label="Supprimer"
                        onClick={() =>
                          handleDeleteSharedCalendarClick(calendarData.id)
                        }
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="alert alert-warning">
            Vous n'avez pas de calendrier partagé.
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectCalendar;
