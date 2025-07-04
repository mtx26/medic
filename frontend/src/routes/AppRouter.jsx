import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { UserContext } from '../contexts/UserContext';

import HomePage from '../pages/HomePage';

import Auth from '../pages/Auth';
import ResetPassword from '../pages/ResetPassword';
import ResetPasswordConfirm from '../pages/ResetPasswordConfirm';
import VerifyEmail from '../pages/VerifyEmail';

import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

import CalendarView from '../pages/CalendarView';
import PillboxPage from '../pages/pillbox';
import CalendarList from '../pages/CalendarList';
import SharedList from '../pages/SharedList';

import MedicinesList from '../pages/MedicinesList';
import BoxesView from '../pages/BoxesView';
import NotFound from '../pages/NotFound';

import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';

import AuthCallback from '../pages/AuthCallback';

function PrivateRoute({ element }) {
  const { userInfo } = useContext(UserContext);

  if (!userInfo) {
    return <Navigate to="/" />;
  }
  if (!userInfo.emailVerified) {
    return <Navigate to="/verify-email" />;
  }
  return element;
}

function RouteWithLoader({ element, isLoading }) {
  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ flexGrow: 1, minHeight: '60vh' }}
      >
        <span className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </span>
      </div>
    );
  }
  return element;
}

function AppRoutes({ sharedProps }) {
  const { userInfo } = useContext(UserContext);

  return (
    <Routes>
      <Route
        path="/login"
        element={userInfo ? <Navigate to="/calendars" /> : <Auth />}
      />
      <Route
        path="/register"
        element={userInfo ? <Navigate to="/calendars" /> : <Auth />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="/reset-password-confirm"
        element={<ResetPasswordConfirm />}
      />
      <Route
        path="/verify-email"
        element={userInfo ? <VerifyEmail /> : <Navigate to="/login" />}
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<SettingsPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<NotificationsPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />

      <Route
        path="/shared-calendars"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<SharedList {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />

      <Route
        path="/calendar/:calendarId/boxes"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<BoxesView {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/calendar/:calendarId"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<CalendarView {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/calendar/:calendarId/pillbox"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<PillboxPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/calendars"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<CalendarList {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/shared-user-calendar/:calendarId/boxes"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<BoxesView {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/shared-user-calendar/:calendarId"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<CalendarView {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/shared-user-calendar/:calendarId/pillbox"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<PillboxPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />

      <Route
        path="/shared-token-calendar/:sharedToken/boxes"
        element={<MedicinesList {...sharedProps} />}
      />
      <Route
        path="/shared-token-calendar/:sharedToken"
        element={<CalendarView {...sharedProps} />}
      />
      <Route
        path="/shared-token-calendar/:sharedToken/pillbox"
        element={<PillboxPage {...sharedProps} />}
      />

      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />

      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

export default AppRoutes;
