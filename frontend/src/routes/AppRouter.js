import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CalendarView from '../pages/CalendarView';
import MedicamentsPage from './../pages/MedicamentsPage';
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
      <Route path="/calendars" element={<CalendarList {...sharedProps}/>} />
      <Route path="/calendar/:nameCalendar" element={<CalendarView {...sharedProps} />} />
      <Route path="/medicaments" element={<MedicamentsPage {...sharedProps} />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/login" element={userInfo ? <Navigate to="/" /> : <Auth/>} />
      <Route path="/register" element={userInfo ? <Navigate to="/" /> : <Auth/>} />
      <Route path="/reset-password" element={userInfo ? <Navigate to="/" /> : <ResetPassword/>} />
    </Routes>
  );
}

export default AppRoutes;