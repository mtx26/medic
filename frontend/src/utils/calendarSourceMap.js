export const getCalendarSourceMap = (personalCalendars, sharedUserCalendars, tokenCalendars) => ({
    personal: {
      fetchSchedule: personalCalendars.fetchPersonalCalendarSchedule,
      calendarsData: personalCalendars.calendarsData,
      setCalendarsData: personalCalendars.setCalendarsData,
      addMedicine: personalCalendars.addMedicine,
      deleteMedicines: personalCalendars.deletePersonalCalendarMedicines,
      updateMedicines: personalCalendars.updatePersonalCalendarMedicines,
    },
    sharedUser: {
      fetchSchedule: sharedUserCalendars.fetchSharedUserCalendarSchedule,
      calendarsData: sharedUserCalendars.sharedCalendarsData,
      setCalendarsData: sharedUserCalendars.setSharedCalendarsData,
      addMedicine: sharedUserCalendars.addMedicine,
      deleteMedicines: sharedUserCalendars.deleteSharedUserCalendarMedicines,
      updateMedicines: sharedUserCalendars.updateSharedUserCalendarMedicines,
    },
    token: {
      fetchSchedule: tokenCalendars.fetchTokenCalendarSchedule,
      calendarsData: null,
      setCalendarsData: null,
      addMedicine: null,
      deleteMedicines: null,
      updateMedicines: null,
    }
  });
  