// MedicamentsPage.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem';




function MedicamentsPage({ meds, calendars }) {
  
  const { nameCalendar } = useParams();
  const { authReady, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const lastMedRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [loadingCalendars, setLoadingCalendars] = useState(true);





  const toggleSelection = (index) => {
    meds.setChecked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const isMedValid = (med) => {
    const hasValidStartDate = med.interval_days === 1 || (typeof med.start_date === 'string' && med.start_date.trim() !== '');
  
    return (
      typeof med.name === 'string' && med.name.trim() !== '' &&
      !isNaN(parseFloat(med.tablet_count)) &&
      Array.isArray(med.time) && med.time.length > 0 && ['morning', 'evening'].includes(med.time[0]) &&
      !isNaN(parseInt(med.interval_days)) &&
      hasValidStartDate
    );
  };

  const allMedsValid = meds.medsData.length > 0 && meds.medsData.every(isMedValid);
  

  useEffect(() => {
    const load = async () => {
      if (authReady) { // authReady doit être prêt
        if (currentUser) {
          calendars.setCalendarsData([]); // Bien vider l'ancien
          setLoadingCalendars(true);
          await calendars.fetchCalendars(); // Recharger pour le nouvel utilisateur
          await meds.fetchCalendarsMedecines(nameCalendar);
          setLoadingCalendars(false);
        } else {
          setLoadingCalendars(false);
        }
      }
    };
    load();
  }, [authReady, currentUser]); // 🔥 écouter authReady ET currentUser




  if (loadingCalendars) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }


if (!meds.calendarsData.includes(nameCalendar)) {
  return <div className="text-center mt-5">❌ Calendrier non trouvé</div>;
};

  


  return (
<div className="container d-flex justify-content-center">
  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '750px' }}>
    <div className="d-flex justify-content-start mb-3">
      <button
        className="btn btn-outline-primary"
        onClick={() => navigate(`/calendars/${nameCalendar}`)}
        title="Retour au calendrier"
      >
        <i className="bi bi-calendar-date"></i>
        <span> Retour au calendrier</span>
      </button>
    </div>
    <h4 className="mt-3">
      <i class="bi bi-capsule"></i>
      <span> Liste des médicaments</span>
    </h4>

    <div className="d-flex flex-wrap gap-2 my-3">
      <button 
      onClick={() => {
        meds.addMed();
        setHighlightedIndex(meds.medsData.length);
        setTimeout(() => {
          setHighlightedIndex(null);
        }, 2000)
        setTimeout(() => {
          lastMedRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }} 
      className="btn btn-outline-primary"
      title="Ajouter un médicament"
      >
        <i class="bi bi-plus-lg"></i>
        <span> Ajouter un médicament</span>
      </button>



      <button
        onClick={() => {
          setAlertType("confirm-danger");
          setAlertMessage("❌ Confirmez-vous la suppression des médicaments sélectionnés ?");
          setOnConfirmAction(() => async () => {
            const success = await meds.deleteSelectedMeds(nameCalendar);
            if (success) {
              setAlertMessage("✅ Médicaments supprimés.");
              setAlertType("success");
            } else {
              setAlertMessage("❌ Erreur lors de la suppression.");
              setAlertType("danger");
            }

            setTimeout(() => {
              setAlertMessage("");
              setAlertType("");
            }, 2000);

            setOnConfirmAction(null);
          });
        }}
        className="btn btn-outline-danger"
        disabled={meds.checked.length === 0}
        title="Supprimer les médicaments sélectionnés"
      >
        <i class="bi bi-trash3"></i>
        <span> Supprimer sélectionnés</span>
      </button>


      <button
        onClick={() => {
          setAlertType("confirm-safe");
          setAlertMessage("✅ Enregistrer les modifications de médicaments ?");
          setOnConfirmAction(() => {
            const success = meds.updateMeds(nameCalendar);
            if (success) {
              setAlertMessage("✅ Modifications enregistrées.");
              setAlertType("success");
            } else {
              setAlertMessage("❌ Erreur lors de l'enregistrement des modifications.");
              setAlertType("danger");
            }
            setTimeout(() => {
              setAlertMessage("");
              setAlertType("");
            }, 2000);
            setOnConfirmAction(null);
          });
        }}
        className="btn btn-outline-success"
        disabled={!allMedsValid}
        title="Modifier les médicaments"
      >
        <i class="bi bi-pencil"></i>
        <span> Modifier les médicaments</span>
      </button>
    </div>

      <AlertSystem
        type={alertType}
        message={alertMessage}
        onClose={() => {
          setAlertMessage("");
          setOnConfirmAction(null);
        }}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
        }}
      />


    <ul className="list-group">
      {meds.medsData.length === 0 ? (
        <div className="text-center mt-5 text-muted">❌ Aucun médicament n’a encore été ajouté pour ce calendrier.</div>
      ) : (
        meds.medsData.map((med, index) => (
          <li 
          key={index} 
          ref={index === meds.medsData.length - 1 ? lastMedRef : null} 
          className={`list-group-item px-2 py-1 ${index === highlightedIndex ? 'highlighted-med' : ''}`}
          style={{ maxWidth: '700px'}}
          >
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="form-check" style={{ width: '40px' }}>
                <input
                  className="form-check-input mt-2"
                  type="checkbox"
                  checked={meds.checked.includes(index)}
                  onChange={() => toggleSelection(index)}
                  id={`check-${index}`}
                />
              </div>

              <div className="form-floating" style={{ maxWidth: '150px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id={`name-${index}`}
                  placeholder="Nom"
                  value={med.name}
                  onChange={(e) => meds.handleMedChange(index, 'name', e.target.value)}
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
                  onChange={(e) => meds.handleMedChange(index, 'tablet_count', e.target.value)}
                />
                <label htmlFor={`comps-${index}`}>Comprimés</label>
              </div>

              <div className="form-floating" style={{ maxWidth: '110px' }}>
                <select
                  className="form-select form-select-sm"
                  id={`moment-${index}`}
                  value={med.time[0]}
                  onChange={(e) => meds.handleMedChange(index, 'time', e.target.value)}
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
                  onChange={(e) => meds.handleMedChange(index, 'interval_days', e.target.value)}
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
                  onChange={(e) => meds.handleMedChange(index, 'start_date', e.target.value)}
                />
                <label htmlFor={`start-${index}`}>Date de début</label>
              </div>
            </div>
          </li>
        ))
      )}
    </ul>
  </div>
</div>
  );
}

export default MedicamentsPage;