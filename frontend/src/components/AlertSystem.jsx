import React, { useEffect, useState } from 'react';

function AlertSystem({ type = "info", message, onClose, onConfirm = null, duration = 3000 }) {
  const isConfirm = type.startsWith("confirm");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true); // déclenche l'animation d'apparition

    if (!isConfirm) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, isConfirm, onClose]);

  if (!message) return null;

  const bootstrapType = type === "confirm-danger" ? "danger" : type === "confirm-safe" ? "success" : type;

  return (
    <div className={`alert-wrapper ${visible ? 'show' : ''}`}>
      <div
        className={`alert alert-${bootstrapType} ${!isConfirm ? 'alert-dismissible' : ''} no-dismiss-padding`}
        role="alert"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
          <div className="flex-fill">{message}</div>

          {isConfirm ? (
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center justify-content-sm-end">
              <button
                className={`btn btn-sm btn-${bootstrapType}`}
                onClick={() => {
                  onConfirm?.();
                  setVisible(false);
                  setTimeout(onClose, 400);
                }}
              >
                Oui
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setVisible(false);
                  setTimeout(onClose, 400);
                }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setVisible(false);
                setTimeout(onClose, 400);
              }}
            ></button>
          )}
        </div>
      </div>

    </div>
  );
}

export default AlertSystem;
