import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Creche = () => {
  const { nom } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enfants, setEnfants] = useState([]);
  const [showAddEnfant, setShowAddEnfant] = useState(false);
  const [newEnfant, setNewEnfant] = useState({ nom: "", prenom: "", dateDeNaissance: "" });

  useEffect(() => {
    if (!user) {
        navigate("/");
        return;
    }
    fetchEnfants();
}, [nom, user]);

  const fetchEnfants = async () => {
    try {
      const res = await axios.get("/api/enfants?nomCreche=" + nom, {
        withCredentials: true,
      });
      const sorted = [...res.data].sort((a, b) => a.nom.localeCompare(b.nom));
      setEnfants(sorted);
    } catch (err) {
      console.error("Erreur chargement enfants", err);
      const message = err.response?.data || "Erreur lors du chargement des enfants.";
      alert(message);
    }
  };

  const handleAddEnfant = async () => {
    if (!newEnfant.nom || !newEnfant.prenom || !newEnfant.dateDeNaissance) {
      alert("Tous les champs sont obligatoires");
      return;
    }
    try {
      await axios.post("/api/enfants", {
        nom: newEnfant.nom,
        prenom: newEnfant.prenom,
        dateDeNaissance: newEnfant.dateDeNaissance,
        nomCreche: nom,
      }, { withCredentials: true });
      setNewEnfant({ nom: "", prenom: "", dateDeNaissance: "" });
      setShowAddEnfant(false);
      fetchEnfants();
    } catch (err) {
      console.error("Erreur ajout enfant", err);
      const message = err.response?.data || "Erreur lors de la creation de l'enfant.";
      alert(message);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h1>Crèche : {nom}</h1>
      <button onClick={() => navigate("/accueil")}>← Retour</button>

      {/* Ajouter un enfant */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle} onClick={() => setShowAddEnfant(!showAddEnfant)}>
          <span>Ajouter un enfant</span>
          <span>{showAddEnfant ? "▲" : "▼"}</span>
        </div>
        {showAddEnfant && (
          <div style={panelBodyStyle}>
            <input
              placeholder="Nom"
              value={newEnfant.nom}
              onChange={(e) => setNewEnfant({ ...newEnfant, nom: e.target.value })}
            />
            <input
              placeholder="Prénom"
              value={newEnfant.prenom}
              onChange={(e) => setNewEnfant({ ...newEnfant, prenom: e.target.value })}
            />
            <input
              type="date"
              value={newEnfant.dateDeNaissance}
              onChange={(e) => setNewEnfant({ ...newEnfant, dateDeNaissance: e.target.value })}
            />
            <button onClick={handleAddEnfant}>Ajouter</button>
          </div>
        )}
      </div>

      {/* Liste des enfants */}
      <h2>Enfants</h2>
      {enfants.length === 0 && <p>Aucun enfant dans cette crèche.</p>}
      <ul>
        {enfants.map((enfant) => (
          <li
            key={enfant.id}
            onClick={() => navigate("/enfant/" + enfant.id)}
            style={{
              cursor: "pointer",
              padding: "8px",
              margin: "5px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            {enfant.nom} {enfant.prenom} — Né(e) le{" "}
            {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")}
          </li>
        ))}
      </ul>
    </div>
  );
};

const panelStyle = {
  border: "1px solid #ccc",
  borderRadius: "5px",
  marginBottom: "10px",
  marginTop: "15px",
};

const panelHeaderStyle = {
  background: "#f0f0f0",
  padding: "10px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "bold",
};

const panelBodyStyle = {
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export default Creche;