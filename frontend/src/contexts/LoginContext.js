import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

// Création d'un contexte pour l'authentification
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [currentUser, setCurrentUser] = useState(null);  // 🔥 Ajout de l'utilisateur courant
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);        // 🔥 Mémorise l'utilisateur entier
      setAuthReady(true);          // 🔥 Auth prêt une fois l'utilisateur reçu
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
