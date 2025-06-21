import React, { useEffect, useState } from 'react';

export default function OrientationWrapper({ children }) {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (!isLandscape) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#f8f9fa', // Bootstrap light
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
