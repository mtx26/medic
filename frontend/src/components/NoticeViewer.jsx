export default function ViewNoticeButton({ box_id }) {
    const handleClick = () => {
      const url = `${import.meta.env.VITE_API_URL}/api/proxy/pdf?box_id=${box_id}`;
      window.open(url, '_blank');
    };
  
    return (
      <button className="btn btn-outline-primary" onClick={handleClick}>
        📄 Voir la notice
      </button>
    );
  }
  