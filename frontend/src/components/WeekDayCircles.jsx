export default function WeekDayCircles({ selectedDate, onSelectDate, getWeekDays }) {
    return (
        <div className="d-flex justify-content-center gap-2 px-3 mb-3">
            {getWeekDays(selectedDate).map((day, index) => {
            const isSelected = day.toDateString() === new Date(selectedDate).toDateString();
            return (
                <div
                key={index}
                className={`text-center rounded-circle border ${isSelected ? 'bg-primary text-white' : 'bg-light'}`}
                onClick={() => {
                    onSelectDate(day);
                }}
                style={{
                    width: 44,
                    height: 44,
                    lineHeight: '16px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    paddingTop: '4px'
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