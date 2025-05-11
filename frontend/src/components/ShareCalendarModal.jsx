import { forwardRef, useState, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import HoveredUserProfile from './HoveredUserProfile';

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

  const VITE_URL = import.meta.env.VITE_VITE_URL;

  const [shareMethod, setShareMethod] = useState('link');
  const [expiresAt, setExpiresAt] = useState(null);
  const [permissions, setPermissions] = useState('read');
  const [emailToInvite, setEmailToInvite] = useState('');

  useImperativeHandle(ref, () => ({
    open: () => {
      setTimeout(() => {
        const modal = new window.bootstrap.Modal(document.getElementById('shareModal'));
        modal.show();
      }, 0);
    },
    close: () => {
      const modal = window.bootstrap.Modal.getInstance(document.getElementById('shareModal'));
      if (modal) modal.hide();
      document.activeElement?.blur();
    }
  }));

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setAlertType("success");
      if (alertCategory) {
        setSelectedAlert(alertCategory);
      }
      setAlertMessage("🔗 Lien copié !");
      ref.current.close();
    } catch {
      setAlertType("danger");
      if (alertCategory) {
        setSelectedAlert(alertCategory);
      }
      setAlertMessage("❌ Erreur lors de la copie du lien.");
    }
  };

  const handleInvite = async () => {
    const rep = await sharedUserCalendars.sendInvitation(emailToInvite, calendarId);
    if (rep.success) {
      setAlertType("success");
      if (alertCategory) {
        setSelectedAlert(alertCategory);
      }
      setAlertMessage("✅ "+ rep.message);
    } else {
      setAlertType("danger");
      if (alertCategory) {
        setSelectedAlert(alertCategory);
      }
      setAlertMessage("❌ "+ rep.error);
    }
    ref.current.close();
  };

  const handleCreateToken = async () => {
    const rep = await tokenCalendars.createToken(calendarId, expiresAt, permissions);
    if (rep.success) {
      try {
        await navigator.clipboard.writeText(`${VITE_URL}/shared-token-calendar/${rep.token}`);
        setAlertType("success");
        if (alertCategory) {
          setSelectedAlert(alertCategory);
        }
        setAlertMessage("✅ "+ rep.message);
      } catch {
        setAlertType("danger");
        if (alertCategory) {
          setSelectedAlert(alertCategory);
        }
        setAlertMessage("❌ Erreur lors de la copie du lien.");
      }
    } else {
      setAlertType("danger");
      if (alertCategory) {
        setSelectedAlert(alertCategory);
      }
      setAlertMessage("❌ " + rep.error);
    }
    ref.current.close();
  };

  return (
    <div className="modal fade" tabIndex="-1" id="shareModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Partager le calendrier <strong>{calendarName}</strong></h5>
            <button type="button" className="btn-close" onClick={() => ref.current.close()}></button>
          </div>

          <div className="modal-body">
            <div className="mb-4 text-center">
              <div className="btn-group" role="group">
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

            {shareMethod === 'link' ? (
              <div className="d-flex flex-column gap-3">
                {existingShareToken ? (
                  <>
                    <p>Un lien existe déjà pour ce calendrier.</p>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={`${VITE_URL}/shared-token-calendar/${existingShareToken.token}`}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-warning"
                        onClick={() => {
                          navigate('/shared-calendar');
                          ref.current.close();
                        }}
                        title="Gérer le lien"
                      >
                        <i className="bi bi-gear"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleCopyLink(`${VITE_URL}/shared-token-calendar/${existingShareToken.token}`)}
                        title="Copier le lien"
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Un lien sera généré pour <strong>{calendarName}</strong>.</p>
                    <label htmlFor="newTokenExpiration" className="form-label">Expiration du lien</label>
                    <select
                      id="newTokenExpiration"
                      className="form-select mb-2"
                      value={expiresAt === null ? '' : 'date'}
                      onChange={(e) => setExpiresAt(e.target.value === '' ? null : '')}
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
                      />
                    )}
                    <label htmlFor="newTokenPermissions" className="form-label mt-2">Permissions</label>
                    <select
                      id="newTokenPermissions"
                      className="form-select"
                      value={permissions}
                      onChange={(e) => setPermissions(e.target.value)}
                    >
                      <option value="read">Lecture seule</option>
                      <option value="edit">Lecture + Édition</option>
                    </select>
                  </>
                )}
              </div>
            ) : (
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
                        <span className={`badge rounded-pill ${user.accepted ? 'bg-success' : 'bg-warning text-dark'}`}>{user.accepted ? 'Accepté' : 'En attente'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p>Envoyer une invitation pour accéder à <strong>{calendarName}</strong>.</p>
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
                    onClick={handleInvite}
                  >
                    Partager
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={() => ref.current.close()}>Fermer</button>
            {!existingShareToken && shareMethod === 'link' && (
              <button type="button" className="btn btn-outline-primary" onClick={handleCreateToken}>
                Partager
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShareCalendarModal;
