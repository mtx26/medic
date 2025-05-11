// useRealtimeMedicinesSwitcher.js
import { useRealtimePersonalMedicines, useRealtimeSharedUserMedicines } from './useRealtimeMedicines';

export const useRealtimeMedicinesSwitcher = (
  calendarType,
  calendarId,
  setMedicinesData,
  setOriginalMedicinesData,
  setLoadingMedicines
) => {
  // Appels inconditionnels
  const isPersonal = calendarType === 'personal';
  const isSharedUser = calendarType === 'sharedUser';

  useRealtimePersonalMedicines(
    isPersonal ? calendarId : null,
    setMedicinesData,
    setOriginalMedicinesData,
    setLoadingMedicines
  );

  useRealtimeSharedUserMedicines(
    isSharedUser ? calendarId : null,
    setMedicinesData,
    setOriginalMedicinesData,
    setLoadingMedicines
  );
};
