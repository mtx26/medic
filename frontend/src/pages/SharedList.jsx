import React, { useEffect, useContext, useState, useCallback } from "react";
import { UserContext } from "../contexts/UserContext";
import AlertSystem from "../components/AlertSystem";
import HoveredUserProfile from "../components/HoveredUserProfile";
import { formatToLocalISODate } from "../utils/dateUtils";
import { useTranslation } from "react-i18next";

const VITE_URL = import.meta.env.VITE_VITE_URL;

function SharedList({
  tokenCalendars,
  personalCalendars,
  sharedUserCalendars,
}) {
  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté
  const { t } = useTranslation();

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(""); // Type d'alerte (ex. success, error)
  const [alertMessage, setAlertMessage] = useState(""); // Message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // Action à confirmer
  const [alertId, setAlertId] = useState(null); // Identifiant de l'alerte ciblée

  // 🔄 Chargement et données partagées groupées
  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true); // État de chargement des partages groupés
  const [groupedShared, setGroupedShared] = useState({}); // Données groupées des partages

  // 🔗 Données liées aux partages
  const [expiresAt, setExpiresAt] = useState({}); // Dates d'expiration des liens partagés
  const [permissions, setPermissions] = useState({}); // Permissions associées aux partages
  const [expirationType, setExpirationType] = useState({});
  const [emailsToInvite, setEmailsToInvite] = useState({}); // E-mails à inviter au partage
  const [selectedModifyCalendar, setSelectedModifyCalendar] = useState(null); // Calendrier sélectionné pour modification

  // 📅 Date du jour
  const today = formatToLocalISODate(new Date()); // Date du jour au format 'YYYY-MM-DD'

  // 📄 Copie du lien
  const handleCopyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(
        `${VITE_URL}/shared-token-calendar/${token.id}`,
      );
      setAlertType("success");
      setAlertMessage(t("link_copied"));
      setAlertId(token.id);
    } catch {
      setAlertType("danger");
      setAlertMessage(t("copy_link_error"));
      setAlertId(token.id);
    }
  };

  // 📅 Mise à jour de la date d'expiration
  const handleUpdateTokenExpiration = async (tokenId, date) => {
    const rep = await tokenCalendars.updateTokenExpiration(tokenId, date);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
  };

  // 📄 Mise à jour des permissions
  const handleUpdateTokenPermissions = async (tokenId, value) => {
    const rep = await tokenCalendars.updateTokenPermissions(tokenId, value);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
    setSelectedModifyCalendar(null);
  };

  // 🔄 Activation/désactivation du lien
  const handleToggleToken = async (tokenId) => {
    const rep = await tokenCalendars.updateRevokeToken(tokenId);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
    setSelectedModifyCalendar(null);
  };

  const deleteTokenConfirmAction = (tokenId) => {
    setAlertType("confirm-danger");
    setAlertMessage(t("delete_link_confirm"));
    setAlertId(tokenId);
    setOnConfirmAction(() => () => handleDeleteToken(tokenId));
  };

  // 🔄 Suppression du lien
  const handleDeleteToken = async (tokenId) => {
    const rep = await tokenCalendars.deleteToken(tokenId);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
    }
    setAlertId(tokenId);
    setSelectedModifyCalendar(null);
  };

  const deleteUserConfirmAction = (calendarId, user) => {
    setAlertType("confirm-danger");
    setAlertMessage(t("delete_access_confirm"));
    setAlertId(user.receiver_uid + "-" + calendarId);
    setOnConfirmAction(() => () => handleDeleteUser(calendarId, user));
  };

  // 🔄 Suppression de l'utilisateur
  const handleDeleteUser = async (calendarId, user) => {
    const rep = await sharedUserCalendars.deleteSharedUser(
      calendarId,
      user.receiver_uid,
    );
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId(user.receiver_uid + "-" + calendarId);
      setTimeout(async () => {
        await setGroupedSharedFunction();
      }, 1000);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId(user.receiver_uid + "-" + calendarId);
    }
  };

  // 📄 Envoi d'une invitation
  const handleSendInvitation = async (calendarId) => {
    const email = emailsToInvite[calendarId];

    const rep = await sharedUserCalendars.sendInvitation(email, calendarId);
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId("addUser-" + calendarId);
      setTimeout(async () => {
        await setGroupedSharedFunction();
      }, 1000);
      setEmailsToInvite((prev) => ({ ...prev, [calendarId]: "" }));
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId("addUser-" + calendarId);
    }
  };

  // 🔄 Création d'un lien de partage
  const handleCreateToken = async (calendarId) => {
    const rep = await tokenCalendars.createToken(
      calendarId,
      expiresAt[calendarId],
      permissions[calendarId],
    );
    if (rep.success) {
      setAlertType("success");
      setAlertMessage("✅ " + rep.message);
      setAlertId("newLink-" + calendarId);
    } else {
      setAlertType("danger");
      setAlertMessage("❌ " + rep.error);
      setAlertId("newLink-" + calendarId);
    }
  };

  // 🔄 Fonction pour mettre à jour les données groupées
  const setGroupedSharedFunction = useCallback(async () => {
    const grouped = {};

    for (const calendar of personalCalendars.calendarsData) {
      grouped[calendar.id] = {
        tokens: [],
        users: [],
        calendar_name: calendar.name,
      };

      const rep = await sharedUserCalendars.fetchSharedUsers(calendar.id);
      if (rep.success) {
        grouped[calendar.id].users = rep.users;
      }
    }

    for (const token of tokenCalendars.tokensList) {
      if (grouped[token.calendar_id]) {
        grouped[token.calendar_id].tokens.push(token);
      }
    }

    setGroupedShared(grouped);
    setLoadingGroupedShared(false);
  }, [
    personalCalendars.calendarsData,
    sharedUserCalendars,
    tokenCalendars.tokensList,
  ]);

  // 🔄 Chargement des données groupées
  useEffect(() => {
    if (userInfo && personalCalendars.calendarsData) {
      setGroupedSharedFunction();
    }
  }, [
    userInfo,
    personalCalendars.calendarsData,
    tokenCalendars.tokensList,
    setGroupedSharedFunction,
  ]);

  // 🔄 Initialisation des permissions et des dates d'expiration
  useEffect(() => {
    if (userInfo && personalCalendars.calendarsData) {
      for (const calendar of personalCalendars.calendarsData) {
        setPermissions((prev) => ({ ...prev, [calendar.id]: "read" }));
        setExpiresAt((prev) => ({ ...prev, [calendar.id]: null }));
        setExpirationType((prev) => ({ ...prev, [calendar.id]: "never" }));
      }
    }
  }, [userInfo, personalCalendars.calendarsData]);

  if (loadingGroupedShared) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t("loading_calendars")}</span>
        </div>
      </div>
    );
  }

  if (
    personalCalendars.calendarsData &&
    personalCalendars.calendarsData.length === 0
  ) {
    return (
      <div className="container mt-4 text-center">
        <h3 className="text-muted">{t("no_calendar_found")}</h3>
        <p className="text-muted">{t("no_calendar_found_cta")}</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold">
        <i className="bi bi-people-fill me-2"></i>
        {t("shared_calendar_management")}
      </h2>

      <div className="row g-4">
        {Object.entries(groupedShared).map(([calendarId, data]) => (
          <div key={calendarId} className="col-12 col-md-6">
            <div className="card h-100 shadow-sm border border-2">
              <div className="card-body position-relative">
                {/* Nom du calendrier */}
                <h5 className="card-title mb-3 d-flex justify-content-between align-items-center">
                  <span>{data.calendar_name}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm rounded-circle"
                    onClick={() =>
                      setSelectedModifyCalendar(
                        selectedModifyCalendar === calendarId
                          ? null
                          : calendarId,
                      )
                    }
                    aria-label={t("manage_link")}
                    title={t("manage_link")}
                  >
                    <i
                      className={`bi ${selectedModifyCalendar === calendarId ? "bi-x-lg" : "bi-pencil"}`}
                    ></i>
                  </button>
                </h5>

                <hr className="my-3" />

                {/* Liens de partage */}
                <TokenList
                  alertId={alertId}
                  alertType={alertType}
                  alertMessage={alertMessage}
                  onConfirmAction={onConfirmAction}
                  setAlertMessage={setAlertMessage}
                  setOnConfirmAction={setOnConfirmAction}
                  setAlertId={setAlertId}
                  handleCopyLink={handleCopyLink}
                  handleUpdateTokenExpiration={handleUpdateTokenExpiration}
                  handleUpdateTokenPermissions={handleUpdateTokenPermissions}
                  handleToggleToken={handleToggleToken}
                  deleteTokenConfirmAction={deleteTokenConfirmAction}
                  handleCreateToken={handleCreateToken}
                  expirationType={expirationType}
                  setExpirationType={setExpirationType}
                  expiresAt={expiresAt}
                  setExpiresAt={setExpiresAt}
                  permissions={permissions}
                  setPermissions={setPermissions}
                  today={today}
                  VITE_URL={VITE_URL}
                  data={data}
                  calendarId={calendarId}
                  setSelectedModifyCalendar={setSelectedModifyCalendar}
                  selectedModifyCalendar={selectedModifyCalendar}
                />

                <hr className="my-3" />

                {/* Utilisateurs partagés */}
                <UserList
                  alertId={alertId}
                  alertType={alertType}
                  alertMessage={alertMessage}
                  onConfirmAction={onConfirmAction}
                  setAlertMessage={setAlertMessage}
                  setOnConfirmAction={setOnConfirmAction}
                  setAlertId={setAlertId}
                  handleSendInvitation={handleSendInvitation}
                  deleteUserConfirmAction={deleteUserConfirmAction}
                  data={data}
                  calendarId={calendarId}
                  emailsToInvite={emailsToInvite}
                  setEmailsToInvite={setEmailsToInvite}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenList({
  alertId,
  alertType,
  alertMessage,
  onConfirmAction,
  setAlertMessage,
  setOnConfirmAction,
  setAlertId,
  handleCopyLink,
  handleUpdateTokenExpiration,
  handleUpdateTokenPermissions,
  handleToggleToken,
  deleteTokenConfirmAction,
  handleCreateToken,
  expirationType,
  setExpirationType,
  expiresAt,
  setExpiresAt,
  permissions,
  setPermissions,
  today,
  VITE_URL,
  data,
  calendarId,
  selectedModifyCalendar,
  setSelectedModifyCalendar,
}) {
  return (
    <ul className="list-group">
      <h6 className="">{t("public_links")}:</h6>
      {(data.tokens || []).map((token) => (
        <div key={token.id}>
          {/* Alert */}
          {alertId === token.id && (
            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => {
                setAlertMessage("");
                setOnConfirmAction(null);
                setAlertId(null);
              }}
              onConfirm={async () => {
                if (onConfirmAction) await onConfirmAction();
              }}
            />
          )}

          {/* TODO: racourcir le lien */}
          {/* Lien */}
          <div className="input-group col-md-6 mb-2">
            <input
              id={"tokenLink" + token.id}
              type="text"
              className={`form-control border-2 border-${token.revoked ? "danger" : "success"}`}
              aria-label={t("shared_link_label")}
              title={t("shared_link_label")}
              value={`${VITE_URL}/shared-token-calendar/${token.id}`}
              readOnly
            />
            <button
              className={`btn btn-outline-${token.revoked ? "danger" : "success"}`}
              onClick={() => handleCopyLink(token)}
              aria-label={t("copy_link")}
              title={t("copy_link")}
              disabled={token.revoked}
            >
              <i className="bi bi-clipboard"></i>
            </button>
          </div>

          {selectedModifyCalendar === calendarId && (
            <li className="list-group-item py-3 px-3">
              <div className="row align-items-center gy-3 gx-4">
                {/* Colonne 1 : Switch */}
                <div className="col-auto d-flex align-items-center gap-2">
                  <label
                    htmlFor={`switchToken-${token.id}`}
                    className="form-label mb-0 fw-semibold"
                  >
                    {t("activation")}:
                  </label>
                  <div className="form-check form-switch m-0">
                    <input
                      className={`form-check-input ${token.revoked ? "" : "bg-success"}`}
                      type="checkbox"
                      role="switch"
                      id={`switchToken-${token.id}`}
                      checked={!token.revoked}
                      onChange={() => handleToggleToken(token.id)}
                      aria-label={t("activation_toggle_aria")}
                      title={
                        token.revoked ? t("reactivate_link") : t("revoke_link")
                      }
                    />
                  </div>
                </div>

                {/* Colonne 2 : Expiration */}
                <div className="col-auto d-flex align-items-center flex-wrap gap-2">
                  <label
                    htmlFor={`tokenExpiration${token.id}`}
                    className="form-label mb-0 fw-semibold"
                  >
                    {t("expiration")}:
                  </label>
                  <select
                    id={`tokenExpiration${token.id}`}
                    className="form-select w-auto"
                    value={token.expires_at === null ? "" : "date"}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleUpdateTokenExpiration(
                        token.id,
                        value === "" ? null : today,
                      );
                    }}
                  >
                    <option value="">{t("never")}</option>
                    <option value="date">{t("date")}</option>
                  </select>
                  {token.expires_at && (
                    <input
                      type="date"
                      className="form-control w-auto"
                      style={{ minWidth: "130px" }}
                      value={formatToLocalISODate(token.expires_at)}
                      onChange={(e) =>
                        handleUpdateTokenExpiration(
                          token.id,
                          formatToLocalISODate(e.target.value),
                        )
                      }
                      min={formatToLocalISODate(today)}
                    />
                  )}
                </div>

                {/* Colonne 3 : Permissions */}
                <div className="col-auto d-flex align-items-center gap-2">
                  <label
                    htmlFor={`tokenPermissions${token.id}`}
                    className="form-label mb-0 fw-semibold"
                  >
                    {t("access")}:
                  </label>
                  <select
                    id={`tokenPermissions${token.id}`}
                    className="form-select w-auto"
                    value={token.permissions}
                    onChange={(e) =>
                      handleUpdateTokenPermissions(token.id, e.target.value)
                    }
                  >
                    <option value="read">{t("read_only")}</option>
                    <option value="edit">{t("read_write")}</option>
                  </select>
                </div>

                {/* Colonne 4 : Supprimer */}
                <div className="col-auto d-flex justify-content-end">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => deleteTokenConfirmAction(token.id)}
                    aria-label={t("delete_link")}
                    title={t("delete_link")}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </li>
          )}
        </div>
      ))}

      {/* Ajouter un nouveau lien de partage */}
      {data.tokens.length === 0 && (
        <div>
          {/* Alert */}
          {alertId === "newLink-" + calendarId && (
            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => {
                setAlertMessage("");
                setOnConfirmAction(null);
                setAlertId(null);
              }}
              onConfirm={async () => {
                if (onConfirmAction) await onConfirmAction();
              }}
            />
          )}
          <button
            className="btn btn-outline-dark w-100"
            onClick={() => handleCreateToken(calendarId)}
            aria-label={t("create_share_link")}
            title={t("create_share_link")}
          >
            <i className="bi bi-plus-lg me-2"></i>
            {t("create_share_link")}
          </button>
        </div>
      )}
    </ul>
  );
}

function UserList({
  alertId,
  alertType,
  alertMessage,
  onConfirmAction,
  setAlertMessage,
  setOnConfirmAction,
  setAlertId,
  handleSendInvitation,
  deleteUserConfirmAction,
  data,
  calendarId,
  emailsToInvite,
  setEmailsToInvite,
}) {
  return (
    <ul className="list-group">
      <h6>{t("shared_users")}:</h6>
      {(data.users || []).map((user) => (
        <div key={user.receiver_uid + "-" + calendarId}>
          {alertId === user.receiver_uid + "-" + calendarId && (
            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => {
                setAlertMessage("");
                setOnConfirmAction(null);
                setAlertId(null);
              }}
              onConfirm={() => {
                if (onConfirmAction) onConfirmAction();
              }}
            />
          )}
          <li
            key={user.receiver_uid + "-" + calendarId}
            className="list-group-item"
          >
            <div className="row align-items-center">
              <div className="col-md-12 d-flex align-items-center">
                <div className="col-6">
                  <HoveredUserProfile
                    user={{
                      photo_url: user.receiver_photo_url,
                      display_name: user.receiver_name,
                      email: user.receiver_email,
                    }}
                    trigger={
                      <div className="d-flex align-items-center gap-2">
                        <div>
                          <img
                            src={user.receiver_photo_url}
                            alt={t("profile")}
                            className="rounded-circle"
                            style={{ width: "40px", height: "40px" }}
                          />
                        </div>

                        <div>
                          <strong>{user.receiver_name}</strong>
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* Statut */}
                <div className="col-4 d-flex align-items-center justify-content-center">
                  <span
                    className={`badge rounded-pill ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}
                  >
                    {user.accepted ? t("accepted") : t("pending")}
                  </span>
                </div>

                {/* Supprimer */}
                <div className="col-2">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => deleteUserConfirmAction(calendarId, user)}
                    aria-label={t("delete_access")}
                    title={t("delete_access")}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </div>
      ))}

      {/* Ajouter un utilisateur */}
      <div>
        {/* Alert */}
        {alertId === "addUser-" + calendarId && (
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => {
              setAlertMessage("");
              setOnConfirmAction(null);
              setAlertId(null);
            }}
            onConfirm={() => {
              if (onConfirmAction) onConfirmAction();
            }}
          />
        )}

        <div className="row align-items-center mt-2">
          <div className="col-md-12">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendInvitation(calendarId);
              }}
            >
              <div className="input-group ">
                <input
                  id={"emailToInvite" + calendarId}
                  type="email"
                  className={`form-control`}
                  placeholder={t("recipient_email")}
                  aria-label={t("recipient_email")}
                  onChange={(e) =>
                    setEmailsToInvite((prev) => ({
                      ...prev,
                      [calendarId]: e.target.value,
                    }))
                  }
                  value={emailsToInvite[calendarId] ?? ""}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendInvitation(calendarId);
                    }
                  }}
                />
                <button
                  className={`btn btn-primary`}
                  aria-label={t("send_invitation")}
                  title={t("send_invitation")}
                  type="submit"
                >
                  <i className="bi bi-envelope-paper"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ul>
  );
}

export default SharedList;
