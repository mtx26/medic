import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationLine from '../components/NotificationLine';
import ActionSheet from '../components/ActionSheet';

function NotificationsPage({ notifications, sharedUserCalendars }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (notifications.notificationsData === null) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">
            {t('loading_notifications')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">
          <i className="bi bi-bell-fill me-2"></i> {t('notifications')}
        </h4>
        <ActionSheet
          actions={[
            {
              label: (
                <>
                  <i className="bi bi-gear-fill me-2"></i> {t('settings')}
                </>
              ),
              onClick: () => navigate('/settings?tab=notifications'),
            },
          ]}
        />
      </div>

      {notifications.notificationsData.length === 0 ? (
        <div className="alert alert-info text-center">
          {t('no_notifications')}
        </div>
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
