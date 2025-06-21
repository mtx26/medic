import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { handleLogout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import HoveredUserProfile from './HoveredUserProfile';
import NotificationLine from './NotificationLine';
import PropTypes from 'prop-types';

function Navbar({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [calendarInfo, setCalendarInfo] = useState(null);
  const [basePath, setBasePath] = useState(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const notifRef = useRef();
  const userRef = useRef();
  const [tokenId, setTokenId] = useState(null);
  const locationList = {
    calendar: location.pathname.startsWith('/calendar/'),
    sharedUserCalendar: location.pathname.startsWith('/shared-user-calendar/'),
    tokenCalendar: location.pathname.startsWith('/shared-token-calendar/'),
  };

  const pathParts = location.pathname.split('/').filter(Boolean);

  const locationAvailableForReturnToCalendarList = {
    calendar: 
      pathParts.length === 2 && pathParts[0] === 'calendar',
    sharedUserCalendar:
      pathParts.length === 2 && pathParts[0] === 'shared-user-calendar',
  };

  const locationAvailableForReturnToCalendar = {
    calendar:
      pathParts.length === 3 &&
      pathParts[0] === 'calendar' &&
      (pathParts[2] === 'medicines' || pathParts[2] === 'boxes' || pathParts[2] === 'pillbox'),
    sharedUserCalendar:
      pathParts.length === 3 &&
      pathParts[0] === 'shared-user-calendar' &&
      (pathParts[2] === 'medicines' || pathParts[2] === 'boxes' || pathParts[2] === 'pillbox'),
    tokenCalendar:
      pathParts.length === 3 && pathParts[0] === 'shared-token-calendar',
  };
  const [isPortrait, setIsPortrait] = useState(window.innerHeight < window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  const isPillboxPage =
    pathParts.length === 3 &&
    ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(pathParts[0]) &&
    pathParts[2] === 'pillbox';

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight < window.innerWidth);
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (locationList.calendar && sharedProps.personalCalendars.calendarsData) {
      setBasePath('calendar');
      setCalendarInfo(
        sharedProps.personalCalendars.calendarsData.find(
          (calendar) => calendar.id === location.pathname.split('/')[2]
        )
      );
    } else if (
      locationList.sharedUserCalendar &&
      sharedProps.sharedUserCalendars.sharedCalendarsData
    ) {
      setBasePath('shared-user-calendar');
      setCalendarInfo(
        sharedProps.sharedUserCalendars.sharedCalendarsData.find(
          (calendar) => calendar.id === location.pathname.split('/')[2]
        )
      );
    } else if (locationList.tokenCalendar) {
      setBasePath('shared-token-calendar');
      setTokenId(location.pathname.split('/')[2]);
    } else {
      setCalendarInfo(null);
      setBasePath(null);
      setTokenId(null);
    }
  }, [
    location.pathname,
    sharedProps.personalCalendars.calendarsData,
    sharedProps.sharedUserCalendars.sharedCalendarsData,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { notificationsData, readNotification } = sharedProps.notifications;
  const { acceptInvitation, rejectInvitation } =  sharedProps.sharedUserCalendars;

  if (isPillboxPage && isPortrait && isMobile) {
    return (
      <Link
        to={`/${basePath}/${calendarInfo?.id}`}
        className="fs-2 text-dark"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1050,
        }}
      >
        <i className="bi bi-x-lg"></i>
      </Link>
    );
  }
  
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {/* Logo / Retour */}
          {locationAvailableForReturnToCalendarList.calendar ||
          locationAvailableForReturnToCalendarList.sharedUserCalendar ? (
            <Link to="/calendars" className="navbar-brand fs-4">
              <i className="bi bi-arrow-left"></i> Retour
            </Link>
          ) : calendarInfo?.id &&
            basePath &&
            (locationAvailableForReturnToCalendar.calendar ||
              locationAvailableForReturnToCalendar.sharedUserCalendar) ? (
            <Link
              to={`/${basePath}/${calendarInfo.id}`}
              className="navbar-brand fs-4"
            >
              <i className="bi bi-arrow-left"></i> Retour
            </Link>
          ) : locationList.tokenCalendar &&
            tokenId &&
            locationAvailableForReturnToCalendar.tokenCalendar ? (
            <Link
              to={`/shared-token-calendar/${tokenId}`}
              className="navbar-brand fs-4"
            >
              <i className="bi bi-arrow-left"></i> Retour
            </Link>
          ) : (
            <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
              <i className="bi bi-capsule"></i> MediTime
            </Link>
          )}

          {/* Titre calendrier + badge */}
          {((calendarInfo && calendarInfo.id) ||
            (locationList.tokenCalendar && tokenId)) && (
            <>
              {/* Titre calendrier pour desktop + badge desktop */}
              <div className="d-none d-lg-flex justify-content-center text-decoration-none text-dark">
                <div className="d-flex flex-column align-items-start w-auto">
                  <h4 className="m-0">
                    {calendarInfo && basePath && calendarInfo.id && (
                      <Link
                        to={`/${basePath}/${calendarInfo.id}`}
                        className="text-decoration-none text-dark"
                      >
                        <span className="text-muted">Calendrier : </span>
                        <span className="fw-bold">{calendarInfo.name}</span>
                      </Link>
                    )}
                  </h4>
                  {locationList.sharedUserCalendar && (
                    <div className="badge bg-info mt-2">
                      Calendrier partagé par{' '}
                      <HoveredUserProfile
                        user={{
                          email: calendarInfo.owner_email,
                          display_name: calendarInfo.owner_name,
                          photo_url: calendarInfo.owner_photo_url,
                        }}
                        trigger={<span>{calendarInfo.owner_name}</span>}
                      />
                    </div>
                  )}
                  {locationList.tokenCalendar && tokenId && (
                    <Link
                      to={`/shared-token-calendar/${tokenId}`}
                      className="text-decoration-none text-dark"
                    >
                      <div className="badge bg-info mt-2">
                        Calendrier partagé par un token
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Titre calendrier pour mobile + badge mobile */}
              <div className="d-flex d-lg-none flex-column align-items-end w-auto text-decoration-none text-dark">
                {calendarInfo && basePath && calendarInfo.id && (
                  <h4 className="m-1 fw-bold">
                    <Link
                      to={`/${basePath}/${calendarInfo.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {calendarInfo.name}
                    </Link>
                  </h4>
                )}
                {locationList.sharedUserCalendar && (
                  <div className="badge bg-info d-flex flex-column align-items-end">
                    <HoveredUserProfile
                      user={{
                        email: calendarInfo.owner_email,
                        display_name: calendarInfo.owner_name,
                        photo_url: calendarInfo.owner_photo_url,
                      }}
                      trigger={<span>{calendarInfo.owner_name}</span>}
                    />
                  </div>
                )}
                {locationList.tokenCalendar && tokenId && (
                  <Link
                    to={`/shared-token-calendar/${tokenId}`}
                    className="text-decoration-none text-dark"
                  >
                    <div className="badge bg-info">
                      Calendrier partagé par un token
                    </div>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Liens navigation + notifs + profil */}
          <div className="d-none d-lg-flex align-items-center">
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
              {userInfo?.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link">
                    <i className="bi bi-lock fs-5"></i> Admin
                  </Link>
                </li>
              )}

              {/* Notifs */}
              <li
                className="nav-item dropdown position-relative"
                ref={notifRef}
              >
                <button
                  aria-label="Notifications"
                  title="Notifications"
                  className="nav-link bg-transparent border-0 position-relative"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notificationsData &&
                    notificationsData.filter((notif) => !notif.read).length >
                      0 && (
                      <span className="position-absolute top-10 start-90 translate-middle badge rounded-pill bg-danger fs-7">
                        {
                          notificationsData.filter((notif) => !notif.read)
                            .length
                        }
                      </span>
                    )}
                </button>
                {showNotifDropdown && (
                  <ul
                    className="dropdown-menu dropdown-menu-end p-2 show"
                    style={{
                      minWidth: '500px',
                      maxHeight: '450px',
                      overflowY: 'auto',
                      right: '0',
                      left: 'auto',
                    }}
                  >
                    {notificationsData === null ? (
                      <li className="dropdown-item text-muted fs-6">
                        Chargement des notifications...
                      </li>
                    ) : (
                      notificationsData
                        .filter((notif) => !notif.read)
                        .slice(0, 5)
                        .map((notif) => (
                          <NotificationLine
                            key={notif.notification_id}
                            notif={notif}
                            onRead={readNotification}
                            onAccept={acceptInvitation}
                            onReject={rejectInvitation}
                            navigate={navigate}
                          />
                        ))
                    )}
                    {notificationsData &&
                      notificationsData.filter((notif) => !notif.read)
                        .length === 0 && (
                        <li className="dropdown-item text-muted fs-6">
                          Aucune nouvelle notification
                        </li>
                      )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary w-100"
                        aria-label="Ouvrir les notifications"
                        title="Ouvrir les notifications"
                        onClick={() => navigate('/notifications')}
                      >
                        <i className="bi bi-bell"></i> Ouvrir les notifications
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* Profil */}
              <li className="nav-item dropdown position-relative" ref={userRef}>
                <button
                  className="nav-link d-flex align-items-center border-0 bg-transparent"
                  aria-label="Profil"
                  title="Profil"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {userInfo ? (
                    <>
                      <img
                        src={
                          userInfo.photoURL ||
                          'https://www.w3schools.com/howto/img_avatar.png'
                        }
                        alt="Profil"
                        className="rounded-circle me-2"
                        width="32"
                        height="32"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-muted">
                        {userInfo.displayName || 'Utilisateur'}
                      </span>
                      <i className="bi bi-caret-down-fill ms-2"></i>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-circle fs-3 me-2"></i>
                      <span className="text-muted">Compte</span>
                    </>
                  )}
                </button>
                {showUserDropdown && (
                  <ul
                    className="dropdown-menu dropdown-menu-end p-2 show"
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      right: '0',
                      left: 'auto',
                    }}
                  >
                    {userInfo ? (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/profile">
                            <i className="bi bi-person fs-5 me-2"></i> Mon
                            profil
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/settings">
                            <i className="bi bi-gear fs-5 me-2"></i> Paramètres
                          </Link>
                        </li>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            aria-label="Déconnexion"
                            title="Déconnexion"
                            onClick={handleLogout}
                          >
                            <i className="bi bi-unlock fs-5 me-2"></i>{' '}
                            Déconnexion
                          </button>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/login">
                            <i className="bi bi-box-arrow-in-right fs-5 me-2"></i>{' '}
                            Connexion
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/register">
                            <i className="bi bi-person-plus fs-5 me-2"></i>{' '}
                            Inscription
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <nav className="navbar fixed-bottom bg-white shadow-sm py-2 border-top d-lg-none">
        <div className="container-fluid d-flex justify-content-around mb-2">
          <Link
            to="/"
            className="text-center text-dark text-decoration-none link-hover"
          >
            <i className="bi bi-house fs-4"></i>
            <div className="small">Accueil</div>
          </Link>
          <Link
            to="/calendars"
            className="text-center text-dark text-decoration-none link-hover"
          >
            <i className="bi bi-calendar-event fs-4"></i>
            <div className="small">Calendrier</div>
          </Link>
          <Link
            to="/shared-calendars"
            className="text-center text-dark text-decoration-none link-hover"
          >
            <i className="bi bi-people fs-4"></i>
            <div className="small">Partages</div>
          </Link>
          <Link
            to="/notifications"
            className="text-center text-dark text-decoration-none link-hover position-relative"
          >
            <i className="bi bi-bell fs-4"></i>
            <div className="small">Notifs</div>
            {notificationsData !== null &&
              notificationsData.filter((notif) => !notif.read).length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-7">
                  {notificationsData.filter((notif) => !notif.read).length}
                </span>
              )}
          </Link>
          <Link
            to="/settings"
            className="text-center text-dark text-decoration-none link-hover"
          >
            {userInfo ? (
              <img
                src={
                  userInfo?.photoURL ||
                  'https://www.w3schools.com/howto/img_avatar.png'
                }
                alt="Profil"
                className="rounded-circle me-2"
                width="32"
                height="32"
                referrerPolicy="no-referrer"
              />
            ) : (
              <i className="bi bi-person-circle fs-3 me-2"></i>
            )}
            <div className="small">Comptes</div>
          </Link>
        </div>
      </nav>
    </>
  );
}

export default Navbar;

Navbar.propTypes = {
  sharedProps: PropTypes.object.isRequired,
};
