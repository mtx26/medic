import React, { useState, useEffect, useContext } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { UserContext, getGlobalReloadUser } from "../contexts/UserContext"; // ✅ Import UserContext
import AlertSystem from "../components/AlertSystem";
import { log } from "../utils/logger";
import { getFirebaseAuthErrorMessage } from "../utils/getFirebaseAuthErrorMessage";

function VerifyEmail() {
  const { userInfo } = useContext(UserContext); // ✅ Utiliser UserContext
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo?.emailVerified) {
      log.info("Email vérifié via UserContext, redirection...", {
        id: "EMAIL_VERIFIED",
        origin: "VerifyEmail.jsx",
        userInfo,
      });
      navigate("/calendars");
    }
  }, [userInfo, navigate]); // ✅ Si userInfo.emailVerified change, on redirige

  const handleSendVerification = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (user) {
      try {
        await sendEmailVerification(user);
        setAlertMessage("Email de vérification envoyé ! Vérifiez votre boîte mail.");
        setAlertType("success");
        log.info("Email de vérification envoyé", {
          id: "EMAIL_VERIFICATION_SENT",
          origin: "VerifyEmail.jsx",
          user,
        });

      } catch (error) {
        log.error("Erreur d'envoi du mail de vérification", {
          id: "EMAIL_VERIFICATION_ERROR",
          origin: "VerifyEmail.jsx",
          error,
        });
        setAlertMessage(getFirebaseAuthErrorMessage(error.code));
        setAlertType("danger");
      }
    } else {
      setAlertMessage("Aucun utilisateur connecté.");
      setAlertType("danger");
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        const reloadUser = getGlobalReloadUser();
        if (reloadUser) {
          await reloadUser();
        }
      }
    }, 5000);
  
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: "500px", width: "100%", borderRadius: "1rem" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>Vérification de l'adresse email</h5>
            <p>Envoyez un nouveau lien de vérification à votre adresse email.</p>
          </div>

          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />

          <form onSubmit={handleSendVerification}>
            <button type="submit" className="btn btn-outline-primary w-100 mt-3">
              <i className="bi bi-envelope-paper"></i>
              <span> Renvoyer le lien de vérification</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
