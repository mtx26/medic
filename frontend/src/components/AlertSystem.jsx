import React, { useEffect } from 'react';

function AlertSystem({ type = "info", message, onClose, onConfirm = null, duration = 3000 }) {
  const isConfirm = type.startsWith("confirm");

  useEffect(() => {
    if (!message || isConfirm) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, isConfirm, onClose]);

  if (!message) return null;

  const bootstrapType = type === "confirm-danger" ? "danger"
                    : type === "confirm-safe" ? "success"
                    : type;

return (
  <div
    className={`alert alert-${bootstrapType} alert-dismissible fade show d-flex flex-column flex-sm-row justify-content-between align-items-center text-center text-sm-start`}
    role="alert"
  >
    <div className="w-100">{message}</div>

    {isConfirm ? (
      <div className="d-flex gap-2 mt-2 mt-sm-0 ms-sm-3 justify-content-center">
        <button
          className={`btn btn-sm btn-${bootstrapType}`}
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
        >
          Oui
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          Annuler
        </button>
      </div>
    ) : (
      <button
        type="button"
        className="btn-close mt-2 mt-sm-0"
        onClick={onClose}
      ></button>
    )}
  </div>
);

}

export default AlertSystem;
