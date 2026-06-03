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
    if (!user) { navigate("/"); return; }
    fetchEnfants();
  }, [nom, user]);

  const fetchEnfants = async () => {
    try {
      const res = await axios.get("/api/enfants?nomCreche=" + nom, { withCredentials: true });
      const sorted = [...res.data].sort((a, b) => a.nom.localeCompare(b.nom));
      setEnfants(sorted);
    } catch (err) {
      console.error("Erreur chargement enfants", err);
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
      alert(err.response?.data || "Erreur lors de la création de l'enfant.");
    }
  };

  return (
    <div className="page-container">
      <div className="header-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Retour</button>
        <h1>Crèche : {nom}</h1>
      </div>

      <div className="card">
        <div className="panel-header" onClick={() => setShowAddEnfant(!showAddEnfant)}>
          <span>Ajouter un enfant</span>
          <span>{showAddEnfant ? "▲" : "▼"}</span>
        </div>
        {showAddEnfant && (
          <div className="panel-body">
            <input className="form-input" placeholder="Nom" value={newEnfant.nom} onChange={e => setNewEnfant({ ...newEnfant, nom: e.target.value })} />
            <input className="form-input" placeholder="Prénom" value={newEnfant.prenom} onChange={e => setNewEnfant({ ...newEnfant, prenom: e.target.value })} />
            <input className="form-input" type="date" value={newEnfant.dateDeNaissance} onChange={e => setNewEnfant({ ...newEnfant, dateDeNaissance: e.target.value })} />
            <button className="btn btn-primary" onClick={handleAddEnfant}>Ajouter</button>
          </div>
        )}
      </div>

      <h2>Enfants</h2>
      {enfants.length === 0 && <p className="text-secondary">Aucun enfant dans cette crèche.</p>}
      <div className="list-group">
        {enfants.map((enfant) => (
          <div
            key={enfant.id}
            className="list-item"
            onClick={() => navigate("/enfant/" + enfant.id)}
          >
            <span>{enfant.nom} {enfant.prenom}</span>
            <span className="text-secondary">Né(e) le {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Creche;