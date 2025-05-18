export default function WeekDayCircles({ selectedDate, onSelectDate, getWeekDays }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="d-flex flex-nowrap justify-content-center px-3 mb-3" style={{ overflow: 'hidden' }}>
      {getWeekDays(selectedDate).map((day, index) => {
        const isSelected = day.toDateString() === new Date(selectedDate).toDateString();
        const isToday = day.toDateString() === today.toDateString();

        const baseClass = `
          rounded-circle border mx-1 position-relative
          ${isToday
            ? (isSelected
                ? 'bg-success text-white border-primary border-3'
                : 'bg-success text-white border-success border-3')
            : (isSelected
                ? 'bg-primary text-white border-primary border-3'
                : 'bg-light text-dark')}
        `;

        return (
          <div
            key={index}
            className={baseClass}
            role="button"
            tabIndex={0}
            onClick={() => onSelectDate(day)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(day);
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
              {day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}
              <br />
              <strong>{day.getDate()}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
