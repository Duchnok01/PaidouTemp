import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";

const VueCoordinateur = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [creches, setCreches] = useState([]);
  const [retardsByCreche, setRetardsByCreche] = useState({});
  const [loading, setLoading] = useState(true);


  useRedirectByRole(["coordinateur"]);
  useEffect(() => {
    if (!effectiveUser) return;
    fetchData();
  }, [effectiveUser]);

  const fetchData = async () => {
    try {
      const crechesRes = await axios.get("/api/creches/mes-creches", {
        withCredentials: true,
      });
      const crechesData = crechesRes.data;
      setCreches(crechesData);

      const retardsMap = {};
      for (const c of crechesData) {
        try {
          const statutsRes = await axios.get(
            `/api/enfants/statuts-vaccinaux?nomCreche=${encodeURIComponent(c.nom)}`,
            { withCredentials: true }
          );
          retardsMap[c.nom] = statutsRes.data.filter(
            (e) => e.statut === "RETARD"
          ).length;
        } catch (e) {
          retardsMap[c.nom] = 0;
        }
      }
      setRetardsByCreche(retardsMap);
    } catch (err) {
      console.error("Erreur chargement données coordinatrice", err);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les crèches par directrice
  const groupByDirectrice = () => {
    const map = {};
    creches.forEach((c) => {
      const dir = c.directeurPrenom || "Sans directrice";
      if (!map[dir]) map[dir] = [];
      map[dir].push(c);
    });
    return map;
  };

  const grouped = groupByDirectrice();

  // Statistiques globales
  const totalEnfants = creches.reduce((sum, c) => sum + (c.nbEnfants || 0), 0);
  const totalRetards = Object.values(retardsByCreche).reduce(
    (sum, r) => sum + r,
    0
  );

  if (loading) return <p className="text-secondary">Chargement...</p>;

  return (
    <div className="page-container">
      <div className="header-actions">
        <h1>Tableau de bord — {effectiveUser.prenom}</h1>
      </div>

      {/* Statistiques globales */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="panel-header">
          <span>📊 Vue d'ensemble</span>
        </div>
        <div className="panel-body">
          <p>
            <strong>{totalEnfants}</strong> enfants au total,{" "}
            <strong style={{ color: "var(--danger)" }}>{totalRetards}</strong> en
            retard
          </p>
        </div>
      </div>

      {/* Liste par directrice */}
      {Object.keys(grouped).length === 0 && (
        <p className="text-secondary">Aucune crèche supervisée.</p>
      )}

      {Object.entries(grouped).map(([directrice, crechesList]) => {
        const nbEnfants = crechesList.reduce(
          (sum, c) => sum + (c.nbEnfants || 0),
          0
        );
        const nbRetards = crechesList.reduce(
          (sum, c) => sum + (retardsByCreche[c.nom] || 0),
          0
        );

        return (
          <div key={directrice} className="card" style={{ marginBottom: "1rem" }}>
            <div className="panel-header">
              <span>
                👩‍💼 {directrice} ({crechesList.length} crèche
                {crechesList.length > 1 ? "s" : ""}, {nbEnfants} enfants,{" "}
                <span style={{ color: "var(--danger)" }}>{nbRetards} retards</span>
                )
              </span>
            </div>
            <div className="panel-body">
              {crechesList.map((c) => (
                <div
                  key={c.nom}
                  className="list-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    // Simuler la directrice avant d'aller sur sa crèche ?
                    // Pour l'instant, navigue vers la crèche directement
                    navigate(`/creche/${c.nom}`);
                  }}
                >
                  <span>
                    🏫 {c.nom} ({c.nbEnfants || 0} enfant
                    {(c.nbEnfants || 0) > 1 ? "s" : ""})
                  </span>
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {retardsByCreche[c.nom] || 0} en retard
                    {c.estFerme ? " 🔒 Fermée" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VueCoordinateur;
