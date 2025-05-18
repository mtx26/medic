import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function WeekCalendarSelector({ selectedDate, onWeekSelect }) {
  // Calcule le lundi de la semaine
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 1
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  function getWeekDays(monday) {
    return [...Array(7)].map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toDateString();
    });
  }

  // Fonction appelée au clic
  const handleChange = (date) => {
    const monday = getMonday(date);
    onWeekSelect(monday);
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
            const monday = getMonday(selectedDate);
            const today_monday = getMonday(new Date());
            if (getWeekDays(monday).includes(date.toDateString())) {
              if (getWeekDays(today_monday).includes(date.toDateString())) {
                return 'border border-success border-2 bg-primary text-white';
              }
              return 'text-white bg-primary';
            }
            if (getWeekDays(today_monday).includes(date.toDateString())) {
              return 'border border-success border-2 highlight-week-today ';
            }
          }
          return null;
        }}
      />
    </div>
  );
}
