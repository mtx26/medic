export const getCalendarSourceMap = (
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars
) => ({
  personal: {
    fetchSchedule: personalCalendars.fetchPersonalCalendarSchedule,
    calendarsData: personalCalendars.calendarsData,
    setCalendarsData: personalCalendars.setCalendarsData,
    updateBox: personalCalendars.updatePersonalBox,
    createBox: personalCalendars.createPersonalBox,
    deleteBox: personalCalendars.deletePersonalBox,
    downloadCalendarPdf: personalCalendars.downloadPersonalCalendarPdf,
    deleteCalendar: personalCalendars.deleteCalendar,
    decreaseStock: personalCalendars.useMedicinesForPersonalPillbox
  },
  sharedUser: {
    fetchSchedule: sharedUserCalendars.fetchSharedUserCalendarSchedule,
    calendarsData: sharedUserCalendars.sharedCalendarsData,
    setCalendarsData: sharedUserCalendars.setSharedCalendarsData,
    updateBox: sharedUserCalendars.updateSharedUserBox,
    createBox: sharedUserCalendars.createSharedUserBox,
    deleteBox: sharedUserCalendars.deleteSharedUserBox,
    downloadCalendarPdf: null,
    deleteCalendar: null,
    decreaseStock: sharedUserCalendars.useMedicinesForSharedUserPillbox
  },
  token: {
    fetchSchedule: tokenCalendars.fetchTokenCalendarSchedule,
    calendarsData: null,
    setCalendarsData: null,
    // TODO: add updateBox for tokenCalendars
    updateBox: null,
    createBox: null,
    deleteBox: null,
    downloadCalendarPdf: null,
    deleteCalendar: null,
    decreaseStock: null
  },
});
