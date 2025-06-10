import React, { useState, useEffect } from 'react';
import Security from './settings/Security';
import Notification from './settings/Notification';
import Account from './settings/Account';
import { Link, useLocation } from 'react-router-dom';
import { handleLogout } from '../services/authService';

const SettingsPage = ({ sharedProps }) => {
  const location = useLocation();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'account';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    // Met à jour le tab si l’URL change
    setActiveTab(getInitialTab());
  }, [location.search]);

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
                <Link
                  className={`nav-link text-start ${activeTab === 'account' ? 'active' : ''}`}
                  to="/settings?tab=account"
                >
                  <i className="bi bi-person me-2"></i> Mon compte
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'security' ? 'active' : ''}`}
                  to="/settings?tab=security"
                >
                  <i className="bi bi-shield-lock me-2"></i> Sécurité
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'notifications' ? 'active' : ''}`}
                  to="/settings?tab=notifications"
                >
                  <i className="bi bi-bell me-2"></i> Notifications
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'preferences' ? 'active' : ''}`}
                  to="/settings?tab=preferences"
                >
                  <i className="bi bi-sliders me-2"></i> Préférences
                </Link>
                <hr />
                <button
                  aria-label="Déconnexion"
                  title="Déconnexion"
                  onClick={handleLogout}
                  className='btn btn-outline-primary text-start nav-link text-start'
                >
                  <i className="bi bi-unlock fs-5 me-2"></i> Déconnexion
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
