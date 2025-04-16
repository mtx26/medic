import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    return JSON.parse(sessionStorage.getItem("userInfo")) || null;
  });

  const reloadUser = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const newUserInfo = {
      displayName: userSnap.exists() ? userSnap.data().displayName || user.displayName || "Utilisateur" : user.displayName || "Utilisateur",
      photoURL: userSnap.exists() ? userSnap.data().photoURL || user.photoURL || "https://www.w3schools.com/howto/img_avatar.png" : user.photoURL || "https://www.w3schools.com/howto/img_avatar.png",
      role: userSnap.exists() ? userSnap.data().role || "user" : "user",
      uid: user.uid,
    };

    setUserInfo(newUserInfo);
    sessionStorage.setItem("userInfo", JSON.stringify(newUserInfo));
  };

  globalReloadUser = reloadUser; // ✅ Stocker `reloadUser` globalement

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) reloadUser();
      else {
        setUserInfo(null);
        sessionStorage.removeItem("userInfo");
      }
    });
  }, []);

  return (
    <UserContext.Provider value={{ userInfo }}>
      {children}
    </UserContext.Provider>
  );
};
export { UserContext };

// 🔹 Fonction pour récupérer `reloadUser` globalement
export const getGlobalReloadUser = () => globalReloadUser;
