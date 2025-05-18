import { useEffect } from 'react';

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
