const isDev = process.env.NODE_ENV === "development";
const forceLog = true; // ← AJOUT : active pour test local
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) console.error("API_URL is not defined");

const fetchLog = (msg, error, context, type) => {
  const structuredMessage = {
    message: msg,
    context: context ?? null,
    error: error?.message ?? (typeof error === "string" ? error : null),
    stack: error?.stack ?? null,
    type,
  };

  if ((forceLog || !isDev) && API_URL) {
    fetch(`${API_URL}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(structuredMessage),
    }).catch((err) => {
      if (isDev) console.warn("Échec de l'envoi du log au backend :", err);
    });
  }

  if (isDev) {
    console.groupCollapsed(`[${type.toUpperCase()}] ${msg}`);
    console.log("Message:", msg);
    if (context) console.log("Contexte:", context);
    if (error) {
      console.error("Erreur:", error);
      if (error.stack) console.log("Stack:", error.stack);
    }
    console.groupEnd();
  }
};

export const log = {
  info: (msg, context) => fetchLog(msg, null, context, "info"),
  warn: (msg, context) => fetchLog(msg, null, context, "warning"),
  error: (msg, error, context) => fetchLog(msg, error, context, "error"),
};
