import React from "react";
import HoveredUserProfile from "../components/HoveredUserProfile";
import { useNavigate } from "react-router-dom";

function NotificationsPage({ notifications, sharedUserCalendars }) {
  const navigate = useNavigate();

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary">
          <i className="bi bi-bell-fill me-2"></i> Notifications
        </h4>
      </div>

      {notifications.notificationsData.length === 0 ? (
        <div className="alert alert-info text-center">Aucune notification pour le moment.</div>
      ) : (
        <ul className="list-group">
          {notifications.notificationsData.map((notif) => (
              <li
                key={notif.notification_id}
								className={`list-group-item list-group-item-action border-0 border-start border-4 ${notif.read ? "bg-light text-muted" : "bg-unread border-primary p-2 rounded"}`}
                onClick={() => {
                  if (!notif.read) notifications.readNotification(notif.notification_id);
                }}
                style={!notif.read ? { cursor: "pointer" } : {}}
                title={!notif.read ? "Marquer comme lue" : ""}
              >
                {/* Invitation reçue */}
                {notif.notification_type === "calendar_invitation" && (
                  <>
                    {!notif.accepted ? (
                      <>
                        <p className="mb-0">
                          <i className="bi bi-person-plus-fill text-primary me-2" style={{ verticalAlign: "middle" }}></i>
                          <HoveredUserProfile
                            user={{
                              photo_url: notif.sender_photo_url,
                              display_name: notif.sender_name,
                              email: notif.sender_email,
                            }}
                            trigger={<strong>{notif.sender_name}</strong>}
                          />
                          {" "}vous invite à rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                        </p>

                        <div className="mt-2">
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={async () => {
                              await sharedUserCalendars.acceptInvitation(notif.notification_id);
                              navigate(`/shared-user-calendar/${notif.calendar_id}`);
                            }}  
                          >
                            <i className="bi bi-check-circle-fill me-2 text-success"></i> Accepter
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => sharedUserCalendars.rejectInvitation(notif.notification_id)}
                          >
                            <i className="bi bi-x-circle-fill me-2 text-danger"></i> Rejeter
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="mb-0">
                        <i className="bi bi-person-plus-fill text-primary me-2" style={{ verticalAlign: "middle" }}></i>
                        Vous avez rejoint le calendrier <strong>{notif.calendar_name}</strong> de{" "}
                        <HoveredUserProfile
                          user={{
                            photo_url: notif.sender_photo_url,
                            display_name: notif.sender_name,
                            email: notif.sender_email
                          }}
                          trigger={<strong>{notif.sender_name}</strong>}
                        />
                      </p>
                    )}
                  </>
                )}

                {/* Invitation acceptée */}
                {notif.notification_type === "calendar_invitation_accepted" && (
                  <p className="mb-0">
                    <i className="bi bi-check-circle-fill text-success me-2" style={{ verticalAlign: "middle" }}></i>

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
                )}

                {/* Invitation refusée */}
                {notif.notification_type === "calendar_invitation_rejected" && (
                  <p className="mb-0">
                    <i className="bi bi-x-circle-fill text-danger me-2" style={{ verticalAlign: "middle" }}></i>

                    <HoveredUserProfile
                      user={{
                        photo_url: notif.sender_photo_url,
                        display_name: notif.sender_name,
                        email: notif.sender_email
                      }}
                      trigger={<strong>{notif.sender_name}</strong>}
                    />
                    {" "}a refusé votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                  </p>
                )}

                {/* Calendrier partagé supprimé */}
                {notif.notification_type === "calendar_shared_deleted_by_owner" && (
                  <p className="mb-0">
                    <i className="bi bi-trash-fill me-2 text-danger" style={{ verticalAlign: "middle" }}></i>
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
                )}

                {notif.notification_type === "calendar_shared_deleted_by_receiver" && (
                  <p className="mb-0">
                    <i className="bi bi-trash-fill me-2 text-danger" style={{ verticalAlign: "middle" }}></i>

                    <HoveredUserProfile
                      user={{
                        photo_url: notif.sender_photo_url,
                        display_name: notif.sender_name,
                        email: notif.sender_email
                      }}
                      trigger={<strong>{notif.sender_name}</strong>}
                    />
                    {" "}a retiré le calendrier <strong>{notif.calendar_name}</strong>
                  </p>
                )}

                {/* Date */}
                <small className="text-muted d-block mt-2">
                  {new Date(notif.timestamp).toLocaleString("fr-FR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
