import React from "react";
import HoveredUserProfile from "../components/HoveredUserProfile";
import { useNavigate } from "react-router-dom";

function NotificationsPage({ notifications, sharedUserCalendars }) {
  const navigate = useNavigate();

  if (notifications.notificationsData === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des notifications...</span>
        </div>
      </div>
    );
  }
  

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
            <NotificationLine
              key={notif.notification_id}
              notif={notif}
              onRead={notifications.readNotification}
              onAccept={sharedUserCalendars.acceptInvitation}
              onReject={sharedUserCalendars.rejectInvitation}
              navigate={navigate}
            />
          ))}
        </ul>
      )}
    </div>
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


export default NotificationsPage;
