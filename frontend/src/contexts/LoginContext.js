import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"; // ✅ Importer Firebase Auth
import { auth } from "../services/firebase"; // ✅ Vérifie le chemin de Firebase

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [login, setLoginState] = useState(() => {
    return JSON.parse(localStorage.getItem("login")) || false;
  });

  const [authReady, setAuthReady] = useState(false); // 🆕 nouvel état

  const setLogin = (value) => {
    setLoginState(value);
    localStorage.setItem("login", JSON.stringify(value));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLogin(!!user);
      setAuthReady(true); // ✅ Auth terminé
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ login, setLogin, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
