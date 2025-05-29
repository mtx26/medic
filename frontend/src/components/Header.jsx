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
  const [calendarId, setCalendarId] = useState(null);
  const [basePath, setBasePath] = useState(null);

  const locationAvailable = {
    calendar: location.pathname.startsWith("/calendar/"),
    sharedUserCalendar: location.pathname.startsWith("/shared-user-calendar/"),
    tokenCalendar: location.pathname.startsWith("/shared-token-calendar/"),
  }

  const pathParts = location.pathname.split("/").filter(Boolean);

  const locationAvailableForReturnToCalendarList = {
    calendar: pathParts.length === 2 && pathParts[0] === "calendar",
    sharedUserCalendar: pathParts.length === 2 && pathParts[0] === "shared-user-calendar",
  };

  const locationAvailableForReturnToCalendar = {
    calendar: pathParts.length === 3 && pathParts[0] === "calendar" && (pathParts[2] === "medicines" || pathParts[2] === "boxes"), 
    sharedUserCalendar: pathParts.length === 3 && pathParts[0] === "shared-user-calendar" && (pathParts[2] === "medicines" || pathParts[2] === "boxes"),
  };

  
  useEffect(() => {
    console.log(locationAvailableForReturnToCalendar);
  }, [locationAvailableForReturnToCalendar]);

  useEffect(() => {
    if (locationAvailable.calendar && sharedProps.personalCalendars.calendarsData) {
      setBasePath('calendar');
      setCalendarName(sharedProps.personalCalendars.calendarsData.find(calendar => calendar.id === location.pathname.split("/")[2]).name);
      setCalendarId(sharedProps.personalCalendars.calendarsData.find(calendar => calendar.id === location.pathname.split("/")[2]).id);
    } else if (locationAvailable.sharedUserCalendar && sharedProps.sharedUserCalendars.calendarsData) {
      setBasePath('shared-user-calendar');
      setCalendarName(sharedProps.sharedUserCalendars.calendarsData.find(calendar => calendar.id === location.pathname.split("/")[2]).name);
      setCalendarId(sharedProps.sharedUserCalendars.calendarsData.find(calendar => calendar.id === location.pathname.split("/")[2]).id);
    } else {
      setCalendarName(null);
      setCalendarId(null);
      setBasePath(null);
    }
  }, [location.pathname, sharedProps.personalCalendars.calendarsData, sharedProps.sharedUserCalendars.calendarsData]);

  const { notificationsData, readNotification } = sharedProps.notifications;
  const { acceptInvitation, rejectInvitation } = sharedProps.sharedUserCalendars;


  return (
    <>
      {/* NAVBAR PC */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {locationAvailableForReturnToCalendarList.calendar || locationAvailableForReturnToCalendarList.sharedUserCalendar ? (
            <Link to="/calendars" className="navbar-brand fs-4">
              <i className="bi bi-arrow-left"></i> Retour
            </Link>
          ) : locationAvailableForReturnToCalendar.calendar || locationAvailableForReturnToCalendar.sharedUserCalendar ? (
            <Link to={`/${basePath}/${calendarId}`} className="navbar-brand fs-4">
              <i className="bi bi-arrow-left"></i> Retour
            </Link>
          ) : (
            <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
              <i className="bi bi-capsule"></i> MediTime
            </Link>
          )}

          {calendarName && basePath && calendarId && (
            <>
              <a
                href={`/${basePath}/${calendarId}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${basePath}/${calendarId}`);
                }}
                className="flex-grow-1 d-none d-lg-flex justify-content-center text-decoration-none text-dark"
              >
                <h4 className="m-0">Calendrier : <span className="fw-bold">{calendarName}</span></h4>
              </a>

              <a
                href={`/${basePath}/${calendarId}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${basePath}/${calendarId}`);
                }}
                className="d-flex align-items-center d-lg-none text-decoration-none text-dark"
              >
                <h4 className="me-2"><span className="fw-bold">{calendarName}</span></h4>
              </a>
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
                  {notificationsData !== null && notificationsData.filter(notif => !notif.read).length > 0 && (
                    <span className="position-absolute top-10 start-90 translate-middle badge rounded-pill bg-danger fs-7">
                      {notificationsData.filter(notif => !notif.read).length}
                    </span>
                  )}
                </button>

                <ul className="dropdown-menu dropdown-menu-end p-2" aria-labelledby="notifDropdown" style={{ minWidth: "320px", maxHeight: "400px", overflowY: "auto" }}>
                  {notificationsData === null && (
                    <li className="dropdown-item text-muted fs-6">Chargement des notifications...</li>
                  )}
                  {notificationsData !== null && notificationsData.filter(notif => !notif.read).slice(0, 5).map((notif) => (
                    <NotificationLine
                      key={notif.notification_id}
                      notif={notif}
                      onRead={readNotification}
                      onAccept={acceptInvitation}
                      onReject={rejectInvitation}
                      navigate={navigate}
                    />
                  ))}
                  {notificationsData !== null && notificationsData.filter(notif => !notif.read).length === 0 && (
                    <li className="dropdown-item text-muted fs-6">Aucune nouvelle notification</li>
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
          <Link to="/" className="text-center text-dark text-decoration-none link-hover">
            <i className="bi bi-house fs-4"></i>
            <div className="small">Accueil</div>
          </Link>
          <Link to="/calendars" className="text-center text-dark text-decoration-none link-hover">
            <i className="bi bi-calendar-event fs-4"></i>
            <div className="small">Calendrier</div>
          </Link>
          <Link to="/shared-calendars" className="text-center text-dark text-decoration-none link-hover">
            <i className="bi bi-people fs-4"></i>
            <div className="small">Partages</div>
          </Link>
          <Link to="/notifications" className="text-center text-dark text-decoration-none link-hover position-relative">
            <i className="bi bi-bell fs-4"></i>
            <div className="small">Notifs</div>
            {notificationsData !== null && notificationsData.filter(notif => !notif.read).length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-7">
                {notificationsData.filter(notif => !notif.read).length}
              </span>
            )}
          </Link>
          <Link to="/account" className="text-center text-dark text-decoration-none link-hover">
            <i className="bi bi-person-circle fs-4"></i>
            <div className="small">Comptes</div>
          </Link>
        </div>
      </nav>
    </>
  );
}

function NotificationLine({ notif, onRead, onAccept, onReject, navigate }) {
  const isUnread = !notif.read;
  const timestamp = new Date(notif.timestamp).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const user = (
    <HoveredUserProfile
      user={{
        photo_url: notif.sender_photo_url,
        display_name: notif.sender_name,
        email: notif.sender_email,
      }}
      trigger={<strong>{notif.sender_name}</strong>}
    />
  );

  const iconStyle = { verticalAlign: "middle" };

  let icon = null;
  let message = null;
  let actions = null;

  switch (notif.notification_type) {
    case "calendar_invitation":
      icon = <i className="bi bi-person-plus-fill text-primary me-2" style={iconStyle}></i>;
      if (!notif.accepted) {
        message = <>{user} vous invite à rejoindre le calendrier <strong>{notif.calendar_name}</strong></>;
        actions = (
          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-success me-2"
              onClick={async (e) => {
                e.stopPropagation();
                await onAccept(notif.notification_id);
                navigate(`/shared-user-calendar/${notif.calendar_id}`);
              }}
            >
              <i className="bi bi-check-circle-fill me-2 text-success"></i> Accepter
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                onReject(notif.notification_id);
              }}
            >
              <i className="bi bi-x-circle-fill me-2 text-danger"></i> Rejeter
            </button>
          </div>
        );
      } else {
        message = <>Vous avez rejoint le calendrier <strong>{notif.calendar_name}</strong> de {user}</>;
      }
      break;

    case "calendar_invitation_accepted":
      icon = <i className="bi bi-check-circle-fill text-success me-2" style={iconStyle}></i>;
      message = <>{user} a accepté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong></>;
      break;

    case "calendar_invitation_rejected":
      icon = <i className="bi bi-x-circle-fill text-danger me-2" style={iconStyle}></i>;
      message = <>{user} a refusé votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong></>;
      break;

    case "calendar_shared_deleted_by_owner":
      icon = <i className="bi bi-trash-fill text-danger me-2" style={iconStyle}></i>;
      message = <>{user} a arrêté de partager le calendrier <strong>{notif.calendar_name}</strong> avec vous</>;
      break;

    case "calendar_shared_deleted_by_receiver":
      icon = <i className="bi bi-trash-fill text-danger me-2" style={iconStyle}></i>;
      message = <>{user} a retiré le calendrier <strong>{notif.calendar_name}</strong></>;
      break;

    default:
      return null;
  }

  return (
    <li
      className={`list-group-item list-group-item-action border-0 border-start border-4 ${
        isUnread ? "bg-unread border-primary p-2 rounded" : "bg-light text-muted"
      }`}
      onClick={() => isUnread && onRead(notif.notification_id)}
      style={isUnread ? { cursor: "pointer" } : {}}
      title={isUnread ? "Marquer comme lue" : ""}
    >
      <p className="mb-0">
        {icon}
        {message}
      </p>
      {actions}
      <small className="text-muted d-block mt-2">{timestamp}</small>
    </li>
  );
}


export default Navbar;

Navbar.propTypes = {
  sharedProps: PropTypes.object.isRequired,
};

