import React, { useContext } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';

const Notification = () => {
  const { userInfo } = useContext(UserContext);

  const reloadUser = getGlobalReloadUser();

  return (
    <div>
      <h2 className="mb-4">Notifications</h2>

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input fs-5"
          type="checkbox"
          id="emailNotificationToggle"
          checked={userInfo?.emailEnabled}
          onChange={() => {
            reloadUser(null, null, !userInfo?.emailEnabled, userInfo?.pushEnabled);
          }}
        />
        <label className="form-check-label" htmlFor="emailNotificationToggle">
          Activer les notifications par e-mail
        </label>
      </div>

      <div className="form-check form-switch mb-4">
        <input
          className="form-check-input fs-5"
          type="checkbox"
          id="pushNotificationToggle"
          checked={userInfo?.pushEnabled}
          onChange={() => {
            reloadUser(null, null, userInfo?.emailEnabled, !userInfo?.pushEnabled);
          }}
        />
        <label className="form-check-label" htmlFor="pushNotificationToggle">
          Activer les notifications par web push
        </label>
      </div>

    </div>
  );
};

export default Notification;
