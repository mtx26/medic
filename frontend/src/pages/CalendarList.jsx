import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertSystem from '../components/AlertSystem';
import HoveredUserProfile from '../components/HoveredUserProfile';
import ShareCalendarModal from '../components/ShareCalendarModal';
import ActionSheet from '../components/ActionSheet';
import { useTranslation } from 'react-i18next';


function SelectCalendar({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 📅 Gestion des calendriers
  const [newCalendarName, setNewCalendarName] = useState(''); // État pour le nom du nouveau calendrier
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage de calendrier
  const [renameMode, setRenameMode] = useState(null); // État pour le mode de renommage

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

  // 🔄 Partage de calendrier
  const [loadingShare, setLoadingShare] = useState(false); // État de chargement du partage du calendrier

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
    setAlertMessage('✅ ' + t('calendar.confirm_rename'));
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
    setAlertMessage('❌ ' + t('calendar.confirm_delete'));
    setOnConfirmAction(() => () => deleteConfirmAction(calendarId));
  };

  // 🔗 Partager un calendrier
  const handleShareCalendarClick = async (calendarData) => {
    setLoadingShare(true);
    setCalendarNameToShare(calendarData.name); // On retient quel calendrier partager
    setCalendarIdToShare(calendarData.id);
    setSharedUsersData([]);
    setExistingShareToken(null);
    shareModalRef.current?.open();
    const token = await tokenCalendars.tokensList.find(
      (t) => t.calendar_id === calendarData.id
    );
    const rep = await sharedUserCalendars.fetchSharedUsers(calendarData.id);
    if (rep.success) {
      setSharedUsersData(rep.users);
    }
    setExistingShareToken(token || null);
    setLoadingShare(false);
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
    setAlertMessage('❌ ' + t('calendar.confirm_delete_shared'));
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
          <span className="visually-hidden">{t('loading_calendars')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      {/* Modal pour partager un calendrier */}
      <ShareCalendarModal
        ref={shareModalRef}
        loading={loadingShare}
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
          <i className="bi bi-calendar-week"></i> {t('my_calendars')}
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
              aria-label={t('calendar.name')}
              type="text"
              className="form-control"
              placeholder={t('calendar.name')}
              required
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)} // Mise à jour du nom du nouveau calendrier
            />
            <button
              type="submit"
              className="btn btn-primary"
              aria-label={t('calendar.add')}
              title={t('calendar.add')}
            >
              <i className="bi bi-plus-lg"></i>
              <span> {t('add')}</span>
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
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  {/* Partie gauche : Nom + nombre */}
                  <div className="me-auto">
                    <h5 className="mb-1 fs-semibold">{calendarData.name}</h5>
                    <div className="text-muted small">
                      {t('medicines')}:
                      <span className="fw-semibold ms-1">
                        {calendarData.boxes_count ?? '...'}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Ouvrir */}
                  <button
                    className="btn btn-outline-success"
                    title={t('open')}
                    aria-label={t('open')}
                    onClick={() => navigate('/calendar/' + calendarData.id)}
                  >
                    {t('open')}
                  </button>

                  {/* ActionSheet */}
                  <ActionSheet
                    actions={[
                      {
                        label: (
                          <>
                            <i className="bi bi-box-arrow-up"></i> {t('share')}
                          </>
                        ),
                        onClick: () => handleShareCalendarClick(calendarData)
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-pencil"></i> {t('rename')}
                          </>
                        ),
                        onClick: () => setRenameMode(calendarData.id)
                      },
                      {
                        separator: true,
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-trash"></i> {t('delete')}
                          </>
                        ),
                        onClick: () => handleDeleteCalendarClick(calendarData.id),
                        danger: true,
                      },
                    ]}
                  />
                </div>
                {/* afficher la form si on est en mode renommage */}
                {renameMode === calendarData.id && (
                  <div className="d-flex justify-content-center">
                    {/* Partie pour renommer un calendrier */}
                    <form
                      className="input-group input-group w-100 w-md-auto"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameClick(calendarData.id);
                        setRenameMode(null);
                      }}
                    >
                      <input
                        id={'renameCalendarName' + calendarData.id}
                        aria-label={t('calendar.new_name')}
                        type="text"
                        className="form-control form-control"
                        placeholder={t('calendar.new_name')}
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
                        title={t('rename')}
                        type="submit"
                        aria-label={t('rename')}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title={t('cancel')}
                        type="button"
                        aria-label={t('cancel')}
                        onClick={() => setRenameMode(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-warning">
            {t('no_personal_calendars')}
          </div>
        )}
      </div>

      <div className="w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-people"></i> {t('shared_calendars')}
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
                        {t('medicines')}:
                        <span className="fw-semibold ms-1">
                          {calendarData.boxes_count ?? '...'}
                        </span>
                      </div>
                      <div className="text-muted small d-flex align-items-center ">
                        {t('owner')}:
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
                        title={t('open')}
                        aria-label={t('open')}
                        onClick={() =>
                          navigate('/shared-user-calendar/' + calendarData.id)
                        }
                      >
                        {t('open')}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title={t('delete')}
                        aria-label={t('delete')}
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
            {t('no_shared_calendars')}
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectCalendar;
