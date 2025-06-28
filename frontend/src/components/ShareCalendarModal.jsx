import { forwardRef, useState, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import HoveredUserProfile from './HoveredUserProfile';
import PropTypes from 'prop-types';
import Modal from 'bootstrap/js/dist/modal';

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
}) => {
  if (existingShareToken) {
    const link = `${VITE_URL}/shared-token-calendar/${existingShareToken.id}`;

    return (
      <>
        <p>Un lien existe déjà pour ce calendrier.</p>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            aria-label="Lien du calendrier partagé"
            value={link}
            id={'existingShareTokenLink-' + existingShareToken.id}
            readOnly
          />
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={() => {
              navigate('/shared-calendars');
              refObj?.current?.close();
            }}
            aria-label="Gérer le lien"
            title="Gérer le lien"
          >
            <i className="bi bi-gear"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => handleCopyLink(link)}
            aria-label="Copier le lien"
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
      <p>
        Un lien sera généré pour <strong>{calendarName}</strong>.
      </p>
      <label htmlFor="newTokenExpiration" className="form-label">
        Expiration du lien
      </label>
      <select
        id="newTokenExpiration"
        className={'form-select mb-2'}
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
          className={`form-control`}
          aria-label="Date d'expiration du lien"
          id={'newTokenExpiration-' + new Date().getTime()}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          required
        />
      )}
      <label htmlFor="newTokenPermissions" className="form-label mt-2">
        Permissions
      </label>
      <select
        id="newTokenPermissions"
        className={'form-select'}
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
  expiration: PropTypes.string.isRequired,
  setExpiration: PropTypes.func.isRequired,
  permissions: PropTypes.string.isRequired,
  setPermissions: PropTypes.func.isRequired,
  handleCopyLink: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  refObj: PropTypes.shape({ current: PropTypes.any }),
};

const AccountShareOptions = ({
  sharedUsersData,
  calendarName,
  emailToInvite,
  setEmailToInvite,
  handleInvite,
}) => {
  return (
    <div>
      {sharedUsersData.length > 0 && (
        <ul className="list-group mb-3">
          {sharedUsersData.map((user) => (
            <li
              key={user.receiver_uid}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <HoveredUserProfile
                user={{
                  email: user.receiver_email,
                  display_name: user.receiver_name,
                  photo_url: user.receiver_photo_url,
                }}
                trigger={
                  <span
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={user.receiver_photo_url}
                      alt="Profil"
                      className="rounded-circle"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <span>
                      <strong>{user.receiver_name}</strong>
                      <br />
                      Accès : {user.access}
                    </span>
                  </span>
                }
              />
              <span
                className={`badge rounded-pill ${user.accepted ? 'bg-success' : 'bg-warning text-dark'}`}
              >
                {user.accepted ? 'Accepté' : 'En attente'}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        Envoyer une invitation pour accéder à <strong>{calendarName}</strong>.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleInvite();
        }}
      >
        <div className="input-group">
          <input
            type="email"
            autoComplete="email"
            className={`form-control`}
            aria-label="Email du destinataire"
            placeholder="Email du destinataire"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            id="emailToInvite"
            required
          />
          <button
            className="btn btn-outline-primary"
            type="submit"
            aria-label="Envoyer l'invitation"
            title="Envoyer l'invitation"
          >
            <i className="bi bi-person-plus-fill"></i>
          </button>
        </div>
      </form>
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

const ModalBody = ({
  shareMethod,
  setShareMethod,
  existingShareToken,
  calendarName,
  expiresAt,
  setExpiresAt,
  expiration,
  setExpiration,
  permissions,
  setPermissions,
  handleCopyLink,
  handleInvite,
  emailToInvite,
  setEmailToInvite,
  sharedUsersData,
  refObj,
}) => {
  const navigate = useNavigate();

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">
          Partager le calendrier <strong>{calendarName}</strong>
        </h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => refObj?.current?.close()}
          aria-label="Fermer"
          title="Fermer"
        ></button>
      </div>

      <div className="modal-body">
        <div className="mb-4 text-center">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${shareMethod === 'link' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setShareMethod('link')}
              aria-label="Lien"
              title="Lien"
            >
              <i className="bi bi-link"></i> Lien
            </button>
            <button
              type="button"
              className={`btn ${shareMethod === 'account' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setShareMethod('account')}
              aria-label="Compte"
              title="Compte"
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
              refObj={refObj}
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
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => refObj?.current?.close()}
          aria-label="Fermer"
          title="Fermer"
        >
          Fermer
        </button>
        {!existingShareToken && shareMethod === 'link' && (
          <button
            className="btn btn-outline-primary"
            type="submit"
            aria-label="Partager"
            title="Partager"
          >
            <i className="bi bi-share"></i> Partager
          </button>
        )}
      </div>
    </div>
  );
};

ModalBody.propTypes = {
  shareMethod: PropTypes.oneOf(['link', 'account']).isRequired,
  setShareMethod: PropTypes.func.isRequired,
  existingShareToken: PropTypes.object,
  calendarName: PropTypes.string.isRequired,
  expiresAt: PropTypes.string.isRequired,
  setExpiresAt: PropTypes.func.isRequired,
  expiration: PropTypes.string.isRequired,
  setExpiration: PropTypes.func.isRequired,
  permissions: PropTypes.string.isRequired,
  setPermissions: PropTypes.func.isRequired,
  handleCopyLink: PropTypes.func.isRequired,
  handleInvite: PropTypes.func.isRequired,
  emailToInvite: PropTypes.string.isRequired,
  setEmailToInvite: PropTypes.func.isRequired,
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
  refObj: PropTypes.shape({ current: PropTypes.any }),
};

const ShareCalendarModal = forwardRef(
  (
    {
      loading,
      calendarId,
      calendarName,
      existingShareToken,
      sharedUsersData,
      tokenCalendars,
      sharedUserCalendars,
      setAlertType,
      setAlertMessage,
      setSelectedAlert,
      alertCategory = undefined,
    },
    ref
  ) => {
    const [shareMethod, setShareMethod] = useState('link');
    const [expiresAt, setExpiresAt] = useState('');
    const [expiration, setExpiration] = useState('never');
    const [permissions, setPermissions] = useState('read');
    const [emailToInvite, setEmailToInvite] = useState('');

    const triggerAlert = (type, messageOrError) => {
      setAlertType(type);
      if (alertCategory) setSelectedAlert(alertCategory);
      if (type === 'success') {
        setAlertMessage('✅ ' + messageOrError);
      } else {
        setAlertMessage('❌ ' + messageOrError);
      }
    };

    // Fermer le modal
    const handleHidden = (modalEl) => {
      const modal = Modal.getInstance(modalEl);
      if (modal) modal.dispose();

      modalEl.removeEventListener('hidden.bs.modal', () =>
        handleHidden(modalEl)
      );

      document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.paddingRight = '';
    };

    useImperativeHandle(ref, () => ({
      open: () => {
        setTimeout(() => {
          const modal = new Modal(document.getElementById('shareModal'), {
            focus: false,
          });
          modal.show();
        }, 0);
      },
      close: () => {
        const modalEl = document.getElementById('shareModal');
        if (!modalEl) return;

        modalEl.addEventListener('hidden.bs.modal', () =>
          handleHidden(modalEl)
        );
        const modal = Modal.getInstance(modalEl);
        if (modal) modal.hide();

        document.activeElement?.blur();
      },
    }));

    const handleCopyLink = async (link) => {
      try {
        await navigator.clipboard.writeText(link);
        triggerAlert('success', 'Lien copié !');
        ref?.current?.close();
      } catch {
        triggerAlert('danger', 'Erreur lors de la copie du lien.');
      }
    };

    const handleInvite = async () => {
      const rep = await sharedUserCalendars.sendInvitation(
        emailToInvite,
        calendarId
      );
      triggerAlert(
        rep.success ? 'success' : 'danger',
        rep.success ? rep.message : rep.error
      );
      ref?.current?.close();
    };

    const handleCreateToken = async () => {
      const rep = await tokenCalendars.createToken(
        calendarId,
        expiresAt,
        permissions
      );
      if (rep.success) {
        try {
          await navigator.clipboard.writeText(
            `${VITE_URL}/shared-token-calendar/${rep.token}`
          );
          triggerAlert('success', rep.message);
        } catch {
          triggerAlert('danger', 'Erreur lors de la copie du lien.');
        }
      } else {
        triggerAlert('danger', rep.error);
      }
      ref?.current?.close();
    };

    if (loading) {
      return (
        <div className="modal fade" tabIndex="-1" id="shareModal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Partager le calendrier <strong>{calendarName}</strong></h5>
              </div>
              <div className="modal-body d-flex justify-content-center align-items-center" style={{ minHeight: '150px' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement du partage...</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => ref?.current?.close()}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="modal fade" tabIndex="-1" id="shareModal">
        <div className="modal-dialog">
          {shareMethod === 'link' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateToken();
              }}
            >
              <ModalBody
                shareMethod={shareMethod}
                setShareMethod={setShareMethod}
                existingShareToken={existingShareToken}
                calendarName={calendarName}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                expiration={expiration}
                setExpiration={setExpiration}
                permissions={permissions}
                setPermissions={setPermissions}
                handleCopyLink={handleCopyLink}
                handleInvite={handleInvite}
                emailToInvite={emailToInvite}
                setEmailToInvite={setEmailToInvite}
                sharedUsersData={sharedUsersData}
                refObj={ref}
              />
            </form>
          ) : (
            <ModalBody
              shareMethod={shareMethod}
              setShareMethod={setShareMethod}
              existingShareToken={existingShareToken}
              calendarName={calendarName}
              expiresAt={expiresAt}
              setExpiresAt={setExpiresAt}
              expiration={expiration}
              setExpiration={setExpiration}
              permissions={permissions}
              setPermissions={setPermissions}
              handleCopyLink={handleCopyLink}
              handleInvite={handleInvite}
              emailToInvite={emailToInvite}
              setEmailToInvite={setEmailToInvite}
              sharedUsersData={sharedUsersData}
              refObj={ref}
            />
          )}
        </div>
      </div>
    );
  }
);

ShareCalendarModal.propTypes = {
  loading: PropTypes.bool.isRequired,
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
  tokenCalendars: PropTypes.shape({
    createToken: PropTypes.func.isRequired,
  }).isRequired,
  sharedUserCalendars: PropTypes.shape({
    sendInvitation: PropTypes.func.isRequired,
  }).isRequired,
  setAlertType: PropTypes.func.isRequired,
  setAlertMessage: PropTypes.func.isRequired,
  setSelectedAlert: PropTypes.func,
  alertCategory: PropTypes.string,
};

export default ShareCalendarModal;
