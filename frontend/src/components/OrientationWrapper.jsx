import React, { useEffect, useState } from 'react';

export default function OrientationWrapper({ children }) {
  const getOrientation = () => {
    if (window.screen.orientation) {
      return window.screen.orientation.type.startsWith('landscape');
    }
    // Fallback
    return window.innerWidth > window.innerHeight;
  };

  const [isLandscape, setIsLandscape] = useState(getOrientation());

  useEffect(() => {
    const handleChange = () => {
      setIsLandscape(getOrientation());
    };

    if (window.screen.orientation?.addEventListener) {
      window.screen.orientation.addEventListener('change', handleChange);
    } else {
      window.addEventListener('resize', handleChange); // fallback
    }

    return () => {
      if (window.screen.orientation?.removeEventListener) {
        window.screen.orientation.removeEventListener('change', handleChange);
      } else {
        window.removeEventListener('resize', handleChange);
      }
    };
  }, []);

  if (!isLandscape) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem' }}>🔄</div>
        <h2 style={{ color: '#0d6efd' }}>Veuillez passer en mode paysage</h2>
        <p style={{ color: '#6c757d' }}>Cette page est optimisée pour un affichage horizontal.</p>
      </div>
    );
  }

  return <>{children}</>;
}
