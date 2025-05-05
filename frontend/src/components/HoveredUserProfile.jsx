// src/components/HoveredUserProfile.jsx
import React from 'react';

function HoveredUserProfile({ user, style }) {
  if (!user) return null;

  return (
    <div
      className="position-absolute shadow-lg rounded-3 bg-white border p-3"
      style={{
        zIndex: 999,
        width: '250px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        ...style, // pour passer les positions top/left personnalisées
      }}
    >
      <div className="d-flex flex-column align-items-center text-center gap-2">
        <img
          src={user.picture_url}
          alt="Profil"
          className="rounded-circle"
          style={{ width: '70px', height: '70px', objectFit: 'cover' }}
        />
        <div>
          <h6 className="mb-0">{user.display_name}</h6>
          <small className="text-muted">{user.receiver_email}</small>
        </div>
      </div>
    </div>
  );
}

export default HoveredUserProfile;
