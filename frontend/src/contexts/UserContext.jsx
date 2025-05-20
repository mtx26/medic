import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userInfo, setUserInfo] = useState(() =>
    JSON.parse(sessionStorage.getItem("userInfo")) || null
  );

  const reloadUser = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};

      const info = {
        displayName: data.display_name || user.displayName || "Utilisateur",
        photoURL: data.photo_url || user.photoURL || "https://www.w3schools.com/howto/img_avatar.png",
        role: data.role || "user",
        uid: user.uid,
        emailVerified: user.emailVerified,
        email: user.email,
        providerData: user.providerData,
      };

      setUserInfo(info);
      sessionStorage.setItem("userInfo", JSON.stringify(info));
    } catch (error) {
      console.error("[UserContext] Erreur lors du chargement Firestore :", error);
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
