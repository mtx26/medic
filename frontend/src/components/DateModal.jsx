import { forwardRef, useImperativeHandle, useState } from "react";
import ReactDOM from "react-dom";

const DateModal = forwardRef(({ selectedDate, events, onNext, onPrev }, ref) => {
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
                <i className="bi bi-calendar-date"></i>{' '}
                <span>{new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setVisible(false)}></button>
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center">
                <button className="btn btn-outline-secondary btn-sm" onClick={onPrev}>
                  <i className="bi bi-arrow-left"></i>
                </button>
                <div className="flex-grow-1 mx-3">
                  {events.length > 0 ? (
                    <ul className="list-group">
                      {events.map((event, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {`${event.title} (${event.dose})`}
                          <span className="badge" style={{ backgroundColor: event.color, color: 'white' }}>
                            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center mb-0">Aucun événement ce jour-là.</p>
                  )}
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onNext}>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setVisible(false)}>Fermer</button>
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
