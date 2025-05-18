// dateUtils.js

// 🔁 Formatte une date JS en YYYY-MM-DD
export function formatToLocalISODate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Pas de décalage UTC ici
}

// 📅 Retourne le lundi de la semaine contenant la date donnée
export function getMondayFromDate(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay(); // 0 (dim) à 6 (sam)
  const diff = (day + 6) % 7; // transforme 0 → 6, 1 → 0, 2 → 1, etc.

  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return formatToLocalISODate(monday);
}

// 🔁 Retourne les jours de la semaine à partir d'un lundi
export function getWeekDaysISOStrings(monday) {
  return [...Array(7)].map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return formatToLocalISODate(d);
  });
} 