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
    if (!user) {
      navigate("/");
      return;
    }
    fetchCreches();
    fetchVaccins();
  }, []);

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches/mes-creches", {
        withCredentials: true,
      });
      setCreches(res.data);
      // Préremplir si venu depuis une crèche spécifique
      const params = new URLSearchParams(location.search);
      const crecheParam = params.get("creche");
      if (crecheParam) setSelectedCreche(crecheParam);
    } catch (err) {
      console.error("Erreur lors de la recherche de creche", err);
      const message = err.response?.data || "Erreur lors de la recherche de creche";
      alert(message);
    }
  };

  const fetchEnfants = async (nomCreche) => {
    try {
      const res = await axios.get("/api/enfants?nomCreche=" + nomCreche, {
        withCredentials: true,
      });
      setEnfants(res.data);
    } catch (err) {
      console.error("Erreur lors de la recherche de l'enfant", err);
      const message = err.response?.data || "Erreur lors de la recherche de l'enfant.";
      alert(message);
    }
  };

  const fetchVaccins = async () => {
    try {
      const res = await axios.get("/api/vaccins", {
        withCredentials: true,
      });
      setVaccins(res.data);
    } catch (err) {
      console.error("Erreur chargement vaccins", err);
      const message = err.response?.data || "Erreur lors de la recherche du vaccin.";
      alert(message);
    }
  };

  const handleCrecheChange = (nomCreche) => {
    setSelectedCreche(nomCreche);
    setSelectedEnfant("");
    if (nomCreche) fetchEnfants(nomCreche);
  };

  const handleSubmit = async () => {
    if (!selectedCreche || !selectedEnfant || !selectedVaccin || !dateVaccination) {
      alert("Tous les champs sont obligatoires");
      return;
    }
    try {
      await axios.post(
        "/api/enregistrements-vaccination",
        {
          idEnfant: parseInt(selectedEnfant),
          idVaccin: parseInt(selectedVaccin),
          dateVaccination: dateVaccination,
          nomCreche: selectedCreche,
          idUser: user.id, // temporaire : l'admin a l'id 1
        },
        { withCredentials: true }
      );
      alert("Enregistrement ajouté !");
      navigate("/accueil");
    } catch (err) 
    {
      console.error("Erreur ajout enregistrement", err);
      const message = err.response?.data || "Erreur lors de l'ajout dans la base de donnees.";
      alert(message);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h1>Ajouter un enregistrement</h1>

      <div style={{ marginBottom: "15px" }}>
        <label>Crèche :</label>
        <select
          value={selectedCreche}
          onChange={(e) => handleCrecheChange(e.target.value)}
        >
          <option value="">-- Choisir --</option>
          {creches.map((c) => (
            <option key={c.nom} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Enfant :</label>
        <select
          value={selectedEnfant}
          onChange={(e) => setSelectedEnfant(e.target.value)}
          disabled={!selectedCreche}
        >
          <option value="">-- Choisir --</option>
          {enfants.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Vaccin :</label>
        <select
          value={selectedVaccin}
          onChange={(e) => setSelectedVaccin(e.target.value)}
        >
          <option value="">-- Choisir --</option>
          {vaccins.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nom}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Date de vaccination :</label>
        <input
          type="date"
          value={dateVaccination}
          onChange={(e) => setDateVaccination(e.target.value)}
        />
      </div>

      <button onClick={handleSubmit} style={{ padding: "10px 20px" }}>
        ✅ Enregistrer
      </button>
    </div>
  );
};

export default AjoutEnregistrement;