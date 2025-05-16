import React from "react";
import ArrowControls from "./ArrowControls";
import WeekDayCircles from "./WeekDayCircles";

function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getWeekDays
}) {
  return (
    <>
      <ArrowControls onLeft={onPrev} onRight={onNext} />

      <WeekDayCircles
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        getWeekDays={getWeekDays}
      />

      {!ifModal && (
        <div className="text-center mb-4">
            <h6 className="mb-0">
                <i className="bi bi-calendar-date me-2"></i>
            {new Date(selectedDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            })}
            </h6>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={onPrev}>
          <i className="bi bi-arrow-left"></i>
        </button>

        <div className="flex-grow-1 mx-2">
          {eventsForDay.length > 0 ? (
            <ul className="list-group">
              {eventsForDay.map((event, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {`${event.title} (${event.dose})`}
                  <span
                    className="badge"
                    style={{ backgroundColor: event.color, color: "white" }}
                  >
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-center mb-0">
              Aucun événement ce jour-là.
            </p>
          )}
        </div>

        <button className="btn btn-outline-secondary btn-sm" onClick={onNext}>
          <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </>
  );
}

export default WeeklyEventContent;
