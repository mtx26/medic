// useRealtimeBoxesSwitcher.js
import { useRealtimePersonalBoxes } from './useRealtimeBoxes';

export const useRealtimeBoxesSwitcher = (
  calendarType,
  calendarId,
  setBoxes,
  setLoadingBoxes
) => {
  // Appels inconditionnels
  const isPersonal = calendarType === 'personal';

  useRealtimePersonalBoxes(
    isPersonal ? calendarId : null,
    setBoxes,
    setLoadingBoxes
  );
}