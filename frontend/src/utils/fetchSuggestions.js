const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) return [];
  
    const url = `${SUPABASE_URL}/rest/v1/medicaments_be?select=medicament_name,dose&medicament_name=ilike.*${encodeURIComponent(query)}*&limit=10`;
  
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
  
    const data = await res.json();
    console.log(data);
    return data;
  };
  