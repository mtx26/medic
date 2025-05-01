import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { UserContext } from '../contexts/UserContext';

import CalendarView from '../pages/CalendarView';
import CalendarMedicines from '../pages/CalendarMedicines';
import CalendarList from '../pages/CalendarList';
import SharedCalendar from '../pages/SharedCalendarView';
import SharedCalendarMedicines from '../pages/SharedCalendarMedicines';
import SharedList from '../pages/SharedList';
import AccountPage from '../pages/AccountPage';
import Auth from '../pages/Auth';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import NotFound from '../pages/NotFound';
import NotificationsPage from '../pages/NotificationsPage';

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
      <Route path="/verify-email" element={userInfo ? <VerifyEmail /> : <Navigate to="/login" />} />

      <Route path="/account" element={<PrivateRoute element={<AccountPage {...sharedProps} />} />} />
      <Route path="/notifications" element={<PrivateRoute element={<NotificationsPage {...sharedProps} />} />} />

      <Route path="/calendars/:nameCalendar/medicines" element={<PrivateRoute element={<CalendarMedicines {...sharedProps} />} />} />
      <Route path="/calendars/:nameCalendar" element={<PrivateRoute element={<CalendarView {...sharedProps} />} />} />
      <Route path="/calendars" element={<PrivateRoute element={<CalendarList {...sharedProps} />} />} />

      <Route path="/shared-calendar/:sharedTokens/medicines" element={<SharedCalendarMedicines {...sharedProps} />} />
      <Route path="/shared-calendar/:sharedTokens" element={<SharedCalendar {...sharedProps} />} />
      <Route path="/shared-calendar" element={<PrivateRoute element={<SharedList {...sharedProps} />} />} />

      <Route path="/" element={<Navigate to="/calendars" />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

export default AppRoutes;