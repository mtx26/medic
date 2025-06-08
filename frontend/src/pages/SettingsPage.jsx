import React, { useState } from 'react';
import Security from './settings/Security';
import Notification from './settings/Notification';
import Account from './settings/Account';
// import NotificationPage from './NotificationPage';
// import PreferencesPage from './PreferencesPage';

const SettingsPage = ({ sharedProps }) => {
  const [activeTab, setActiveTab] = useState('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <Account {...sharedProps} />;
      case 'security':
        return <Security {...sharedProps} />;
      case 'notifications':
        return <Notification {...sharedProps} />;
      default:
        return <Account {...sharedProps} />;
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* 🧭 Onglets verticaux Bootstrap */}
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm rounded">
            <div className="card-body p-3">
              <h5 className="mb-3">Paramètres</h5>
              <div className="nav flex-column nav-pills">
                <button
                  className={`nav-link text-start ${activeTab === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveTab('account')}
                >
                  <i className="bi bi-person me-2"></i> Mon compte
                </button>
                <button
                  className={`nav-link text-start ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <i className="bi bi-shield-lock me-2"></i> Sécurité
                </button>
                <button
                  className={`nav-link text-start ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="bi bi-bell me-2"></i> Notifications
                </button>
                <button
                  className={`nav-link text-start ${activeTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <i className="bi bi-sliders me-2"></i> Préférences
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 📄 Contenu de l'onglet actif */}
        <div className="col-md-9">
          <div className="card shadow-sm rounded p-4 bg-white">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
