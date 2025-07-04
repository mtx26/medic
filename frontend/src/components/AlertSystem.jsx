import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function AlertSystem({
  type = 'info',
  message,
  onClose,
  onConfirm = null,
  duration = 2000,
}) {
  const { t } = useTranslation();
  const isConfirm = type.startsWith('confirm');
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

  let bootstrapType;

  if (type === 'confirm-danger') {
    bootstrapType = 'danger';
  } else if (type === 'confirm-safe') {
    bootstrapType = 'success';
  } else {
    bootstrapType = type;
  }

  return (
    <div className={`alert-wrapper ${visible ? 'show' : ''}`}>
      <div
        className={`alert alert-${bootstrapType} ${!isConfirm ? 'alert-dismissible' : ''} no-dismiss-padding`}
        role="alert"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
          <div className="flex-fill">{t(message)}</div>

          {isConfirm ? (
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center justify-content-sm-end">
              <button
                className={`btn btn-sm btn-${bootstrapType}`}
                aria-label={t('yes')}
                title={t('yes')}
                onClick={() => {
                  onConfirm?.();
                  setVisible(false);
                  setTimeout(onClose, 400);
                }}
              >
                {t('yes')}
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                aria-label={t('cancel')}
                title={t('cancel')}
                onClick={() => {
                  setVisible(false);
                  setTimeout(onClose, 400);
                }}
              >
                {t('cancel')}
              </button>
            </div>
          ) : (
            <button
              className="btn-close"
              aria-label={t('close')}
              title={t('close')}
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

AlertSystem.propTypes = {
  type: PropTypes.oneOf([
    'info',
    'success',
    'warning',
    'danger',
    'confirm-safe',
    'confirm-danger',
  ]),
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  duration: PropTypes.number,
};

export default AlertSystem;
