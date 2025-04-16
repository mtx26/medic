// src/utils/logger.ts


const isDev = process.env.MODE === "development"; // si tu es sous Vite, sinon adapte à process.env.NODE_ENV
const API_URL = process.env.REACT_APP_API_URL;

const fetchLog = (msg, error, data, Type) => {
  // En production, tu peux l'envoyer au backend
  if (!isDev) {
    fetch(`${API_URL}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        error: error ? JSON.stringify(error) : null,
        data: data ? JSON.stringify(data) : null,
        type: Type,
        time: new Date().toISOString(),
      }),
    }).catch(() => {
      // on évite de crasher l'appli si ça échoue
    });
  }
};

export const log = {
  info: (msg, data) => {
    if (isDev) console.info(`[INFO] ${msg}`, data ?? "");
    fetchLog(msg, null, data, "info");
  },
  warn: (msg, data) => {
    if (isDev) console.warn(`[WARN] ${msg}`, data ?? "");
    fetchLog(msg, null, data, "warning");
  },
  error: (msg, error) => {
    console.error(`[ERROR] ${msg}`, error ?? "");
    fetchLog(msg, error, null, "error");

  },
};
