import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

function Home() {
  // === États ===
  const [rawEvents, setRawEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsForDay, setEventsForDay] = useState([]);
  const [meds, setMeds] = useState([]);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const modalRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // === Récupération des médicaments ===
  useEffect(() => {
    fetch(`${API_URL}/get_pils`)
      .then((res) => res.json())
      .then((medications) => {
        setMeds(medications);
        console.log('Médicaments récupérés :', medications);
      })
      .catch((error) => console.error('Erreur lors du fetch :', error));
  }, []);

  // === Récupération du calendrier ===
  const getCalendar = () => {
    fetch(`${API_URL}/calendar?startTime=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        setRawEvents(data);
        setCalendarEvents(
          data.map((e) => ({
            title: e.title,
            start: e.date,
            color: e.color,
          }))
        );
      })
      .catch((error) => console.error('Erreur lors du fetch :', error));
  };

  // === Affichage des événements du jour ===
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(clickedDate)));
    new window.bootstrap.Modal(modalRef.current).show();
  };
  
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = current.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(newDate)));
  };
  

  // === Modification des médicaments ===
  const handleMedChange = (index, field, value) => {
    const updatedMeds = [...meds];
    if (field === 'time') {
      updatedMeds[index][field] = [value];
    } else if (field === 'tablet_count' || field === 'interval_days') {
      updatedMeds[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updatedMeds[index][field] = value;
    }
    setMeds(updatedMeds);
  };

  const handleSubmit = () => {
    fetch(`${API_URL}/update_pils`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meds),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Médicaments mis à jour :', data);
        setAlertMessage("✅ Médicaments modifiés avec succès.");
        setAlertType("success");
      })
      .catch((error) => console.error('Erreur lors de la mise à jour :', error));
  };

  // === Gestion des sélections et suppressions ===
  const toggleSelection = (index) => {
    setSelectedToDelete((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const deleteSelectedMeds = () => {
    setMeds(meds.filter((_, index) => !selectedToDelete.includes(index)));
    setSelectedToDelete([]);
  };

  const addMed = () => {
    setMeds([
      ...meds,
      {
        name: '',
        tablet_count: 1,
        time: [''],
        interval_days: 1,
        start_date: '',
      },
    ]);
  };

  // === Render ===
  return (
    <div className="container mt-4">
      {/* Titre centré */}
      <div className="text-center mb-4">
        <h1 className="fw-bold">🏠 Accueil</h1>
      </div>
    
      {/* Boîte d'actions avec alignement propre */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            {/* Sélecteur de date */}
            <label htmlFor="datePicker" className="form-label fw-semibold">📅 Date de début :</label>
            <div className="col-md-6">
              <input
                id="datePicker"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
    
            {/* Bouton "Charger le calendrier" */}
            <div className="col-md-auto">
              <button
                onClick={getCalendar}
                className="btn btn-primary w-100"
              >
                🔄 Charger le calendrier
              </button>
            </div>
          </div>
    
          {/* Message explicatif */}
          <div className="alert alert-info mt-3 mb-0" role="alert">
            📌 Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        locale={frLocale}
        firstDay={1}
        dateClick={handleDateClick}
        height="auto"
      />

      {/* Modale des événements */}
      <div className="modal fade" ref={modalRef} tabIndex="-1" id="dateModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">📅 {selectedDate}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {eventsForDay.length > 0 ? (
                <ul className="list-group">
                  {eventsForDay.map((event, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      {event.title}
                      <span className="badge" style={{ backgroundColor: event.color, color: 'white' }}>
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-center">Aucun événement ce jour-là.</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des médicaments */}
      <div className="mt-4">
        <h3>💊 Liste des médicaments</h3>

        {/* Boutons */}
        <div className="d-flex flex-wrap gap-2 my-3">
          <button onClick={addMed} className="btn btn-primary btn-sm">
            ➕ Ajouter un médicament
          </button>
          <button
            onClick={() => setConfirmDeleteVisible(true)}
            className="btn btn-danger btn-sm"
            disabled={selectedToDelete.length === 0}
          >
            🗑️ Supprimer sélectionnés
          </button>
          <button onClick={handleSubmit} className="btn btn-success btn-sm">
            💾 Modifier les médicaments
          </button>
        </div>

        {/* Confirmation de suppression */}
        {confirmDeleteVisible && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center mt-3" role="alert">
            ⚠️ Confirmez-vous la suppression des médicaments sélectionnés ?
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  deleteSelectedMeds();
                  setConfirmDeleteVisible(false);
                }}
              >
                Oui, supprimer
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setConfirmDeleteVisible(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Message d’alerte */}
        {alertMessage && (
          <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
            {alertMessage}
            <button type="button" className="btn-close" data-bs-dismiss="alert" onClick={() => setAlertMessage('')}></button>
          </div>
        )}

        {/* Champs des médicaments */}
        <ul className="list-group">
          {meds.map((med, index) => (
            <li key={index} className="list-group-item px-2 py-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* Checkbox */}
                <div className="form-check" style={{ width: '40px' }}>
                  <input
                    className="form-check-input mt-2"
                    type="checkbox"
                    checked={selectedToDelete.includes(index)}
                    onChange={() => toggleSelection(index)}
                    id={`check-${index}`}
                  />
                </div>

                {/* Inputs */}
                <div className="form-floating" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id={`name-${index}`}
                    placeholder="Nom"
                    value={med.name}
                    onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                  />
                  <label htmlFor={`name-${index}`}>Nom</label>
                </div>

                <div className="form-floating" style={{ maxWidth: '100px' }}>
                  <input
                    type="number"
                    step="0.25"
                    className="form-control form-control-sm"
                    id={`comps-${index}`}
                    placeholder="Comprimés"
                    value={med.tablet_count ?? ''}
                    onChange={(e) => handleMedChange(index, 'tablet_count', e.target.value)}
                  />
                  <label htmlFor={`comps-${index}`}>Comprimés</label>
                </div>

                <div className="form-floating" style={{ maxWidth: '110px' }}>
                  <select
                    className="form-select form-select-sm"
                    id={`moment-${index}`}
                    value={med.time[0]}
                    onChange={(e) => handleMedChange(index, 'time', e.target.value)}
                  >
                    <option value="" disabled hidden>Choisir</option>
                    <option value="morning">Matin</option>
                    <option value="evening">Soir</option>
                  </select>
                  <label htmlFor={`moment-${index}`}>Moment</label>
                </div>

                <div className="form-floating" style={{ maxWidth: '100px' }}>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    id={`interval-${index}`}
                    placeholder="Intervalle"
                    value={med.interval_days ?? ''}
                    onChange={(e) => handleMedChange(index, 'interval_days', e.target.value)}
                  />
                  <label htmlFor={`interval-${index}`}>Intervalle</label>
                </div>

                <div className="form-floating" style={{ maxWidth: '160px' }}>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    id={`start-${index}`}
                    placeholder="Date de début"
                    value={med.start_date || ''}
                    onChange={(e) => handleMedChange(index, 'start_date', e.target.value)}
                  />
                  <label htmlFor={`start-${index}`}>Date de début</label>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
