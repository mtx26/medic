import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function CalendarActionSheet({ actions }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const toggleDropdown = () => {
    if (!show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 192, // largeur estimée du menu
      });
    }
    setShow(!show);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <button className="btn btn-light" ref={buttonRef} onClick={toggleDropdown}>
        ⋯
      </button>

      {show && (
        <ul
          className="dropdown-menu show shadow"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            minWidth: '12rem',
            zIndex: 1055,
          }}
        >
          {actions.map((action, index) => (
            <li key={index}>
              <button
                className={`dropdown-item ${action.danger ? 'text-danger' : ''}`}
                onClick={() => {
                  action.onClick();
                  setShow(false);
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

CalendarActionSheet.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      danger: PropTypes.bool,
    })
  ).isRequired,
};

export default CalendarActionSheet;
