import { forwardRef, useState, useImperativeHandle, isValidElement } from 'react';
import { useNavigate } from 'react-router-dom';
import HoveredUserProfile from './HoveredUserProfile';
import PropTypes from 'prop-types';

const VITE_URL = import.meta.env.VITE_VITE_URL;

const LinkShareOptions = ({
  existingShareToken,
  calendarName,
  expiresAt,
  setExpiresAt,
  expiration,
  setExpiration,
  permissions,
  setPermissions,
  handleCopyLink,
  navigate,
  refObj,
  isValidShared
}) => {

  if (existingShareToken) {
    const link = `${VITE_URL}/shared-token-calendar/${existingShareToken.id}`;

    return (
      <>
        <p>Un lien existe déjà pour ce calendrier.</p>
        <div className="input-group">
          <input type="text" className="form-control" value={link} id={"existingShareTokenLink-"+existingShareToken.id} readOnly />
          <button
            className="btn btn-outline-warning"
            onClick={() => {
              navigate('/shared-calendar');
              refObj.current.close();
            }}
            title="Gérer le lien"
          >
            <i className="bi bi-gear"></i>
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => handleCopyLink(link)}
            title="Copier le lien"
          >
            <i className="bi bi-clipboard"></i>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <p>Un lien sera généré pour <strong>{calendarName}</strong>.</p>
      <label htmlFor="newTokenExpiration" className="form-label">Expiration du lien</label>
      <select
        id="newTokenExpiration"
        className={"form-select mb-2"}
        value={expiration}
        onChange={(e) => {
          setExpiration(e.target.value);
        }}
      >
        <option value="never">Jamais</option>
        <option value="date">Choisir une date</option>
      </select>
      {expiration !== 'never' && (
        <input
          type="date"
          className={`form-control ${isValidShared ? '' : 'is-invalid'}`}
          id={"newTokenExpiration-"+new Date().getTime()}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      )}
      <label htmlFor="newTokenPermissions" className="form-label mt-2">Permissions</label>
      <select
        id="newTokenPermissions"
        className={"form-select"}
        value={permissions}
        onChange={(e) => setPermissions(e.target.value)}
      >
        <option value="read">Lecture seule</option>
        <option value="edit">Lecture + Édition</option>
      </select>
    </>
  );
};

LinkShareOptions.propTypes = {
  existingShareToken: PropTypes.object,
  calendarName: PropTypes.string.isRequired,
  expiresAt: PropTypes.string.isRequired,
  setExpiresAt: PropTypes.func.isRequired,
  permissions: PropTypes.string.isRequired,
  setPermissions: PropTypes.func.isRequired,
  handleCopyLink: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  refObj: PropTypes.shape({ current: PropTypes.any }),
  VITE_URL: PropTypes.string.isRequired,
};

const AccountShareOptions = ({
  sharedUsersData,
  calendarName,
  emailToInvite,
  setEmailToInvite,
  handleInvite
}) => {
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
  <div>
    {sharedUsersData.length > 0 && (
      <ul className="list-group mb-3">
        {sharedUsersData.map((user) => (
          <li key={user.receiver_uid} className="list-group-item d-flex justify-content-between align-items-center">
            <HoveredUserProfile
              user={{
                email: user.receiver_email,
                display_name: user.receiver_name,
                photo_url: user.receiver_photo_url
              }}
              trigger={
                <span className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                  <img src={user.receiver_photo_url} alt="Profil" className="rounded-circle" style={{ width: '40px', height: '40px' }} />
                  <span>
                    <strong>{user.receiver_name}</strong><br />
                    Accès : {user.access}
                  </span>
                </span>
              }
            />
            <span className={`badge rounded-pill ${user.accepted ? 'bg-success' : 'bg-warning text-dark'}`}>
              {user.accepted ? 'Accepté' : 'En attente'}
            </span>
          </li>
        ))}
      </ul>
    )}
    <p>Envoyer une invitation pour accéder à <strong>{calendarName}</strong>.</p>
    <div className="input-group">
      <input
        type="email"
        autoComplete="email"
        className={`form-control ${emailToInvite === '' || !isValidEmail(emailToInvite) ? 'is-invalid' : ''}`}
        placeholder="Email du destinataire"
        value={emailToInvite}
        onChange={(e) => setEmailToInvite(e.target.value)}
        id="emailToInvite"
      />
      <button
        className="btn btn-outline-primary"
        onClick={handleInvite}
        disabled={emailToInvite === '' || !isValidEmail(emailToInvite)}
      > 
        Partager
      </button>
    </div>
  </div>
  );
};

AccountShareOptions.propTypes = {
  sharedUsersData: PropTypes.arrayOf(
    PropTypes.shape({
      receiver_uid: PropTypes.string.isRequired,
      receiver_email: PropTypes.string.isRequired,
      receiver_name: PropTypes.string.isRequired,
      receiver_photo_url: PropTypes.string,
      accepted: PropTypes.bool.isRequired,
      access: PropTypes.string.isRequired,
    })
  ).isRequired,
  calendarName: PropTypes.string.isRequired,
  emailToInvite: PropTypes.string.isRequired,
  setEmailToInvite: PropTypes.func.isRequired,
  handleInvite: PropTypes.func.isRequired,
};


const ShareCalendarModal = forwardRef(({
  calendarId, 
  calendarName, 
  existingShareToken, 
  sharedUsersData,
  tokenCalendars, 
  sharedUserCalendars, 
  setAlertType, 
  setAlertMessage, 
  setSelectedAlert, 
  alertCategory = undefined
}, ref) => {
  const navigate = useNavigate();


  const [shareMethod, setShareMethod] = useState('link');
  const [expiresAt, setExpiresAt] = useState("");
  const [expiration, setExpiration] = useState('never');
  const [permissions, setPermissions] = useState('read');
  const [emailToInvite, setEmailToInvite] = useState('');

  const triggerAlert = (type, messageOrError) => {
    setAlertType(type);
    if (alertCategory) setSelectedAlert(alertCategory);
    if (type === 'success') {
      setAlertMessage("✅ " + messageOrError);
    } else {
      setAlertMessage("❌ " + messageOrError);
    }
  };  

  const isValidShared = (expiresAt, expiration) => {
    return ((expiresAt !== "" ) && (expiresAt >= new Date().toISOString().slice(0, 10))) || (expiration === 'never');
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      setTimeout(() => {
        const modal = new window.bootstrap.Modal(document.getElementById('shareModal'), {
          focus: false
        });
        modal.show();
      }, 0);
    },    
    close: () => {
      const modalEl = document.getElementById('shareModal');
      if (!modalEl) return;
    
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        // Ajouter un listener pour "transitionend"
        const handleHidden = () => {
          modal.dispose(); // 🔥 Supprime correctement l’instance
          modalEl.removeEventListener('hidden.bs.modal', handleHidden);
          
          // Sécurité : retirer tout backdrop restant
          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
          document.body.classList.remove('modal-open'); // au cas où
          document.body.style.paddingRight = ''; // au cas où Bootstrap l’a modifié
        };
    
        modalEl.addEventListener('hidden.bs.modal', handleHidden);
        modal.hide(); // 📦 Lance l’animation de fermeture
      }
    
      document.activeElement?.blur(); // 🔵 Retirer le focus actif (croix, bouton…)
    }    
  }));

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      triggerAlert("success", "Lien copié !");
      ref.current.close();
    } catch {
      triggerAlert("danger", "Erreur lors de la copie du lien.");
    }
  };
  

  const handleInvite = async () => {
    const rep = await sharedUserCalendars.sendInvitation(emailToInvite, calendarId);
    triggerAlert(rep.success ? "success" : "danger", rep.success ? rep.message : rep.error);
    ref.current.close();
  };  

  const handleCreateToken = async () => {
    const rep = await tokenCalendars.createToken(calendarId, expiresAt, permissions);
    if (rep.success) {
      try {
        await navigator.clipboard.writeText(`${VITE_URL}/shared-token-calendar/${rep.token}`);
        triggerAlert("success", rep.message);
      } catch {
        triggerAlert("danger", "Erreur lors de la copie du lien.");
      }
    } else {
      triggerAlert("danger", rep.error);
    }
    ref.current.close();
  };  

  return (
    <div className="modal fade" tabIndex="-1" id="shareModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Partager le calendrier <strong>{calendarName}</strong></h5>
            <button 
              className="btn-close" 
              onClick={() => ref.current.close()}
            ></button>
          </div>

          <div className="modal-body">
            <div className="mb-4 text-center">
              <div className="btn-group" role="group">
                <button
                  className={`btn ${shareMethod === 'link' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShareMethod('link')}
                >
                  <i className="bi bi-link"></i> Lien
                </button>
                <button
                  className={`btn ${shareMethod === 'account' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShareMethod('account')}
                >
                  <i className="bi bi-person-plus-fill"></i> Compte
                </button>
              </div>
            </div>

            {shareMethod === 'link' ? (
              <div className="d-flex flex-column gap-3">
                <LinkShareOptions
                  existingShareToken={existingShareToken}
                  calendarName={calendarName}
                  expiresAt={expiresAt}
                  setExpiresAt={setExpiresAt}
                  expiration={expiration}
                  setExpiration={setExpiration}
                  permissions={permissions}
                  setPermissions={setPermissions}
                  handleCopyLink={handleCopyLink}
                  navigate={navigate}
                  refObj={ref}
                  VITE_URL={VITE_URL}
                  isValidShared={isValidShared(expiresAt, expiration)}
                />
              </div>
            ) : (
              <AccountShareOptions
                sharedUsersData={sharedUsersData}
                calendarName={calendarName}
                emailToInvite={emailToInvite}
                setEmailToInvite={setEmailToInvite}
                handleInvite={handleInvite}
              />
            )}

          </div>

          <div className="modal-footer">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => ref.current.close()}
            >
              Fermer
            </button>
            {!existingShareToken && shareMethod === 'link' && (
              <button 
                className="btn btn-outline-primary" 
                onClick={handleCreateToken}
                disabled={!isValidShared(expiresAt, expiration)}
              >
                Partager
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ShareCalendarModal.propTypes = {
  calendarId: PropTypes.string.isRequired,
  calendarName: PropTypes.string.isRequired,
  existingShareToken: PropTypes.object,
  sharedUsersData: PropTypes.arrayOf(
    PropTypes.shape({
      receiver_uid: PropTypes.string.isRequired,
      receiver_email: PropTypes.string.isRequired,
      receiver_name: PropTypes.string.isRequired,
      receiver_photo_url: PropTypes.string,
      accepted: PropTypes.bool.isRequired,
      access: PropTypes.string.isRequired,
    })
  ).isRequired,
  tokenCalendars: PropTypes.object.isRequired,
  sharedUserCalendars: PropTypes.object.isRequired,
  setAlertType: PropTypes.func.isRequired,
  setAlertMessage: PropTypes.func.isRequired,
  setSelectedAlert: PropTypes.func,
  alertCategory: PropTypes.string,
};

export default ShareCalendarModal;

