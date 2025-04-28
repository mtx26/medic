import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { UserContext } from '../contexts/UserContext';
import { log } from '../utils/logger';

import CalendarView from '../pages/CalendarView';
import CalendarMedicines from '../pages/CalendarMedicines';
import CalendarList from '../pages/CalendarList';
import SharedCalendar from '../pages/SharedCalendarView';
import SharedCalendarMedicines from '../pages/SharedCalendarMedicines';
import TokensList from '../pages/TokensList';
import AccountPage from '../pages/AccountPage';
import Auth from '../pages/Auth';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
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
      <Route path="/calendars" element={<PrivateRoute element={<CalendarList {...sharedProps}/>} />} />
      <Route path="/calendars/:nameCalendar" element={<PrivateRoute element={<CalendarView {...sharedProps} />} />} />
      <Route path="/calendars/:nameCalendar/medicines" element={<PrivateRoute element={<CalendarMedicines {...sharedProps} />} />} />
      <Route path="/shared-calendar/:sharedTokens" element={<SharedCalendar {...sharedProps} />} />
      <Route path="/shared-calendar/:sharedTokens/medicines" element={<SharedCalendarMedicines {...sharedProps} />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/login" element={userInfo ? <Navigate to="/calendars" /> : <Auth/>} />
      <Route path="/register" element={userInfo ? <Navigate to="/calendars" /> : <Auth/>} />
      <Route path="/reset-password" element={userInfo ? <Navigate to="/calendars" /> : <ResetPassword/>} />
      <Route path="/" element={<Navigate to="/calendars" />} />
      <Route path="/shared-calendar" element={userInfo ? <TokensList {...sharedProps} /> : <Navigate to="/login" />} />
      <Route path="/account" element={userInfo ? <AccountPage {...sharedProps} /> : <Navigate to="/login" />} />
      <Route path="/verify-email" element={userInfo ? <VerifyEmail/> : <Navigate to="/login"/>} />
    </Routes>
  );
}

export default AppRoutes;