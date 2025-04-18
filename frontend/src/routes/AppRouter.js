import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CalendarView from '../pages/CalendarView';
import CalendarMedicines from '../pages/CalendarMedicines';
import NotFound from './../pages/NotFound';
import Auth from "../pages/Auth";
import ResetPassword from "../pages/ResetPassword";
import CalendarList from '../pages/CalendarList';
// import Token from "../test/pages/Token";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

function AppRoutes({ sharedProps }) {

  const { userInfo } = useContext(UserContext);

  return (
    <Routes>
      <Route path="/calendars" element={userInfo ? <CalendarList {...sharedProps}/>: <Navigate to="/login" />} />
      <Route path="/calendars/:nameCalendar" element={userInfo ? <CalendarView {...sharedProps} />: <Navigate to="/login" />} />
      <Route path="/calendars/:nameCalendar/medicines" element={userInfo ? <CalendarMedicines {...sharedProps} />: <Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/login" element={userInfo ? <Navigate to="/calendars" /> : <Auth/>} />
      <Route path="/register" element={userInfo ? <Navigate to="/calendars" /> : <Auth/>} />
      <Route path="/reset-password" element={userInfo ? <Navigate to="/calendars" /> : <ResetPassword/>} />
      <Route path="/" element={<Navigate to="/calendars" />} />
    </Routes>
  );
}

export default AppRoutes;