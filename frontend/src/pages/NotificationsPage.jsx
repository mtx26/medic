import React from "react";

function NotificationsPage({ notifications, invitations }) {

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
          {notifications.notificationsData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((notif) => (
              <li
                key={notif.notification_token}
								className={`list-group-item list-group-item-action border-0 border-start border-4 ${notif.read ? "bg-light text-muted" : "bg-unread border-primary p-2 rounded"}`}
                onClick={() => {
                  if (!notif.read) notifications.readNotification(notif.notification_token);
                }}
                style={{ cursor: "pointer" }}
                title={!notif.read ? "Marquer comme lue" : ""}
              >
                {/* Invitation reçue */}
                {notif.type === "calendar_invitation" && (
                  <>
                    {!notif.read ? (
                      <>
                        <div>
                          <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                          <strong>{notif.sender_email}</strong> vous invite à rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                        </div>
                        <div className="mt-2">
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={() => invitations.acceptInvitation(notif.notification_token)}
                          >
                            <i className="bi bi-check-circle-fill me-2 text-success"></i> Accepter
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => invitations.rejectInvitation(notif.notification_token)}
                          >
                            <i className="bi bi-x-circle-fill me-2 text-danger"></i> Rejeter
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                        Vous avez rejoint le calendrier <strong>{notif.calendar_name}</strong> de <strong>{notif.sender_email}</strong>
                      </div>
                    )}
                  </>
                )}

                {/* Invitation acceptée */}
                {notif.type === "calendar_invitation_accepted" && (
                  <div>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    <strong>{notif.receiver_email}</strong> a accepté votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                  </div>
                )}

                {/* Invitation refusée */}
                {notif.type === "calendar_invitation_rejected" && (
                  <div>
                    <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                    <strong>{notif.receiver_email}</strong> a refusé votre invitation pour rejoindre le calendrier <strong>{notif.calendar_name}</strong>
                  </div>
                )}

                {/* Calendrier partagé supprimé */}
                {notif.type === "calendar_shared_deleted_by_owner" && (
                  <div>
                    <i className="bi bi-trash-fill me-2 text-danger"></i>
                    <strong>{notif.owner_email}</strong> a arrêté de partager le calendrier <strong>{notif.calendar_name}</strong> avec vous
                  </div>
                )}

                {notif.type === "calendar_shared_deleted_by_receiver" && (
                  <div >
                    <i className="bi bi-trash-fill me-2 text-danger"></i>
                    <strong>{notif.receiver_email}</strong> a retiré le calendrier <strong>{notif.calendar_name}</strong> que vous lui aviez partagé.
                  </div>
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
