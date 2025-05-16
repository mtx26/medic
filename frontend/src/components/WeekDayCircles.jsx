export default function WeekDayCircles({ selectedDate, onSelectDate, getWeekDays }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalise l'heure
  
    return (
      <div className="d-flex justify-content-center gap-2 px-3 mb-3">
        {getWeekDays(selectedDate).map((day, index) => {
          const isSelected = day.toDateString() === new Date(selectedDate).toDateString();
          const isToday = day.toDateString() === today.toDateString();
  
          return (
            <div
              key={index}
              role="button"
              className={
                `text-center rounded-circle border 
                ${isToday 
                    ? 
                    (isSelected ? 'bg-success text-white border-primary border-3' : 'bg-success text-white border-success border-3') 
                    : 
                    (isSelected ? 'bg-primary text-white border-primary border-3' : 'bg-light')}`
                }
              onClick={() => onSelectDate(day)}
              style={{
                width: 44,
                height: 44,
                lineHeight: '16px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                paddingTop: '4px',
              }}
            >
              {day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}
              <br />
              <strong>{day.getDate()}</strong>
            </div>
          );
        })}
      </div>
    );
  }
  