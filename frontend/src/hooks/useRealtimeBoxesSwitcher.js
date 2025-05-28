// useRealtimeBoxesSwitcher.js
import { useRealtimePersonalBoxes, useRealtimeSharedBoxes } from './useRealtimeBoxes';

export const useRealtimeBoxesSwitcher = (
  calendarType,
  calendarId,
  setBoxes,
  setLoadingBoxes
) => {
  // Appels inconditionnels
  const isPersonal = calendarType === 'personal';
  const isShared = calendarType === 'sharedUser';

  useRealtimePersonalBoxes(
    isPersonal ? calendarId : null,
    setBoxes,
    setLoadingBoxes
  );
  useRealtimeSharedBoxes(
    isShared ? calendarId : null,
    setBoxes,
    setLoadingBoxes
  );
}