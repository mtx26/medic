import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getWeekDaysISOStrings, getMondayFromDate, formatToLocalISODate } from '../utils/dateUtils';
import PropTypes from 'prop-types';


export default function WeekCalendarSelector({ selectedDate, onWeekSelect }) {
  
  const monday = getMondayFromDate(selectedDate);
  const today = formatToLocalISODate(new Date());

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

            if (today === date_iso) {
              return 'bg-success text-white';
            }
            if (getWeekDaysISOStrings(monday).includes(date_iso)) {
              return 'bg-primary text-white';
            }
          }
          return null;
        }}
      />
    </div>
  );
}

WeekCalendarSelector.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  onWeekSelect: PropTypes.func.isRequired,
};
