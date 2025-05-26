import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { log } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userInfo, setUserInfo] = useState(() =>
    JSON.parse(sessionStorage.getItem("userInfo")) || null
  );

  const reloadUser = async (name, photoURL) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const body = {
        uid: user.uid,
        display_name: name || user.displayName || null,
        email: user.email,
        photo_url: photoURL || user.photoURL || null,
      };
      const res = await fetch(`${API_URL}/api/user/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur API Supabase");

      const info = {
        displayName: data.display_name || user.displayName,
        photoURL: data.photo_url || user.photoURL,
        role: data.role || "user",
        uid: user.uid,
        emailVerified: user.emailVerified,
        email: user.email,
        providerData: user.providerData,
      };

      setUserInfo(info);
      sessionStorage.setItem("userInfo", JSON.stringify(info));
    } catch (error) {
      log.error("[UserContext] Erreur lors du chargement API :", {
        error,
        origin: "USER_CONTEXT_RELOAD_USER_ERROR",
      });
    }
  };

  globalReloadUser = reloadUser;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user) await reloadUser();
      else {
        setUserInfo(null);
        sessionStorage.removeItem("userInfo");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ authReady, currentUser, userInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
