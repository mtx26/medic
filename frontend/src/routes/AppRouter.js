import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { UserContext } from '../contexts/UserContext';

import Auth from '../pages/Auth';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';

import AccountPage from '../pages/AccountPage';
import NotificationsPage from '../pages/NotificationsPage';

import MedicinesView from '../pages/MedicinesView';
import CalendarView from '../pages/CalendarView';
import CalendarList from '../pages/CalendarList';
import SharedList from '../pages/SharedList';

import MedicinesList from '../pages/MedecinesList';

import NotFound from '../pages/NotFound';

function PrivateRoute({ element }) {
  const { userInfo } = useContext(UserContext);

  if (!userInfo) {
    return <Navigate to="/login" />;
  }
  if (!userInfo.emailVerified) {
    return <Navigate to="/verify-email" />;
  }
  return element;
}

function AppRoutes({ sharedProps }) {
  const { userInfo } = useContext(UserContext);

  return (
    <Routes>
      <Route path="/login" element={userInfo ? <Navigate to="/calendars" /> : <Auth />} />
      <Route path="/register" element={userInfo ? <Navigate to="/calendars" /> : <Auth />} />
      <Route path="/reset-password" element={userInfo ? <Navigate to="/calendars" /> : <ResetPassword />} />
      <Route path="/verify-email" element={userInfo ? <VerifyEmail/> : <Navigate to="/login" />} />

      <Route path="/account" element={<PrivateRoute element={<AccountPage {...sharedProps} />} />} />
      <Route path="/notifications" element={<PrivateRoute element={<NotificationsPage {...sharedProps} />} />} />

      <Route path="/shared-calendar" element={<PrivateRoute element={<SharedList {...sharedProps} />} />} />

      <Route path="/calendars/:calendarId/medicines" element={<PrivateRoute element={<MedicinesView {...sharedProps} />} />} />
      <Route path="/calendars/:calendarId" element={<PrivateRoute element={<CalendarView {...sharedProps} />} />} />
      <Route path="/calendars" element={<PrivateRoute element={<CalendarList {...sharedProps} />} />} />
      
      <Route path="/shared-user-calendar/:calendarId/medicines" element={<PrivateRoute element={<MedicinesView {...sharedProps} />} />} />
      <Route path="/shared-user-calendar/:calendarId" element={<PrivateRoute element={<CalendarView {...sharedProps} />} />} />

      <Route path="/shared-token-calendar/:sharedToken/medicines" element={<MedicinesList {...sharedProps} />} />
      <Route path="/shared-token-calendar/:sharedToken" element={<CalendarView {...sharedProps} />} />

      <Route path="/" element={<Navigate to="/calendars" />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

export default AppRoutes;