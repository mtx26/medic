import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import AlertSystem from './AlertSystem';
import { set } from 'lodash';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pill_count = {
  0.25: '0.25',
  0.5: '0.50',
  0.75: '0.75',
  1: '1.00',
};

export default function PillboxDisplay({
  type,
  selectedDate,
  calendarType,
  calendarId,
  basePath,
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const [calendarTable, setCalendarTable] = useState([]);
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState([]);
  const [loading, setLoading] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  const handleNextMed = () => {
    setSelectedMedIndex((prev) => (prev + 1 < orderedMeds.length ? prev + 1 : prev));
  };

  const handlePreviousMed = () => {
    setSelectedMedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(undefined);
      const rep = await calendarSource.fetchSchedule(calendarId, selectedDate);
      if (rep.success && !isEqual(rep.table, calendarTable)) {
        setCalendarTable(rep.table);
      }
      setLoading(rep.success);
    };

    if (!calendarId) return;
    if ((calendarType === 'sharedUser' || calendarType === 'personal') && !userInfo) return;

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo, selectedDate]);

  useEffect(() => {
    const time_order = ['morning', 'noon', 'evening'];
    const allMeds = time_order.flatMap((moment) => {
      const meds = calendarTable[moment] || [];
      return meds
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((med) => ({ ...med, moment }));
    });
    setOrderedMeds(allMeds);
    setSelectedMedIndex(0);
  }, [calendarTable]);

  if (loading === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_calendar')}</span>
        </div>
      </div>
    );
  }

  if (loading === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <div className="position-relative">
      {showConfirmation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
        >
          <AlertSystem
            message={message}
            type={alertType}
            onClose={() => {
              setMessage('');
              setAlertType('');
              setShowConfirmation(false);
            }}
            onConfirm={() => {
              if (type === 'calendar') {
                setSuccessMessage(true);
              } else {
                navigate(`/${basePath}/${calendarId}`);
              }
              setShowConfirmation(false);
            }}
          />
        </div>
      )}

      <div className="container-fluid text-center w-100 mt-3">
        {successMessage ? (
          <div className="alert alert-success mt-4" role="alert">
            ✅ {t('calendar_completed')}
          </div>
        ) : (
          <>
            {orderedMeds.length > 0 && (
              <>
                <div 
                  className={
                    `rounded-top px-3 py-2 ${
                    orderedMeds[selectedMedIndex].moment === 'morning' ? 'bg-danger text-white' :
                    orderedMeds[selectedMedIndex].moment === 'noon' ? 'bg-success text-white' :
                    orderedMeds[selectedMedIndex].moment === 'evening' ? 'bg-info text-white' :
                    'bg-white text-primary'}`
                  }
                >
                  <h4 className="mb-0"><strong>{t(orderedMeds[selectedMedIndex].moment)}</strong></h4>
                </div>
                <div className="bg-primary text-white px-3 py-3 rounded-bottom mb-4">
                  <h4 className="mb-0"><strong>{orderedMeds[selectedMedIndex].title}</strong></h4>
                </div>
                <div className="row row-cols-7 g-3 align-items-stretch text-center">
                  {days.map((day) => (
                    <div key={day} className="col">
                      <div className="d-flex flex-column h-100">
                        <h6 className="mb-2">{t(day)}</h6>
                        <div className="border rounded bg-light p-2 flex-grow-1 d-flex align-items-center justify-content-center">
                          {orderedMeds[selectedMedIndex].cells[day] !== undefined && (
                            <div className="w-100 ratio ratio-1x1">
                              <img
                                src={`/icons/pills/${pill_count[orderedMeds[selectedMedIndex].cells[day]]}_pills.svg`}
                                alt="Pills"
                                className="img-fluid object-fit-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-3 justify-content-between text-center">
                  <button className="btn btn-outline-primary mt-4" onClick={handlePreviousMed} disabled={selectedMedIndex === 0}>
                    <i className="bi bi-arrow-left"></i> {t('previous')}
                  </button>
                  {selectedMedIndex < orderedMeds.length - 1 ? (
                    (() => {
                      const currentMoment = orderedMeds[selectedMedIndex].moment;
                      const nextMoment = orderedMeds[selectedMedIndex + 1].moment;

                      if (currentMoment === nextMoment) {
                        return (
                          <button className="btn btn-outline-primary mt-4" onClick={handleNextMed}>
                            {t('next')} <i className="bi bi-arrow-right"></i>
                          </button>
                        );
                      } else {
                        return (
                          <button
                            className={`btn ${
                              nextMoment === 'morning' ? 'btn-danger text-white' :
                              nextMoment === 'noon' ? 'btn-success text-white' :
                              nextMoment === 'evening' ? 'btn-info text-white' :
                              'btn-primary text-white'
                            } mt-4`} onClick={handleNextMed}>
                            {t(nextMoment)} <i className="bi bi-arrow-right"></i>
                          </button>
                        );
                      }
                    })()
                  ) : (
                    <button
                      className="btn btn-success mt-4"
                      onClick={() => {
                        setMessage(t('confirm_calendar_completion'));
                        setAlertType('confirm-safe');
                        setShowConfirmation(true);
                      }}
                    >
                      <i className="bi bi-check-circle"></i> {t('done')}
                    </button>
                  )}
                </div>
              </>
            )}
            {orderedMeds.length === 0 && <p className="mt-5">{t('no_medicines')}</p>}
          </>
        )}
      </div>
    </div>
  );
}
