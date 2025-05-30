import HoveredUserProfile from "./HoveredUserProfile";

export default function NotificationLine({ notif, onRead, onAccept, onReject, navigate }) {
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
                aria-label="Accepter"
                title="Accepter"
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
                aria-label="Rejeter"
                title="Rejeter"
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
      >
        <div 
          onClick={() => isUnread && onRead(notif.notification_id)}
          style={{ cursor: isUnread ? "pointer" : "default" }}
          tabIndex={0}  
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              isUnread && onRead(notif.notification_id);
            }
          }}
        >
          <p className="mb-0">
            {icon}
            {message}
          </p>
          {actions}
          <small className="text-muted d-block mt-2">{timestamp}</small>
        </div>
      </li>
    );
  }