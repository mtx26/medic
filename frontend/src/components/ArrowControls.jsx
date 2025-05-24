import { useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ArrowControls({ onLeft, onRight }) {

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        onLeft();
      } else if (event.key === 'ArrowRight') {
        onRight();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLeft, onRight]);
  

  return null;
}

ArrowControls.propTypes = {
  onLeft: PropTypes.func.isRequired,
  onRight: PropTypes.func.isRequired,
};
