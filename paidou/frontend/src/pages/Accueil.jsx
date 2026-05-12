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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const crechesRes = await axios.get("/api/creches/mes-creches", {
        withCredentials: true,
      });
      const crechesData = crechesRes.data;
      setCreches(crechesData);

      // Pour chaque crèche, récupérer ses enfants
      const enfantsMap = {};
      for (const creche of crechesData) {
        const enfantsRes = await axios.get(
          "/api/enfants?nomCreche=" + creche.nom,
          { withCredentials: true }
        );
        enfantsMap[creche.nom] = enfantsRes.data;
      }
      setEnfantsByCreche(enfantsMap);

      // Récupérer les vaccins pour le référentiel
      const vaccinsRes = await axios.get("/api/vaccins", {
        withCredentials: true,
      });
      setVaccins(vaccinsRes.data);
    } catch (err) {
      console.error("Erreur chargement accueil", err);
      const message = err.response?.data || "Erreur lors du chargement des infos de la creche.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculer le retard vaccinal d'un enfant
  const calculerRetard = (enfant) => {
    if (!enfant.dateDeNaissance) return null;
    const aujourdhui = new Date();
    const naissance = new Date(enfant.dateDeNaissance);
    const ageEnMois =
      (aujourdhui.getFullYear() - naissance.getFullYear()) * 12 +
      (aujourdhui.getMonth() - naissance.getMonth());

    // Trouver le vaccin le plus urgent pour cet enfant
    let plusUrgent = null;
    for (const vaccin of vaccins) {
      const ageMin = vaccin.agePremiereVaccination;
      if (ageMin && ageEnMois >= ageMin) {
        const retard = ageEnMois - ageMin;
        if (!plusUrgent || retard > plusUrgent.retard) {
          plusUrgent = { vaccin, retard };
        }
      }
    }
    return plusUrgent;
  };

  // Trier les enfants par priorité vaccinale
  const trierEnfants = (enfants) => {
    return [...enfants].sort((a, b) => {
      const retardA = calculerRetard(a);
      const retardB = calculerRetard(b);
      if (!retardA && !retardB) return 0;
      if (!retardA) return 1;
      if (!retardB) return -1;
      return retardB.retard - retardA.retard;
    });
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "1000px", margin: "auto", padding: "20px" }}>
      <h1>Accueil — {user.prenom}</h1>

      <button
        onClick={() => navigate("/ajout-enregistrement")}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        ➕ Ajouter un enregistrement
      </button>

      {/* Colonnes par crèche */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {creches.map((creche) => {
          const enfants = enfantsByCreche[creche.nom] || [];
          const enfantsTries = trierEnfants(enfants);

          return (
            <div
              key={creche.nom}
              style={{
                flex: "1",
                minWidth: "280px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
              }}
            >
              <h2>{creche.nom}</h2>
              <button onClick={() => navigate("/creche/" + creche.nom)}>
                Voir ma crèche
              </button>

              <h3>Enfants</h3>
              {enfantsTries.length === 0 && <p>Aucun enfant</p>}
              {enfantsTries.map((enfant) => {
                const retard = calculerRetard(enfant);
                return (
                  <div
                    key={enfant.id}
                    style={{
                      padding: "8px",
                      margin: "5px 0",
                      borderRadius: "5px",
                      background: retard ? "#ffe0e0" : "#e0ffe0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {enfant.prenom} {enfant.nom}
                    </span>
                    {retard && (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        ⚠ {retard.vaccin.nom} ({retard.retard} mois de retard)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Référentiel vaccinal rétractable */}
      <div style={{ marginTop: "30px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <div
          onClick={() => setShowVaccins(!showVaccins)}
          style={{
            background: "#f0f0f0",
            padding: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Référentiel vaccinal</span>
          <span>{showVaccins ? "▲" : "▼"}</span>
        </div>
        {showVaccins && (
          <div style={{ padding: "10px" }}>
            {vaccins.map((v) => (
              <div key={v.id} style={{ marginBottom: "8px" }}>
                <strong>{v.nom}</strong> — {v.maladiesPrevenues}
                <br />
                <small>
                  Dès {v.agePremiereVaccination} mois
                  {v.nbMoisPremierDelai
                    ? `, rappel à +${v.nbMoisPremierDelai} mois`
                    : ""}
                  {v.nbMoisDeuxiemeDelai
                    ? `, 2ᵉ rappel à +${v.nbMoisDeuxiemeDelai} mois`
                    : ""}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accueil;