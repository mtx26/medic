export default function openNotice(box_id) {
    const url = `${import.meta.env.VITE_API_URL}/api/proxy/pdf?box_id=${box_id}`;
    window.open(url, '_blank');
  }
  