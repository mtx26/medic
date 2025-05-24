import { useLocation } from 'react-router-dom';
import { useRealtimeCalendars, useRealtimeSharedCalendars } from '../hooks/useRealtimeCalendars';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { useRealtimeTokens } from '../hooks/useRealtimeTokens';
import PropTypes from 'prop-types';


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

  // ✅ Appel des hooks (OK car toujours dans un composant monté dans <Router>)
  useRealtimeCalendars(isRealtimeEnabled ? setCalendarsData : null, setLoadingStates);
  useRealtimeSharedCalendars(isRealtimeEnabled ? setSharedCalendarsData : null, setLoadingStates);
  useRealtimeNotifications(isRealtimeEnabled ? setNotificationsData : null, setLoadingStates);
  useRealtimeTokens(isRealtimeEnabled ? setTokensList : null, setLoadingStates);

  return null; // pas de rendu visuel, juste des hooks
}

RealtimeManager.propTypes = {
  setCalendarsData: PropTypes.func.isRequired,
  setSharedCalendarsData: PropTypes.func.isRequired,
  setNotificationsData: PropTypes.func.isRequired,
  setTokensList: PropTypes.func.isRequired,
  setLoadingStates: PropTypes.func.isRequired,
};

