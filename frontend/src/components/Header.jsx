import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { handleLogout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import HoveredUserProfile from "./HoveredUserProfile";
import 'bootstrap';
import PropTypes from 'prop-types';


function Navbar({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [calendarName, setCalendarName] = useState(null);
  const [calendarType, setCalendarType] = useState(null);
  const [calendarUrl, setCalendarUrl] = useState(null);

  useEffect(() => {
    if (location.pathname.startsWith("/calendar/")) {
      setCalendarType("personal");
      setCalendarUrl(location.pathname);
    }
    if (location.pathname.startsWith("/shared-user-calendar/")) {
      setCalendarType("shared");
      setCalendarUrl(location.pathname);
    }
  }, [location.pathname]);
  

  useEffect(() => {
    if (calendarType === "personal" && sharedProps.personalCalendars.calendarsData) {
      setCalendarName(sharedProps.personalCalendars.calendarsData.find(calendar => calendar.id === calendarUrl.split("/")[2]).name);
    }
    if (calendarType === "shared" && sharedProps.sharedUserCalendars.calendarsData) {
      setCalendarName(sharedProps.sharedUserCalendars.calendarsData.find(calendar => calendar.id === calendarUrl.split("/")[2]).name);
    }
  }, [sharedProps.personalCalendars.calendarsData, sharedProps.sharedUserCalendars.calendarsData, sharedProps.tokenCalendars.calendarsData]);


  const { notificationsData, readNotification } = sharedProps.notifications;
  const { acceptInvitation, rejectInvitation } = sharedProps.sharedUserCalendars;


  return (
    <>
      {/* NAVBAR PC */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
            <i className="bi bi-capsule"></i> MediTime
          </Link>

          {calendarName && (
            <>
              <div 
                className="flex-grow-1 d-none d-lg-flex justify-content-center"
                onClick={() => navigate(`${calendarUrl}/${calendarId}`)}
              >
                <h4 className="m-0 fw-bold">{calendarName}</h4>
              </div>
              <div 
                className="d-flex align-items-center d-lg-none"
                onClick={() => navigate(`${calendarUrl}/${calendarId}`)}
              >
                <h4 className="me-2 fw-bold">{calendarName}</h4>
              </div>
            </>
          )}
          <div className="d-none d-lg-flex align-items-cente">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item">
                <Link to="/calendars" className="nav-link">
                  <i className="bi bi-calendar-date fs-5"></i> Calendriers
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/shared-calendars" className="nav-link">
                  <i className="bi bi-box-arrow-up fs-5"></i> Partagés
                </Link>
              </li>
              {userInfo?.role === "admin" && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link">
                    <i className="bi bi-lock fs-5"></i> Admin
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <button
                  className="nav-link position-relative bg-transparent border-0"
                  id="notifDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Notifications"
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notificationsData.filter(notif => !notif.read).length > 0 && (
                    <span className="position-absolute top-10 start-90 translate-middle badge rounded-pill bg-danger fs-7">
                      {notificationsData.filter(notif => !notif.read).length}
                    </span>
                  )}
                </button>

                <ul className="dropdown-menu dropdown-menu-end p-2" aria-labelledby="notifDropdown" style={{ minWidth: "320px", maxHeight: "400px", overflowY: "auto" }}>
                  {notificationsData.filter(notif => !notif.read).length === 0 ? (
                    <li className="dropdown-item text-muted fs-6">Aucune nouvelle notification</li>
                  ) : (
                    <>
                      {notificationsData.filter(notif => !notif.read).slice(0, 5).map((notif) => (
                        <div key={notif.notification_id}>
                          {notif.notification_type === "calendar_invitation" && (
                            <li 
                              key={notif.notification_id} 
                              className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                              onClick={() => readNotification(notif.notification_id)}
                              title="Marquer comme lu"
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <div className="d-flex flex-column">
                                <p className="mb-0">
                                  <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                                  <HoveredUserProfile
                                    user={{
                                      photo_url: notif.sender_photo_url,
                                      display_name: notif.sender_name,
                                      email: notif.sender_email
                                    }}
                                    trigger={<strong>{notif.sender_name}</strong>}
                                  />
                                  {" "}vous invite à rejoindre son calendrier <strong>{notif.calendar_name}</strong>
                                </p>

                                <div className="d-flex gap-2">
                                  <button 
                                    className="btn btn-sm btn-outline-primary" 
                                    onClick={async () => {
                                      await acceptInvitation(notif.notification_id)
                                      navigate(`/shared-user-calendar/${notif.calendar_id}`)
                                    }}
                                  >
                                    Accepter
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger" 
                                    onClick={() => rejectInvitation(notif.notification_id)}
                                  >
                                    Rejeter
                                  </button>
                                </div>
                                <small 
                                  className="text-muted"
                                >
                                  {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </small>
                              </div>
                            </li>
                          )}
                          {notif.notification_type === "calendar_invitation_accepted" && (
                            <li 
                              key={notif.notification_id} 
                              className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                              onClick={() => readNotification(notif.notification_id)}
                              title="Marquer comme lu"
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <p className="mb-0">
                                <i className="bi bi-check-circle-fill me-2 text-success"></i>
                                <HoveredUserProfile
                                  user={{
                                    photo_url: notif.sender_photo_url,
                                    display_name: notif.sender_name,
                                    email: notif.sender_email
                                  }}
                                  trigger={<strong>{notif.sender_name}</strong>}
                                />
                                {" "}a accepté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                              </p>
                              <small 
                                className="text-muted"
                              >
                                {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </li>
                          )}
                          {notif.notification_type === "calendar_invitation_rejected" && (
                            <li 
                              key={notif.notification_id} 
                              className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                              onClick={() => readNotification(notif.notification_id)}
                              title="Marquer comme lu"
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <p className="mb-0">
                                <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                                <HoveredUserProfile
                                  user={{
                                    photo_url: notif.sender_photo_url,
                                    display_name: notif.sender_name,
                                    email: notif.sender_email
                                  }}
                                  trigger={<strong>{notif.sender_name}</strong>}
                                />
                                {" "}a rejeté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                              </p>
                              <small 
                                className="text-muted"
                              >
                                {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </small>            
                            </li>
                          )}
                          {notif.notification_type === "calendar_shared_deleted_by_owner" && (
                            <li 
                              key={notif.notification_id} 
                              className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                              onClick={() => readNotification(notif.notification_id)}
                              title="Marquer comme lu"
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <p className="mb-0">
                                <i className="bi bi-trash-fill me-2 text-danger"></i>
                                <HoveredUserProfile
                                  user={{
                                    photo_url: notif.sender_photo_url,
                                    display_name: notif.sender_name,
                                    email: notif.sender_email
                                  }}
                                  trigger={<strong>{notif.sender_name}</strong>}
                                />
                                {" "}a arrêté de partager le calendrier <strong>{notif.calendar_name}</strong> avec vous
                              </p>
                              <small 
                                className="text-muted"
                              >
                                {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </li>
                          )}
                          {notif.notification_type === "calendar_shared_deleted_by_receiver" && (
                            <li 
                              key={notif.notification_id} 
                              className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                              onClick={() => readNotification(notif.notification_id)}
                              title="Marquer comme lu"
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <p className="mb-0">
                                <i className="bi bi-trash-fill me-2 text-danger"></i>
                                <HoveredUserProfile
                                  user={{
                                    photo_url: notif.sender_photo_url,
                                    display_name: notif.sender_name,
                                    email: notif.sender_email
                                  }}
                                  trigger={<strong>{notif.sender_name}</strong>}
                                />
                                {" "}a retiré le calendrier <strong>{notif.calendar_name}</strong> que vous lui aviez partagé.
                              </p>
                              <small 
                                className="text-muted"
                              >
                                {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </li>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li className="text-center">
                    <button
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={() => navigate("/notifications")}
                    >
                      <i className="bi bi-bell"></i> Ouvrir les notifications
                    </button>
                  </li>
                </ul>
              </li>


              {/* Dropdown utilisateur */}
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle d-flex align-items-center border-0 bg-transparent"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Mon profil"
                >
                  {userInfo ? (
                    <>
                      <img
                        src={userInfo.photoURL || "https://www.w3schools.com/howto/img_avatar.png"}
                        alt="Profil"
                        className="rounded-circle me-2"
                        width="32"
                        height="32"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-muted">{userInfo.displayName || "Utilisateur"}</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-circle fs-3 me-2"></i>
                      <span className="text-muted">Compte</span>
                    </>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {userInfo ? (
                    <>
                      <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person fs-5 me-2"></i> Mon profil</Link></li>
                      <li><Link className="dropdown-item" to="/account"><i className="bi bi-gear fs-5 me-2"></i> Paramètres</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item" 
                          onClick={handleLogout}
                        >
                          <i className="bi bi-unlock fs-5 me-2"></i> Déconnexion
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li><Link className="dropdown-item" to="/login"><i className="bi bi-box-arrow-in-right fs-5 me-2"></i> Connexion</Link></li>
                      <li><Link className="dropdown-item" to="/register"><i className="bi bi-person-plus fs-5 me-2"></i> Inscription</Link></li>
                    </>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <nav className="navbar fixed-bottom bg-white shadow-sm py-2 border-top d-lg-none">
        <div className="container-fluid d-flex justify-content-around">
          <div className="text-center" onClick={() => navigate('/')}>
            <i className="bi bi-house fs-4"></i>
            <div className="small">Accueil</div>
          </div>
          <div className="text-center" onClick={() => navigate('/calendars')}>
            <i className="bi bi-calendar-event fs-4"></i>
            <div className="small">Calendrier</div>
          </div>
          <div className="text-center" onClick={() => navigate('/shared-calendars')}>
            <i className="bi bi-people fs-4"></i>
            <div className="small">Partages</div>
          </div>
          <div className="text-center position-relative" onClick={() => navigate('/notifications')}>
            <i className="bi bi-bell fs-4"></i>
            <div className="small">Notifs</div>
            {notificationsData.filter(notif => !notif.read).length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-7">
                {notificationsData.filter(notif => !notif.read).length}
              </span>
            )}
          </div>
          <div className="text-center" onClick={() => navigate('/account')}>
            <i className="bi bi-person-circle fs-4"></i>
            <div className="small">Comptes</div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;

Navbar.propTypes = {
  sharedProps: PropTypes.object.isRequired,
};

