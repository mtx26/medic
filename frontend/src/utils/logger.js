const isDev = process.env.MODE === "development"; // ou NODE_ENV si tu n’utilises pas Vite
const API_URL = process.env.REACT_APP_API_URL;

const fetchLog = (msg, error, data, type) => {
  let fullMessage = msg;
  if (data !== undefined && data !== null) {
    fullMessage += ` ${JSON.stringify(data)}`;
  }

  if (!isDev) {
    fetch(`${API_URL}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: fullMessage,
        error: error ?? null,
        type,
        time: new Date().toISOString(),
      }),
    }).catch((err) => {
      if (isDev) console.warn("Échec de l'envoi du log au backend :", err);
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
    if (isDev) console.error(`[ERROR] ${msg}`, error ?? "");
    fetchLog(msg, error, null, "error");
  },
};
