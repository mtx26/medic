import { forwardRef, useImperativeHandle, useState } from "react";
import ReactDOM from "react-dom";
import WeeklyEventContent from "./WeeklyEventContent";
import PropTypes from 'prop-types';

const DateModal = forwardRef(({ selectedDate, eventsForDay, onNext, onPrev, onSelectDate }, ref) => {
  const [visible, setVisible] = useState(false);

  // 🔁 expose open() et close() vers le parent
  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  if (!visible) return null;

  return ReactDOM.createPortal(
    <>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-calendar-date"></i> {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </h5>
              <button
                className="btn-close"
                onClick={() => setVisible(false)}
              ></button>
            </div>
            <div className="modal-body">
              <WeeklyEventContent
                ifModal={true}
                selectedDate={selectedDate}
                eventsForDay={eventsForDay}
                onSelectDate={onSelectDate}
                onNext={onNext}
                onPrev={onPrev}
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setVisible(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>,
    document.getElementById("modal-container")
  );
});

export default DateModal;

DateModal.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSelectDate: PropTypes.func.isRequired,
};
