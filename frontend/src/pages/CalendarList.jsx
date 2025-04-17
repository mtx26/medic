import React, { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/LoginContext";

function SelectCalendar({ calendars, fetchCalendars, addCalendar, deleteCalendar, RenameCalendar, getMedicineCount,  }) {

    const navigate = useNavigate();
    const { authReady, login } = useContext(AuthContext);
    const [newCalendarName, setNewCalendarName] = useState('');
    const [renameValues, setRenameValues] = useState({});
    const [count, setCount] = useState({});

    useEffect(() => {
      if (authReady && login) {
        fetchCalendars();
      }
    }, [authReady, login]);
    
    useEffect(() => {
      if (authReady && login && calendars.length > 0) {
        const loadCounts = async () => {
          const counts = {};
          for (const calendarName of calendars) {
            const c = await getMedicineCount(calendarName);
            counts[calendarName] = c;
          }
          setCount(counts);
        };
        loadCounts();
      }
    }, [calendars]);
    

  return (
<div className="container d-flex justify-content-center">
  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '700px' }}>
    <h5 className="mb-3">Choisir un calendrier</h5>

    <div className="input-group mb-4">
      <input
        type="text"
        className="form-control"
        placeholder="Nom du calendrier"
        onChange={(e) => setNewCalendarName(e.target.value)}
      />
      <button
        onClick={() => addCalendar(newCalendarName)}
        className="btn btn-outline-primary"
      >
        ➕ Ajouter
      </button>
    </div>

    <div className="list-group">
      {calendars.map((calendarName, index) => (
        <div
          key={index}
          className="list-group-item"
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            {/* Partie gauche */}
            <div className="flex-grow-1">
              <strong>{calendarName}</strong>
              <div className="text-muted small">
                Nombre de médicaments :
                <span className="fw-semibold ms-1">
                  {count[calendarName] ?? "Chargement..."}
                </span>
              </div>
            </div>

            {/* Renommage */}
            <div className="input-group input-group w-100 w-md-auto">
              <input
                type="text"
                className="form-control form-control"
                placeholder="Nouveau nom"
                value={renameValues[calendarName] || ""}
                onChange={(e) =>
                  setRenameValues({ ...renameValues, [calendarName]: e.target.value })
                }
              />
              <button
                className="btn btn-outline-warning"
                title="Renommer"
                onClick={() => {
                  RenameCalendar(calendarName, renameValues[calendarName]);
                  setRenameValues({ ...renameValues, [calendarName]: "" });
                }}
              >
                ✏️
              </button>
            </div>

            {/* Actions */}
            <div className="btn-group btn-group">
              <button
                type="button"
                className="btn btn-outline-success"
                title="Ouvrir"
                onClick={() => navigate('/calendar/' + calendarName)}
              >
                Ouvrir
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                title="Supprimer"
                onClick={() => deleteCalendar(calendarName)}
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

  );
}

export default SelectCalendar;
