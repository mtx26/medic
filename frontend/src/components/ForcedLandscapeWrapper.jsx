import React, { useEffect, useState } from 'react';

export default function ForcedLandscapeWrapper({ children }) {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const isPortrait = viewportHeight > viewportWidth;

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isPortrait) {
    return (
      <div
        style={{
          position: 'fixed',
          width: viewportHeight,
          height: viewportWidth,
          top: 0,
          left: 0,
          transform: `translateX(${viewportWidth}px) rotate(90deg)`,
          transformOrigin: 'top left',
          backgroundColor: 'white',
          overflow: 'auto',
          zIndex: 1000,
        }}
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
