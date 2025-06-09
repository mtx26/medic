import React from 'react';
import ArrowControls from './ArrowControls';
import WeekDayCircles from './WeekDayCircles';
import { getMondayFromDate, getWeekDaysISOStrings } from '../utils/dateUtils';
import PropTypes from 'prop-types';

export default function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
}) {
  const monday = getMondayFromDate(selectedDate);
  const weekDays = getWeekDaysISOStrings(monday);
  const isFirstDay = weekDays[0] === selectedDate;
  const isLastDay = weekDays[6] === selectedDate;

  return (
    <>
      <ArrowControls
        onLeft={isFirstDay ? () => {} : onPrev}
        onRight={isLastDay ? () => {} : onNext}
      />

      <WeekDayCircles selectedDate={selectedDate} onSelectDate={onSelectDate} />

      {!ifModal && (
        <div className="text-center mb-4">
          <h6 className="mb-0">
            <i className="bi bi-calendar-date me-2"></i>
            {new Date(selectedDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h6>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={onPrev}
          disabled={isFirstDay}
          aria-label="Semaine précédente"
          title="Semaine précédente"
        >
          <i className="bi bi-arrow-left"></i>
        </button>

        <div className="flex-grow-1 mx-2">
          {eventsForDay.length > 0 ? (
            <ul className="list-group">
              {eventsForDay.map((event, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex align-items-center justify-content-between"
                >
                  {event.title} {event.dose != null ? `${event.dose} mg` : ''}
                  <div className="d-flex align-items-center">
                    <span className="badge me-2 badge bg-secondary">
                      {event.tablet_count}
                    </span>
                    <span
                      className="badge"
                      style={{ backgroundColor: event.color, color: 'white' }}
                    >
                      {new Date(event.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-center mb-0">
              Aucun événement ce jour-là.
            </p>
          )}
        </div>

        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={onNext}
          disabled={isLastDay}
          aria-label="Semaine suivante"
          title="Semaine suivante"
        >
          <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </>
  );
}

WeeklyEventContent.propTypes = {
  ifModal: PropTypes.bool.isRequired,
  selectedDate: PropTypes.string.isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
};
