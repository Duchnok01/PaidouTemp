import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AjoutEnregistrement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [creches, setCreches] = useState([]);
  const [enfants, setEnfants] = useState([]);
  const [vaccins, setVaccins] = useState([]);

  const [selectedCreche, setSelectedCreche] = useState("");
  const [selectedEnfant, setSelectedEnfant] = useState("");
  const [selectedVaccin, setSelectedVaccin] = useState("");
  const [dateVaccination, setDateVaccination] = useState("");

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetchCreches();
  }, [user]);

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches/mes-creches", { withCredentials: true });
      setCreches(res.data);
      const params = new URLSearchParams(location.search);
      const crecheParam = params.get("creche");
      const enfantParam = params.get("enfant");
      if (crecheParam) {
        setSelectedCreche(crecheParam);
        fetchEnfants(crecheParam);
        if (enfantParam) setSelectedEnfant(enfantParam);
      }
    } catch (err) {
      console.error("Erreur chargement creches", err);
    }
  };

  const fetchEnfants = async (nomCreche) => {
    try {
      const res = await axios.get("/api/enfants?nomCreche=" + nomCreche, { withCredentials: true });
      setEnfants(res.data);
    } catch (err) {
      console.error("Erreur chargement enfants", err);
    }
  };

  const fetchVaccins = async (idEnfant) => {
    try {
      const url = idEnfant ? `/api/vaccins/pour-enfant/${idEnfant}` : "/api/vaccins";
      const res = await axios.get(url, { withCredentials: true });
      setVaccins(res.data);
    } catch (err) {
      console.error("Erreur chargement vaccins", err);
    }
  };

  const handleCrecheChange = (nomCreche) => {
    setSelectedCreche(nomCreche);
    setSelectedEnfant("");
    setSelectedVaccin("");
    setVaccins([]);
    if (nomCreche) fetchEnfants(nomCreche);
  };

  const handleEnfantChange = (idEnfant) => {
    setSelectedEnfant(idEnfant);
    setSelectedVaccin("");
    if (idEnfant) fetchVaccins(idEnfant);
  };

  const handleSubmit = async () => {
    if (!selectedCreche || !selectedEnfant || !selectedVaccin || !dateVaccination) {
      alert("Tous les champs sont obligatoires");
      return;
    }
    try {
      await axios.post("/api/enregistrements-vaccination", {
        idEnfant: parseInt(selectedEnfant),
        idVaccin: parseInt(selectedVaccin),
        dateVaccination: dateVaccination,
        nomCreche: selectedCreche,
        idUser: user.id,
      }, { withCredentials: true });
      alert("Enregistrement ajouté !");
      navigate("/accueil");
    } catch (err) {
      const message = err.response?.data || "Erreur lors de l'ajout dans la base de données.";
      alert(message);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h1>Ajouter un enregistrement</h1>

      <div style={{ marginBottom: "15px" }}>
        <label>Crèche :</label>
        <select value={selectedCreche} onChange={(e) => handleCrecheChange(e.target.value)}>
          <option value="">-- Choisir --</option>
          {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Enfant :</label>
        <select value={selectedEnfant} onChange={(e) => handleEnfantChange(e.target.value)} disabled={!selectedCreche}>
          <option value="">-- Choisir --</option>
          {enfants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Vaccin :</label>
        <select value={selectedVaccin} onChange={(e) => setSelectedVaccin(e.target.value)} disabled={!selectedEnfant}>
          <option value="">-- Choisir --</option>
          {vaccins.map(v => (
            <option key={v.id} value={v.id} disabled={v.complet}>
              {v.nom} {v.complet ? `(complet ${v.dosesRecues}/${v.dosesRequises})` : `(${v.dosesRecues}/${v.dosesRequises})`}
            </option>
          ))}
        </select>
        {selectedEnfant && vaccins.length > 0 && vaccins.every(v => v.complet) && (
          <p style={{ color: "green", marginTop: "5px" }}>
            ✅ Tous les vaccins sont à jour pour cet enfant. Vous pouvez modifier un enregistrement existant depuis la fiche enfant.
          </p>
        )}
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Date de vaccination :</label>
        <input type="date" value={dateVaccination} onChange={(e) => setDateVaccination(e.target.value)} />
      </div>

      <button onClick={handleSubmit} style={{ padding: "10px 20px" }}>✅ Enregistrer</button>
    </div>
  );
};

export default AjoutEnregistrement;