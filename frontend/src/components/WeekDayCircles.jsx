import {
  getWeekDaysISOStrings,
  getMondayFromDate,
  formatToLocalISODate,
} from '../utils/dateUtils';
import PropTypes from 'prop-types';

export default function WeekDayCircles({ selectedDate, onSelectDate }) {
  const today = formatToLocalISODate(new Date());
  const monday = getMondayFromDate(selectedDate);

  return (
    <div
      className="d-flex flex-nowrap justify-content-center"
      style={{ overflow: 'hidden' }}
    >
      {getWeekDaysISOStrings(monday).map((day, index) => {
        const isSelected = day === selectedDate;
        const isToday = day === today;

        const baseClass = `
        rounded-circle border mx-1 position-relative
        ${
          isToday
            ? `bg-success text-white border-3 border-${isSelected ? 'primary' : 'success'}`
            : isSelected
              ? 'bg-primary text-white border-primary border-3'
              : 'bg-light text-dark'
        }
      `;

        return (
          <div
            key={index}
            className={baseClass}
            role="button"
            tabIndex={0}
            aria-label={`Aller au ${new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            onClick={() => onSelectDate(formatToLocalISODate(day))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(formatToLocalISODate(day));
              }
            }}
            style={{
              width: 'calc(100% / 7)',
              maxWidth: '40px',
              minWidth: '32px',
              aspectRatio: '1',
              cursor: 'pointer',
              flexShrink: 1,
              overflow: 'hidden',
            }}
          >
            <div
              className="d-flex flex-column align-items-center justify-content-center text-center position-absolute top-0 start-0 w-100 h-100"
              style={{ fontSize: '0.75rem' }}
            >
              {new Date(day)
                .toLocaleDateString('fr-FR', { weekday: 'short' })
                .slice(0, 2)}
              <br />
              <strong>{new Date(day).getDate()}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

WeekDayCircles.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  onSelectDate: PropTypes.func.isRequired,
};
