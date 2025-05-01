import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { AuthContext } from "../contexts/LoginContext";
import { handleLogout } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Navbar({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const { authReady, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const { notificationsData, fetchNotifications, readNotification } = sharedProps.notifications;
  const { acceptInvitation, rejectInvitation } = sharedProps.invitations;
  const { fetchSharedCalendars } = sharedProps.calendars;
  
  useEffect(() => {
    if (authReady && currentUser) {
      fetchNotifications();
    }
  }, [authReady, currentUser, fetchNotifications]);


  return (
    <>
      {/* NAVBAR PC */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 d-none d-lg-flex">
        <div className="container">
          <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
            <i className="bi bi-capsule"></i> Medic Copresser
          </Link>

          <div className="collapse navbar-collapse justify-content-end">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <i className="bi bi-calendar-date fs-5"></i> Calendriers
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/shared-calendar" className="nav-link">
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
              <li className="nav-item dropdown">
                <button
                  className="nav-link position-relative bg-transparent border-0"
                  type="button"
                  id="notifDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Notifications"
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notificationsData.filter(notif => !notif.read).length > 0 && (
                    <span className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger">
                      {notificationsData.filter(notif => !notif.read).length}
                    </span>
                  )}
                </button>

                <ul className="dropdown-menu dropdown-menu-end p-2" aria-labelledby="notifDropdown" style={{ minWidth: "320px", maxHeight: "400px", overflowY: "auto" }}>
                  {notificationsData.filter(notif => !notif.read).length === 0 ? (
                    <li className="dropdown-item text-muted fs-6">Aucune nouvelle notification</li>
                  ) : (
                    <>
                    {/* TODO: max 5 notifications est unread */}
                      {notificationsData.filter(notif => !notif.read).slice(0, 5).map((notif) => (
                        <li 
                          key={notif.notification_token} 
                          className="dropdown-item py-2 fs-6 bg-light border-start border-4 border-primary p-2 rounded"
                        >
                          <div className="d-flex flex-column">
                            <div>
                              {notif.type === "calendar_invitation" && (
                                <>
                                <div>
                                  <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                                    <strong>{notif.sender_email}</strong> vous invite à rejoindre son calendrier <strong>{notif.calendar_name}</strong>
                                    <button 
                                      className="btn btn-sm btn-outline-primary ms-2" 
                                      onClick={() => {
                                        acceptInvitation(notif.notification_token)
                                        fetchSharedCalendars()
                                      }}
                                    >
                                      Accepter
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => rejectInvitation(notif.notification_token)}>Rejeter</button>
                                  </div>
                                  <small 
                                    className="text-muted"
                                  >
                                    {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </>
                              )}
                              {notif.type === "calendar_invitation_accepted" && (
                                <>
                                  <div
                                    onClick={() => readNotification(notif.notification_token)}
                                    title="Marquer comme lu"
                                    style={{
                                      cursor: "pointer",
                                    }}
                                  >
                                    <div>
                                      <i className="bi bi-check-circle-fill me-2 text-success"></i>
                                      <strong>{notif.receiver_email}</strong> a accepté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                                    </div>
                                    <small 
                                      className="text-muted"
                                    >
                                      {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                  </div>
                                </>
                              )}
                              {notif.type === "calendar_invitation_rejected" && (
                                <>
                                  <div
                                    onClick={() => readNotification(notif.notification_token)}
                                    title="Marquer comme lu"
                                    style={{
                                      cursor: "pointer",
                                    }}
                                  >
                                    <div>
                                      <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                                      <strong>{notif.receiver_email}</strong> a rejeté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                                    </div>
                                    <small 
                                      className="text-muted"
                                    >
                                      {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                  </div>
                                </>
                              )}
                              {notif.type === "calendar_shared_deleted_by_owner" && (
                                <>
                                  <div>
                                    <i className="bi bi-trash-fill me-2 text-danger"></i>
                                    <strong>{notif.owner_email}</strong> a arrêté de partager le calendrier <strong>{notif.calendar_name}</strong> avec vous
                                  </div>
                                  <small 
                                    className="text-muted"
                                  >
                                    {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </>
                              )}
                              {notif.type === "calendar_shared_deleted_by_receiver" && (
                                <>
                                  <div>
                                    <i className="bi bi-trash-fill me-2 text-danger"></i>
                                    <strong>{notif.receiver_email}</strong> a retiré le calendrier <strong>{notif.calendar_name}</strong> que vous lui aviez partagé.
                                  </div>
                                  <small 
                                    className="text-muted"
                                  >
                                    {new Date(notif.timestamp).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
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
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {userInfo?.photoURL ? (
                    <img
                      src={userInfo.photoURL}
                      alt="Profil"
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <i className="fas fa-user-circle fa-lg me-2"></i>
                  )}
                  {userInfo?.displayName || "Compte"}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {userInfo ? (
                    <>
                      <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person fs-5 me-2"></i> Mon profil</Link></li>
                      <li><Link className="dropdown-item" to="/account"><i className="bi bi-gear fs-5 me-2"></i> Paramètres</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={handleLogout}><i className="bi bi-unlock fs-5 me-2"></i> Déconnexion</button></li>
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

      {/* NAVBAR MOBILE */}
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm py-2 d-lg-none">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold text-primary fs-4">
            <i className="bi bi-capsule"></i> Medic Copresser
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasNavbar"
            aria-controls="offcanvasNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="offcanvas offcanvas-end"
            tabIndex="-1"
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
                Menu
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav">
                {/* Navigation */}
                <li className="nav-item">
                  <button onClick={() => navigate("/")} className="nav-link" data-bs-dismiss="offcanvas">
                    <i className="bi bi-calendar-date fs-5 me-2"></i> Calendriers
                  </button>
                </li>
                <li className="nav-item">
                  <button onClick={() => navigate("/shared-calendar")} className="nav-link" data-bs-dismiss="offcanvas">
                    <i className="bi bi-box-arrow-up fs-5 me-2"></i> Partagés
                  </button>
                </li>
                {userInfo?.role === "admin" && (
                  <li className="nav-item">
                    <button onClick={() => navigate("/admin")} className="nav-link" data-bs-dismiss="offcanvas">
                      <i className="bi bi-lock fs-5 me-2"></i> Admin
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    onClick={() => navigate("/notifications")}
                    className="nav-link btn btn-link p-0 text-start"
                    data-bs-dismiss="offcanvas"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="position-relative d-inline-block me-2">
                      <i className="bi bi-bell fs-5"></i>
                      {notificationsData.filter(notif => !notif.read).length > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-14">
                          {notificationsData.filter(notif => !notif.read).length}
                        </span>
                      )}
                    </div>
                    <span className="text-muted">Notifications</span>
                  </button>
                </li>

                {userInfo && (
                  <>
                    <hr />
                    <li className="nav-item">
                      <button onClick={() => navigate("/profile")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-person fs-5 me-2"></i> Mon profil
                      </button>
                    </li>
                    <li className="nav-item">
                      <button onClick={() => navigate("/account")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-gear fs-5 me-2"></i> Paramètres
                      </button>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link btn btn-link text-start" onClick={handleLogout} data-bs-dismiss="offcanvas">
                        <i className="bi bi-unlock fs-5 me-2"></i> Déconnexion
                      </button>
                    </li>
                  </>
                )}

                {!userInfo && (
                  <>
                    <hr />
                    <li className="nav-item">
                      <button onClick={() => navigate("/login")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-box-arrow-in-right fs-5 me-2"></i> Connexion
                      </button>
                    </li>
                    <li className="nav-item">
                      <button onClick={() => navigate("/register")} className="nav-link" data-bs-dismiss="offcanvas">
                        <i className="bi bi-person-plus fs-5 me-2"></i> Inscription
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
