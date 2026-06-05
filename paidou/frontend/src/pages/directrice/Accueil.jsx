import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";

const Accueil = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();
  const [creches, setCreches] = useState([]);
  const [enfantsByCreche, setEnfantsByCreche] = useState({});
  const [vaccins, setVaccins] = useState([]);
  const [showVaccins, setShowVaccins] = useState(false);
  const [selectedVaccinInfo, setSelectedVaccinInfo] = useState("");
  const [loading, setLoading] = useState(true);

  useRedirectByRole(["directrice"]);
  useEffect(() => {
    if (!effectiveUser) return;
    fetchData();
  }, [effectiveUser]);

  const fetchData = async () => {
    try {
      const crechesRes = await axios.get("/api/creches/mes-creches", { withCredentials: true });
      const crechesData = crechesRes.data;
      setCreches(crechesData);
      const enfantsMap = {};
      for (const creche of crechesData) {
        const statutsRes = await axios.get("/api/enfants/statuts-vaccinaux?nomCreche=" + creche.nom, { withCredentials: true });
        enfantsMap[creche.nom] = statutsRes.data;
      }
      setEnfantsByCreche(enfantsMap);
      const vaccinsRes = await axios.get("/api/vaccins", { withCredentials: true });
      setVaccins(vaccinsRes.data);
    } catch (err) {
      console.error("Erreur chargement accueil", err);
    } finally {
      setLoading(false);
    }
  };

  const couleurStatut = (statut) => {
    switch (statut) {
      case "RETARD": return { bg: "var(--danger-bg)", border: "var(--danger)", point: "var(--danger-point)" };
      case "PROCHE": return { bg: "var(--warning-bg)", border: "var(--warning)", point: "var(--warning-point)" };
      case "EN_COURS": return { bg: "var(--info-bg)", border: "var(--info)", point: "var(--info-point)" };
      case "COMPLET": return { bg: "var(--success-bg)", border: "var(--success)", point: "var(--success-point)" };
      default: return { bg: "var(--gray-100)", border: "var(--gray-400)", point: "var(--gray-500)" };
    }
  };

  if (loading) return <p className="text-secondary">Chargement...</p>;
  if (!effectiveUser) return <p className="text-secondary">Chargement...</p>;

  return (
    <div className="page-container">
      <div className="header-actions">
        <h1>Accueil — {effectiveUser.prenom}</h1>
        <button className="btn btn-primary" onClick={() => navigate("/ajout-enregistrement")}>
          ➕ Ajouter un enregistrement
        </button>
      </div>

      <div className="creches-grid">
        {creches.map((creche) => {
          const enfants = enfantsByCreche[creche.nom] || [];
          return (
            <div key={creche.nom} className="card creche-card">
              <div className="creche-header">
                <h2>{creche.nom}</h2>
                <span className="badge">{enfants.length} enfant{enfants.length > 1 ? "s" : ""}</span>
              </div>
              <button className="btn btn-secondary" onClick={() => navigate("/creche/" + creche.nom)}>
                Voir ma crèche
              </button>

              {enfants.length === 0 && <p className="text-secondary">Aucun enfant</p>}

              {enfants.map((enfant) => {
                const colors = couleurStatut(enfant.statut);
                const ageEnMois = Math.floor((new Date() - new Date(enfant.dateDeNaissance)) / (1000 * 60 * 60 * 24 * 30.4375));
                const annees = Math.floor(ageEnMois / 12);
                const mois = ageEnMois % 12;

                return (
                  <div
                    key={enfant.id}
                    onClick={() => navigate("/enfant/" + enfant.id)}
                    className="enfant-card"
                    style={{
                      borderLeft: `4px solid ${colors.point}`,
                      background: colors.bg,
                    }}
                  >
                    <div className="enfant-header">
                      <strong>{enfant.prenom} {enfant.nom}</strong>
                      <span className="badge badge-statut" style={{ background: colors.point }}>
                        {enfant.statut === "RETARD" ? "En retard" :
                         enfant.statut === "PROCHE" ? "Dû bientôt" :
                         enfant.statut === "EN_COURS" ? "À jour" : "Complet"}
                      </span>
                    </div>
                    <small className="text-secondary">
                      Né le {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")} ({annees} an{annees > 1 ? "s" : ""} {mois} mois)
                    </small>
                    {enfant.nomVaccin && enfant.statut !== "COMPLET" && (
                      <p className="enfant-echeance">
                        Prochaine prise : <strong>{enfant.nomVaccin}</strong>
                        {enfant.statut === "RETARD" && (
                          <span> — prévue le {new Date(enfant.datePrevue).toLocaleDateString("fr-FR")} (retard de {enfant.jours} jour{enfant.jours > 1 ? "s" : ""})</span>
                        )}
                        {enfant.statut === "PROCHE" && (
                          <span> — prévue le {new Date(enfant.datePrevue).toLocaleDateString("fr-FR")} (dans {enfant.jours} jour{enfant.jours > 1 ? "s" : ""})</span>
                        )}
                        {enfant.statut === "EN_COURS" && (
                          <span> — prévue le {new Date(enfant.datePrevue).toLocaleDateString("fr-FR")} (dans {enfant.jours} jour{enfant.jours > 1 ? "s" : ""})</span>
                        )}
                      </p>
                    )}
                    {enfant.statut === "COMPLET" && (
                      <p className="enfant-complet">✅ Toutes les injections ont été prises !</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Référentiel vaccinal */}
      <div className="card referentiel">
        <div className="panel-header" onClick={() => setShowVaccins(!showVaccins)}>
          <span>Référentiel vaccinal</span>
          <span>{showVaccins ? "▲" : "▼"}</span>
        </div>
        {showVaccins && (
          <div className="panel-body">
            <select className="form-select" value={selectedVaccinInfo} onChange={e => setSelectedVaccinInfo(e.target.value)}>
              <option value="">-- Choisir un vaccin --</option>
              {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
            {selectedVaccinInfo && (() => {
              const v = vaccins.find(x => x.id === parseInt(selectedVaccinInfo));
              if (!v) return null;
              const delai2 = v.nbMoisDeuxiemeDelai ? `la dernière ${v.nbMoisDeuxiemeDelai} mois plus tard` : "il n'y a pas de troisième dose";
              const conditions = [];
              if (v.pourEnfantsNesAvant) conditions.push(`Concerne les enfants nés avant ${v.pourEnfantsNesAvant}.`);
              if (v.pourEnfantsNesApres) conditions.push(`Concerne les enfants nés après ${v.pourEnfantsNesApres}.`);
              return (
                <div style={{ marginTop: 10 }}>
                  {v.estObsolete && <span className="badge badge-danger">⚠ Obsolète</span>}
                  <p><strong>{v.nom}</strong> est injecté contre : {v.maladiesPrevenues}.</p>
                  <p>La première prise est à {v.agePremiereVaccination} mois, la seconde {v.nbMoisPremierDelai} mois plus tard, et {delai2}.</p>
                  {conditions.length > 0 && <p>{conditions.join(" ")}</p>}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accueil;