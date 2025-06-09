import React from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function ViewNoticeButton({ box_id }) {
  const openPdfInNewTab = async () => {
    try {
      const res = await fetch(`${API_URL}/api/proxy/pdf?box_id=${box_id}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Erreur PDF :', err);
      alert('Impossible d’afficher la notice.');
    }
  };

  return (
    <button className="btn btn-outline-primary" onClick={openPdfInNewTab}>
      📄 Voir la notice
    </button>
  );
}

export default ViewNoticeButton;
