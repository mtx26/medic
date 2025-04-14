// CalendarPage.jsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useEffect } from 'react';

function CalendarPage({
  rawEvents,
  calendarEvents,
  setCalendarEvents,
  setRawEvents,
  selectedDate,
  setSelectedDate,
  eventsForDay,
  setEventsForDay,
  startDate,
  setStartDate,
  modalRef,
  getCalendar
}) {
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(clickedDate)));
    new window.bootstrap.Modal(modalRef.current).show();
  };

  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = current.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(newDate)));
  };

  useEffect(() => {
    getCalendar();
  }, []);

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <label htmlFor="datePicker" className="form-label fw-semibold">📅 Date de début :</label>
            <div className="col-md-6">
              <input
                id="datePicker"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-auto">
              <button
                onClick={getCalendar}
                className="btn btn-primary w-100"
              >
                🔄 Charger le calendrier
              </button>
            </div>
          </div>
          <div className="alert alert-info mt-3 mb-0" role="alert">
            📌 Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.
          </div>
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        locale={frLocale}
        firstDay={1}
        dateClick={handleDateClick}
        height="auto"
      />

      <div className="modal fade" ref={modalRef} tabIndex="-1" id="dateModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                📅 {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigateDay(-1)}>⬅</button>
                <div className="flex-grow-1 mx-3">
                  {eventsForDay.length > 0 ? (
                    <ul className="list-group">
                      {eventsForDay.map((event, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {event.title}
                          <span className="badge" style={{ backgroundColor: event.color, color: 'white' }}>
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center mb-0">Aucun événement ce jour-là.</p>
                  )}
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigateDay(1)}>➡</button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;