import HoveredUserProfile from './HoveredUserProfile';
import { useTranslation, Trans } from 'react-i18next';

export default function NotificationLine({
  notif,
  onRead,
  onAccept,
  onReject,
  navigate,
}) {
  const { t } = useTranslation();
  const isUnread = !notif.read;
  const timestamp = new Date(notif.timestamp).toLocaleString(t('locale'), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

  const iconStyle = { verticalAlign: 'middle' };

  let icon = null;
  let message = null;
  let link = null;
  let actions = null;

  switch (notif.notification_type) {
    case 'calendar_invitation':
      icon = (
        <i className="bi bi-person-plus-fill text-primary me-2" style={iconStyle}></i>
      );
      if (!notif.accepted) {
        message = (
          <Trans
            i18nKey="notif.calendar_invite"
            values={{ name: notif.calendar_name }}
            components={[user, <strong />]}
          />
        );
        actions = (
          <div className="mt-2">
            <button
              aria-label={t('accept')}
              title={t('accept')}
              className="btn btn-sm btn-outline-success me-2"
              onClick={async (e) => {
                e.stopPropagation();
                await onAccept(notif.notification_id);
                navigate(`/shared-user-calendar/${notif.calendar_id}`);
              }}
            >
              <i className="bi bi-check-circle-fill me-2 text-success"></i> {t('accept')}
            </button>
            <button
              aria-label={t('reject')}
              title={t('reject')}
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                onReject(notif.notification_id);
              }}
            >
              <i className="bi bi-x-circle-fill me-2 text-danger"></i> {t('reject')}
            </button>
          </div>
        );
      } else {
        message = (
          <Trans
            i18nKey="notif.calendar_joined"
            values={{ name: notif.calendar_name }}
            components={[user, <strong />]}
          />
        );
      }
      break;

    case 'calendar_invitation_accepted':
      icon = (
        <i className="bi bi-check-circle-fill text-success me-2" style={iconStyle}></i>
      );
      message = (
        <Trans
          i18nKey="notif.invite_accepted"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_invitation_rejected':
      icon = (
        <i className="bi bi-x-circle-fill text-danger me-2" style={iconStyle}></i>
      );
      message = (
        <Trans
          i18nKey="notif.invite_rejected"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_shared_deleted_by_owner':
      icon = (
        <i className="bi bi-trash-fill text-danger me-2" style={iconStyle}></i>
      );
      message = (
        <Trans
          i18nKey="notif.share_removed_by_owner"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_shared_deleted_by_receiver':
      icon = (
        <i className="bi bi-trash-fill text-danger me-2" style={iconStyle}></i>
      );
      message = (
        <Trans
          i18nKey="notif.share_removed_by_you"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'low_stock':
      icon = (
        <i className="bi bi-exclamation-triangle-fill text-warning me-2" style={iconStyle}></i>
      );
      message = (
        <Trans
          i18nKey="notif.low_stock"
          values={{
            name: notif.medication_name,
            qty: notif.medication_qty,
          }}
          components={[<strong />]}
        />
      );
      link = notif.link;
      break;

    default:
      return null;
  }

  return (
    <li
      className={`list-group-item list-group-item-action border-0 border-start border-4 ${
        isUnread
          ? 'bg-unread border-primary p-2 rounded'
          : 'bg-light text-muted'
      }`}
    >
      <div
        onClick={() => {
          isUnread && onRead(notif.notification_id);
          link && navigate(link);
        }}
        style={{ cursor: isUnread || link ? 'pointer' : 'default' }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            isUnread && onRead(notif.notification_id);
            link && navigate(link);
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
