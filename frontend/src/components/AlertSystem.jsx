import React, { useEffect } from 'react';

function AlertSystem({ type = "info", message, onClose, onConfirm = null, duration = 5000 }) {
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
    <div className={`alert alert-${bootstrapType} alert-dismissible fade show d-flex justify-content-between align-items-center`} role="alert">
      <div>{message}</div>

      {isConfirm ? (
        <div className="d-flex gap-2 ms-3">
          <button className={`btn btn-sm btn-${bootstrapType}`} onClick={() => { onConfirm?.(); onClose(); }}>
            Oui
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
        </div>
      ) : (
        <button type="button" className="btn-close" onClick={onClose}></button>
      )}
    </div>
  );
}

export default AlertSystem;
