import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  getWeekDaysISOStrings,
  getMondayFromDate,
  formatToLocalISODate,
} from '../utils/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function WeekCalendarSelector({ selectedDate, onWeekSelect }) {
  const monday = getMondayFromDate(selectedDate);
  const today = formatToLocalISODate(new Date());
  const { t } = useTranslation();

  const handleChange = (date) => {
    onWeekSelect(date);
  };

  return (
    <Calendar
      onClickDay={handleChange}
      value={new Date(selectedDate)}
      locale={t('locale')}
      tileClassName={({ date, view }) => {
        if (view === 'month') {
          const date_iso = formatToLocalISODate(date);

          if (today === date_iso) {
            return 'bg-success text-white';
          }
          if (getWeekDaysISOStrings(monday).includes(date_iso)) {
            return 'bg-primary text-white';
          }
        }
        return null;
      }}
    />
  );
}

WeekCalendarSelector.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  onWeekSelect: PropTypes.func.isRequired,
};
