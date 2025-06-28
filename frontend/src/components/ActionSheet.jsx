import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ActionSheet({ actions, buttonSize }) {
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
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        !e.target.closest('.dropdown-menu')
      ) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* pas de background */}
      <button className={`btn btn-outline-dark ${buttonSize === 'sm' ? 'btn-sm' : ''}`} ref={buttonRef} onClick={toggleDropdown}>
        <i className="bi bi-three-dots-vertical"></i>
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
            action.separator ? (
              <li key={`separator-${index}`}>
                <hr className="dropdown-divider" />
              </li>
            ) : (
              <li key={index}>
                <button
                  className={`dropdown-item btn btn-outline-dark ${action.danger ? 'text-danger' : ''}`}
                  onClick={() => {
                    action.onClick?.();
                    setShow(false);
                  }}
                >
                  {action.label}
                </button>
              </li>
            )
          ))}
        </ul>
      )}
    </>
  );
}

ActionSheet.propTypes = {
  buttonSize: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,  // ← autorise du JSX
      onClick: PropTypes.func,
      danger: PropTypes.bool,
      separator: PropTypes.bool,
    })
  ).isRequired,
};

export default ActionSheet;
