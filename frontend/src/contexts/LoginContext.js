import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"; // ✅ Importer Firebase Auth
import { auth } from "../services/firebase"; // ✅ Vérifie le chemin de Firebase

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [login, setLoginState] = useState(() => {
    return JSON.parse(localStorage.getItem("login")) || false;
  });

  const setLogin = (value) => {
    setLoginState(value);
    localStorage.setItem("login", JSON.stringify(value));
  };

  // ✅ Écoute les changements d'état de connexion
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLogin(true); // 🔹 L'utilisateur est connecté
      } else {
        setLogin(false); // 🔹 L'utilisateur est déconnecté
      }
    });

    return () => unsubscribe(); // 🔹 Se désabonner lorsqu'on quitte la page
  }, []);

  return (
    <AuthContext.Provider value={{ login, setLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
