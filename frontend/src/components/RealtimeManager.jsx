import { useLocation } from 'react-router-dom';
import { useRealtimeCalendars, useRealtimeSharedCalendars } from '../hooks/useRealtimeCalendars';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { useRealtimeTokens } from '../hooks/useRealtimeTokens';

export default function RealtimeManager({ setCalendarsData, setSharedCalendarsData, setNotificationsData, setTokensList, setLoadingStates }) {
  const location = useLocation();

  // Liste blanche des routes où on active le realtime
  const enabledRoutes = [
    "/calendars",
    "/calendar/",
    "/shared-user-calendar/",
    "/shared-token-calendar/",
    "/notifications",
    "/account",
    "/shared-calendar"
  ];

  const isRealtimeEnabled = enabledRoutes.some(route => location.pathname.startsWith(route));

  if (!isRealtimeEnabled) return null;

  // ✅ Appel des hooks (OK car toujours dans un composant monté dans <Router>)
  useRealtimeCalendars(setCalendarsData, setLoadingStates);
  useRealtimeSharedCalendars(setSharedCalendarsData, setLoadingStates);
  useRealtimeNotifications(setNotificationsData, setLoadingStates);
  useRealtimeTokens(setTokensList, setLoadingStates);

  return null; // pas de rendu visuel, juste des hooks
}
