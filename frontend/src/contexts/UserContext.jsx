import { createContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { log } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() =>
    JSON.parse(localStorage.getItem("userInfo")) || null
  );

  const reloadUser = useCallback(async (name, photoURL, emailEnabled, pushEnabled) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const body = {
        uid: user.uid,
        display_name: name || user.displayName || null,
        email: user.email,
        photo_url: photoURL || user.photoURL || null,
        email_enabled: emailEnabled ?? true,
        push_enabled: pushEnabled ?? true,        
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
        emailEnabled: data.email_enabled,
        pushEnabled: data.push_enabled,
      };

      setUserInfo(info);
      localStorage.setItem("userInfo", JSON.stringify(info));
    } catch (error) {
      log.error("[UserContext] Erreur lors du chargement API", {
        error,
        origin: "USER_CONTEXT_RELOAD_USER_ERROR",
      });
    }
  }, []);

  useEffect(() => {
    globalReloadUser = reloadUser;
  }, [reloadUser]);

  useEffect(() => {
    const current = auth.currentUser;
    if (current) {
      (async () => {
        await reloadUser();
      })();
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        (async () => {
          await reloadUser();
        })();
      } else {
        setUserInfo(null);
        localStorage.removeItem("userInfo");
      }
    });

    return () => unsubscribe();
  }, [reloadUser]);

  return (
    <UserContext.Provider value={{ userInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
