import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../contexts/UserContext';

function HomePage() {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  return (
    <>
      <header className="bg-light border-bottom py-5">
        <div className="container text-center">
          <i className="bi bi-capsule display-1 text-primary"></i>
          <h1 className="mt-3 fw-bold text-primary">MediTime</h1>
          <p className="lead text-muted">
            L'application pour gérer, suivre et partager vos traitements médicaux au quotidien.
          </p>
          <div className="mt-4 d-flex flex-column flex-md-row justify-content-center gap-3">
            {userInfo ? (
              <button className="btn btn-primary btn-lg px-4" onClick={() => navigate("/calendars")}>Accéder à l'application</button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg px-4" onClick={() => navigate("/login")}>Se connecter</button>
                <button className="btn btn-outline-primary btn-lg px-4" onClick={() => navigate("/register")}>Créer un compte</button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="container py-5">
        <div className="row text-center mb-5">
          <div className="col-md-4">
            <i className="bi bi-calendar-check display-4 text-primary"></i>
            <h4 className="mt-3">Calendrier intelligent</h4>
            <p>Gérez vos prises quotidiennes et soyez notifié des prochains traitements.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-people display-4 text-primary"></i>
            <h4 className="mt-3">Partage collaboratif</h4>
            <p>Autorisez vos proches ou aidants à consulter et modifier vos plannings.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-lock-fill display-4 text-primary"></i>
            <h4 className="mt-3">Sécurité assurée</h4>
            <p>Vos données sont chiffrées et hébergées en toute sécurité grâce à Supabase et Firebase.</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="fw-bold text-primary">Pourquoi choisir Meditime ?</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: "800px" }}>
            Parce que la santé ne devrait jamais être laissée au hasard. Avec MediTime, vous avez un outil simple, clair et sécurisé pour organiser vos traitements et ceux de vos proches.
          </p>
        </div>
      </section>

      <section className="bg-primary text-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold">Commencez dès aujourd'hui</h2>
          <p className="lead">Créez votre compte gratuitement et découvrez la simplicité de la gestion médicale.</p>
          <button className="btn btn-light btn-lg px-4" onClick={() => navigate("/register")}>Je crée mon compte</button>
        </div>
      </section>
    </>
  );
}

export default HomePage;