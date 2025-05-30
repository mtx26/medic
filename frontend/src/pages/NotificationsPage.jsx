import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationLine from "../components/notificationLine";

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

export default NotificationsPage;
