import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Accueil = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creches, setCreches] = useState([]);
  const [enfantsByCreche, setEnfantsByCreche] = useState({});
  const [vaccins, setVaccins] = useState([]);
  const [showVaccins, setShowVaccins] = useState(false);
  const [selectedVaccinInfo, setSelectedVaccinInfo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const crechesRes = await axios.get("/api/creches/mes-creches", { withCredentials: true });
      const crechesData = crechesRes.data;
      setCreches(crechesData);
      const enfantsMap = {};
      for (const creche of crechesData) {
        const statutsRes = await axios.get("/api/enfants/statuts-vaccinaux?nomCreche=" + creche.nom, { withCredentials: true });
        enfantsMap[creche.nom] = statutsRes.data; // déjà trié par le backend
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
      case "RETARD": return "#ffcccc";
      case "PROCHE": return "#fff0b3";
      case "EN_COURS": return "#d9edf7";
      case "COMPLET": return "#d4edda";
      default: return "#eee";
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "1000px", margin: "auto", padding: "20px" }}>
      <h1>Accueil — {user.prenom}</h1>
      <button onClick={() => navigate("/ajout-enregistrement")} style={{ padding: "12px 24px", fontSize: "16px", marginBottom: "20px", cursor: "pointer" }}>
        ➕ Ajouter un enregistrement
      </button>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {creches.map((creche) => {
          const enfants = enfantsByCreche[creche.nom] || [];
          return (
            <div key={creche.nom} style={{ flex: "1", minWidth: "280px", border: "1px solid #ddd", borderRadius: "8px", padding: "15px" }}>
              <h2>{creche.nom} ({enfants.length} enfant{enfants.length > 1 ? "s" : ""})</h2>
              <button onClick={() => navigate("/creche/" + creche.nom)}>Voir ma crèche</button>
              {enfants.length === 0 && <p>Aucun enfant</p>}
              {enfants.map((enfant) => {
                const ageEnMois = Math.floor((new Date() - new Date(enfant.dateDeNaissance)) / (1000 * 60 * 60 * 24 * 30.4375));
                const annees = Math.floor(ageEnMois / 12);
                const mois = ageEnMois % 12;
                return (
                  <div
                    key={enfant.id}
                    onClick={() => navigate("/enfant/" + enfant.id)}
                    style={{
                      padding: "8px", margin: "5px 0", borderRadius: "5px",
                      background: couleurStatut(enfant.statut),
                      cursor: "pointer", display: "flex", flexDirection: "column"
                    }}
                  >
                    <strong>{enfant.prenom} {enfant.nom}</strong>
                    <small>Né le {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")} ({annees} an{annees > 1 ? "s" : ""} {mois} mois)</small>
                    {enfant.nomVaccin && (
                      <span>
                        Prochaine prise : <strong>{enfant.nomVaccin}</strong>
                        {enfant.statut === "RETARD" && ` prévue le ${new Date(enfant.datePrevue).toLocaleDateString("fr-FR")} (retard de ${enfant.jours} jour${enfant.jours > 1 ? "s" : ""})`}
                        {enfant.statut === "PROCHE" && ` prévue le ${new Date(enfant.datePrevue).toLocaleDateString("fr-FR")} (dans ${enfant.jours} jour${enfant.jours > 1 ? "s" : ""})`}
                        {(enfant.statut === "EN_COURS" || enfant.statut === "COMPLET") && ` complète`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Référentiel vaccinal */}
      <div style={{ marginTop: "30px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <div onClick={() => setShowVaccins(!showVaccins)} style={{ background: "#f0f0f0", padding: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span>Référentiel vaccinal</span><span>{showVaccins ? "▲" : "▼"}</span>
        </div>
        {showVaccins && (
          <div style={{ padding: "10px" }}>
            <select value={selectedVaccinInfo} onChange={e => setSelectedVaccinInfo(e.target.value)}>
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
                  {v.estObsolete && <span style={{ color: "red", fontWeight: "bold" }}>⚠ Ce vaccin est obsolète ! </span>}
                  <strong>{v.nom}</strong> est injecté contre : {v.maladiesPrevenues}.<br/>
                  La première prise est à {v.agePremiereVaccination} mois, la seconde {v.nbMoisPremierDelai} mois plus tard, et {delai2}.<br/>
                  {conditions.join(" ")}
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