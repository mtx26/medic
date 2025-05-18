// dateUtils.js

// 🔁 Formatte une date JS en YYYY-MM-DD
export function formatToISODate(date) {
  return date.toISOString().slice(0, 10); // ex: "2025-05-18"
}

// 🔁 Formatte une date avec locale fr-CA (utile pour compatibilité Supabase par ex)
export function formatToFRDate(date) {
  return new Intl.DateTimeFormat('fr-CA').format(date); // ex: "2025-05-18"
}

// 📅 Retourne le lundi de la semaine contenant la date donnée
export function getMondayFromDate(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay(); // 0 (dim) à 6 (sam)
  const diff = (day + 6) % 7; // transforme 0 → 6, 1 → 0, 2 → 1, etc.

  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  monday.setHours(0, 0, 0, 0); // optionnel : reset heure
  return monday;
}

