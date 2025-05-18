import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getWeekDaysISOStrings, getMondayFromDate, formatToLocalISODate } from '../utils/dateUtils';

export default function WeekCalendarSelector({ selectedDate, onWeekSelect }) {
  
  const monday = getMondayFromDate(selectedDate);

  // Fonction appelée au clic
  const handleChange = (date) => {
    onWeekSelect(date);
  };

  return (
    <div className="card shadow-sm p-3 mb-4">
      <h5 className="mb-3"><i className="bi bi-calendar-week"></i> Semaine de référence</h5>
      <Calendar
        onClickDay={handleChange}
        value={new Date(selectedDate)}
        locale="fr-FR"
        tileClassName={({ date, view }) => {
          if (view === 'month') {
            const date_iso = formatToLocalISODate(date);
            const today_monday = getMondayFromDate(formatToLocalISODate(new Date()));

            if (getWeekDaysISOStrings(monday).includes(date_iso)) {

              if (getWeekDaysISOStrings(today_monday).includes(date_iso)) {
                return 'border border-warning border-2 bg-primary text-white';
              }
              return 'text-white bg-primary';
            }
            if (getWeekDaysISOStrings(today_monday).includes(date_iso)) {
              return 'border border-warning border-2 highlight-week-today';
            }
          }
          return null;
        }}
      />
    </div>
  );
}
