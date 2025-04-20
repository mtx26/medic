import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/LoginContext";
import AlertSystem from "../components/AlertSystem";

function SelectCalendar({ calendars, fetchCalendars, addCalendar, deleteCalendar, RenameCalendar, getMedicineCount }) {

  const navigate = useNavigate();
  const { authReady, login } = useContext(AuthContext); // Récupération du contexte d'authentification
  const [newCalendarName, setNewCalendarName] = useState(''); // État pour le nom du nouveau calendrier
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage
  const [count, setCount] = useState({}); // État pour stocker le nombre de médicaments par calendrier
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  // Chargement des calendriers lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (authReady && login) {
    fetchCalendars(); // Appel de la fonction pour récupérer les calendriers
    }
  }, [authReady, login]);
  
  // Chargement du nombre de médicaments pour chaque calendrier
  useEffect(() => {
    if (authReady && login && calendars.length > 0) {
    const loadCounts = async () => {
      const counts = {};
      for (const calendarName of calendars) {
      const c = await getMedicineCount(calendarName); // Récupération du nombre de médicaments
      counts[calendarName] = c;
      }
      setCount(counts); // Mise à jour de l'état avec les nombres
    };
    loadCounts();
    }
  }, [calendars]);
  

  return (
<div className="container d-flex justify-content-center">
  <div className="card p-3 shadow-sm w-100" style={{ maxWidth: '700px' }}>
  <h5 className="mb-3">Choisir un calendrier</h5>

  {/* Champ pour ajouter un nouveau calendrier */}
  <div className="input-group mb-4">
    <input
    type="text"
    className="form-control"
    placeholder="Nom du calendrier"
    value={newCalendarName}
    onChange={(e) => setNewCalendarName(e.target.value)} // Mise à jour du nom du nouveau calendrier
    />
    <button
    onClick={async() => {
      const success = await addCalendar(newCalendarName);
      if (success) {
        setAlertMessage("✅ Calendrier ajouté avec succès !");
        setAlertType("success");
      } else {
        setAlertMessage("❌ Erreur lors de l'ajout du calendrier.");
        setAlertType("danger");
      }
      setOnConfirmAction(null);
      setTimeout(() => {
        setAlertMessage("");
        setAlertType("");
      }, 3000);
      setNewCalendarName("");
    }} // Ajout d'un nouveau calendrier
    className="btn btn-outline-primary"
    >
    ➕ Ajouter
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

  {/* Liste des calendriers */}
  <div className="list-group">
    {calendars.map((calendarName, index) => (
    <div
      key={index}
      className="list-group-item"
    >
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      {/* Partie gauche : Nom du calendrier et nombre de médicaments */}
      <div className="flex-grow-1">
        <strong>{calendarName}</strong>
        <div className="text-muted small">
        Nombre de médicaments :
        <span className="fw-semibold ms-1">
          {count[calendarName] ?? "Chargement..."} {/* Affichage du nombre ou "Chargement..." */}
        </span>
        </div>
      </div>

      {/* Partie pour renommer un calendrier */}
      <div className="input-group input-group w-100 w-md-auto">
        <input
        type="text"
        className="form-control form-control"
        placeholder="Nouveau nom"
        value={renameValues[calendarName] || ""} // Valeur du champ de renommage
        onChange={(e) =>
          setRenameValues({ ...renameValues, [calendarName]: e.target.value }) // Mise à jour de l'état
        }
        />
        <button
        className="btn btn-outline-warning"
        title="Renommer"
        onClick={() => {
          RenameCalendar(calendarName, renameValues[calendarName]); // Renommage du calendrier
          setRenameValues({ ...renameValues, [calendarName]: "" }); // Réinitialisation du champ
        }}
        >
        ✏️
        </button>
      </div>

      {/* Boutons d'action : ouvrir ou supprimer */}
      <div className="btn-group btn-group">
        <button
        type="button"
        className="btn btn-outline-success"
        title="Ouvrir"
        onClick={() => navigate('/calendars/' + calendarName)} // Navigation vers le calendrier
        >
        Ouvrir
        </button>
        <button
        type="button"
        className="btn btn-outline-danger"
        title="Supprimer"
        onClick={() => {
          setAlertType("confirm-danger");
          setAlertMessage("❌ Confirmez-vous la suppression du calendrier ?");
          setOnConfirmAction(() => () => {
            deleteCalendar(calendarName);
          });
        }}
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
