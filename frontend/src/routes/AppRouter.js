import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CalendarPage from './../pages/CalendarPage';
import MedicamentsPage from './../pages/MedicamentsPage';
import NotFound from './../pages/NotFound';

function AppRoutes({ sharedProps }) {
  return (
    <Routes>
      <Route path="/" element={<CalendarPage {...sharedProps} />} />
      <Route path="/medicaments" element={<MedicamentsPage {...sharedProps} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;