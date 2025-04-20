import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

// Création d'un contexte pour l'authentification
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  // État pour suivre si l'utilisateur est connecté ou non
  const [login, setLoginState] = useState(() => {
    return JSON.parse(localStorage.getItem("login")) || false; // Récupération de l'état de connexion depuis le localStorage
  });

  // État pour indiquer si l'authentification est prête (chargée)
  const [authReady, setAuthReady] = useState(false);

  // Fonction pour mettre à jour l'état de connexion et le stocker dans le localStorage
  const setLogin = (value) => {
    setLoginState(value);
    localStorage.setItem("login", JSON.stringify(value));
  };

  // Effet pour écouter les changements d'état d'authentification via Firebase
  useEffect(() => {
    // Authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLogin(!!user); // Met à jour l'état de connexion en fonction de l'utilisateur
      setAuthReady(true); // Indique que l'authentification est prête
    });

    return () => unsubscribe(); 
  }, []);

  // Fournit le contexte d'authentification aux composants enfants
  return (
    <AuthContext.Provider value={{ login, setLogin, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// Exportation du contexte pour une utilisation dans d'autres composants
export { AuthContext };
