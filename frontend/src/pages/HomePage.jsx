import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

function HomePage() {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  const handleAccess = () => navigate("/calendars");
  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/register");
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <>
      <header className="bg-light border-bottom shadow-sm py-5 rounded-3">
        <div className="container text-center">
          <i className="bi bi-capsule display-1 text-primary" aria-hidden="true"></i>
          <h1 className="mt-3 fw-bold text-primary">MediTime</h1>
          <p className="lead text-muted">
            Gérez, suivez et partagez vos traitements médicaux facilement.
          </p>
          <div className="mt-4 d-flex flex-column flex-md-row justify-content-center gap-3">
            {userInfo ? (
              <button 
                className="btn btn-primary btn-lg px-4" 
                onClick={handleAccess}
                aria-label="Accéder à l'application"
                title="Accéder à l'application"
              >
                Accéder à l'application
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-primary btn-lg px-4 shadow rounded-3" 
                  onClick={handleLogin}
                  aria-label="Se connecter"
                  title="Se connecter"
                >
                  Se connecter
                </button>
                <button 
                  className="btn btn-outline-primary btn-lg px-4 shadow rounded-3" 
                  onClick={handleRegister}
                  aria-label="Créer un compte"
                  title="Créer un compte"
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="container py-5">
        <div className="row text-center mb-5">
          <div className="col-md-4">
            <i className="bi bi-calendar-check display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">Calendrier intelligent</h3>
            <p>Programmez vos prises, recevez des rappels et gardez l’esprit tranquille.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-people display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">Partage collaboratif</h3>
            <p>Donnez accès à vos proches ou soignants pour vous accompagner au quotidien.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-lock-fill display-4 text-primary" aria-hidden="true"></i>
            <h3 className="mt-3">Sécurité assurée</h3>
            <p>Vos données sont protégées avec des technologies fiables comme Supabase et Firebase.</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="fw-bold text-primary">Pourquoi choisir MediTime&nbsp;?</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: "800px" }}>
            Parce que la santé ne laisse pas de place à l’improvisation. MediTime vous offre une solution claire,
            intuitive et sécurisée pour suivre vos traitements et ceux de vos proches, jour après jour.
          </p>
        </div>
      </section>

      {/* Témoignage */}
      <section className="bg-light py-5">
        <div className="container text-center">
          <h2 className="fw-bold text-primary mb-4">Ils nous font confiance</h2>
          <blockquote className="blockquote mx-auto" style={{ maxWidth: "700px" }}>
            <p className="mb-3 fst-italic">
              “Je continue à remplir le pilulier de ma maman chaque semaine, mais avec MediTime, c’est devenu
              beaucoup plus simple. Je vois tout son traitement en un coup d’œil, je reçois des rappels,
              et elle aussi. On est bien plus sereins.”
            </p>
            <footer className="blockquote-footer">
              Andrée C. et ses petits-enfants
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Application mobile */}
      <section className="bg-white border-top py-5">
        <div className="container text-center">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <i className="bi bi-phone display-1 text-primary" aria-hidden="true"></i>
            </div>
            <div className="col-md-6">
              <h2 className="fw-bold text-primary mb-3">Disponible sur votre téléphone</h2>
              <p className="text-muted">
                MediTime fonctionne comme une application mobile. Ajoutez-la à votre écran d’accueil pour un accès rapide.
              </p>
              <ul className="list-unstyled text-start d-inline-block mt-3">
                <li><i className="bi bi-check-circle-fill text-primary me-2"></i>Installation simple depuis le navigateur</li>
                <li><i className="bi bi-check-circle-fill text-primary me-2"></i>Interface tactile fluide</li>
                <li><i className="bi bi-check-circle-fill text-primary me-2"></i>Accès rapide depuis l'écran d'accueil</li>
              </ul>

              {isIOS && (
                <div className="alert alert-info mt-4">
                  Sur <strong>iPhone</strong>, ouvrez MediTime dans Safari, appuyez sur 
                  <i className="bi bi-share mx-1"></i> puis <em>“Sur l’écran d’accueil”</em>.
                </div>
              )}

              {isAndroid && (
                <div className="alert alert-info mt-4">
                  Sur <strong>Android</strong>, un message <em>“Ajouter à l’écran d’accueil”</em> s’affiche automatiquement en bas du navigateur. Appuyez dessus pour installer MediTime.
                </div>
              )}

              {!isIOS && !isAndroid && (
                <div className="alert alert-secondary mt-4">
                  MediTime est également accessible sur ordinateur ou tablette.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Appel à l'action final */}
      <section className="bg-primary text-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold">Commencez dès aujourd’hui</h2>
          <p className="lead mb-4">
            Créez votre compte gratuitement et simplifiez la gestion médicale de toute la famille.
          </p>
          <button 
            className="btn btn-light btn-lg px-4" 
            onClick={handleRegister}
            aria-label="Créer un compte"
            title="Créer un compte"
          >
            Je crée mon compte
          </button>
        </div>
      </section>
    </>
  );
}

export default HomePage;
