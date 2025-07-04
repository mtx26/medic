import { forwardRef, useState, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import HoveredUserProfile from './HoveredUserProfile';
import PropTypes from 'prop-types';
import Modal from 'bootstrap/js/dist/modal';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  if (existingShareToken) {
    const link = `${VITE_URL}/shared-token-calendar/${existingShareToken.id}`;

    return (
      <>
        <p>{t('link_already_exists')}</p>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            aria-label={t('shared_link_label')}
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
            aria-label={t('manage_link')}
            title={t('manage_link')}
          >
            <i className="bi bi-gear"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => handleCopyLink(link)}
            aria-label={t('copy_link')}
            title={t('copy_link')}
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
        {t('link_will_be_generated')} <strong>{calendarName}</strong>.
      </p>
      <label htmlFor="newTokenExpiration" className="form-label">
        {t('link_expiration')}
      </label>
      <select
        id="newTokenExpiration"
        className={'form-select mb-2'}
        value={expiration}
        onChange={(e) => {
          setExpiration(e.target.value);
        }}
      >
        <option value="never">{t('never')}</option>
        <option value="date">{t('choose_date')}</option>
      </select>
      {expiration !== 'never' && (
        <input
          type="date"
          className={`form-control`}
          aria-label={t('expiration_date')}
          id={'newTokenExpiration-' + new Date().getTime()}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          required
        />
      )}
      <label htmlFor="newTokenPermissions" className="form-label mt-2">
        {t('permissions')}
      </label>
      <select
        id="newTokenPermissions"
        className={'form-select'}
        value={permissions}
        onChange={(e) => setPermissions(e.target.value)}
      >
        <option value="read">{t('read_only')}</option>
        <option value="edit">{t('read_write')}</option>
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
  const { t } = useTranslation();

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
                      alt={t('profile')}
                      className="rounded-circle"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <span>
                      <strong>{user.receiver_name}</strong>
                      <br />
                      {t('access')}: {user.access}
                    </span>
                  </span>
                }
              />
              <span
                className={`badge rounded-pill ${user.accepted ? 'bg-success' : 'bg-warning text-dark'}`}
              >
                {user.accepted ? t('accepted') : t('pending')}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        {t('send_invitation')} <strong>{calendarName}</strong>.
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
            aria-label={t('recipient_email')}
            placeholder={t('recipient_email')}
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            id="emailToInvite"
            required
          />
          <button
            className="btn btn-outline-primary"
            type="submit"
            aria-label={t('send_invitation')}
            title={t('send_invitation')}
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
  const { t } = useTranslation();

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">
          {t('share_calendar')} <strong>{calendarName}</strong>
        </h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => refObj?.current?.close()}
          aria-label={t('close')}
          title={t('close')}
        ></button>
      </div>

      <div className="modal-body">
        <div className="mb-4 text-center">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${shareMethod === 'link' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setShareMethod('link')}
              aria-label={t('link')}
              title={t('link')}
            >
              <i className="bi bi-link"></i> {t('link')}
            </button>
            <button
              type="button"
              className={`btn ${shareMethod === 'account' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setShareMethod('account')}
              aria-label={t('accounts')}
              title={t('accounts')}
            >
              <i className="bi bi-person-plus-fill"></i> {t('accounts')}
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
          aria-label={t('close')}
          title={t('close')}
        >
          {t('close')}
        </button>
        {!existingShareToken && shareMethod === 'link' && (
          <button
            className="btn btn-outline-primary"
            type="submit"
            aria-label={t('share')}
            title={t('share')}
          >
            <i className="bi bi-share"></i> {t('share')}
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
    const { t } = useTranslation();

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
                <h5 className="modal-title">
                  {t('share_calendar')} <strong>{calendarName}</strong>
                </h5>
              </div>
              <div
                className="modal-body d-flex justify-content-center align-items-center"
                style={{ minHeight: '150px' }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('loading_share')}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => ref?.current?.close()}
                >
                  {t('close')}
                </button>
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
