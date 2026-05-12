import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Enfant = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enfant, setEnfant] = useState(null);
  const [enregistrements, setEnregistrements] = useState([]);
  const [creches, setCreches] = useState([]);
  const [showEditEv, setShowEditEv] = useState(null); // id de l'enregistrement en cours d'édition
  const [editEvVaccin, setEditEvVaccin] = useState("");
  const [editEvDate, setEditEvDate] = useState("");
  const [vaccins, setVaccins] = useState([]);

  // Panneaux
  const [showModifier, setShowModifier] = useState(false);
  const [showChangerCreche, setShowChangerCreche] = useState(false);

  // Champs modification
  const [editNom, setEditNom] = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [newCrecheNom, setNewCrecheNom] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchEnfant();
    fetchEnregistrements();
    fetchCreches();
  }, [id]);

  useEffect(() => {
    if (showEditEv !== null) {
      axios.get("/api/vaccins", { withCredentials: true })
        .then(res => setVaccins(res.data))
        .catch(err => console.error(err));
    }
  }, [showEditEv]);

  const fetchEnfant = async () => {
    try {
      const res = await axios.get("/api/enfants/" + id, {
        withCredentials: true,
      });
      setEnfant(res.data);
      setEditNom(res.data.nom);
      setEditPrenom(res.data.prenom);
      setEditDate(res.data.dateDeNaissance);
    } catch (err) {
      console.error("Erreur chargement enfant", err);
      alert(err.response?.data || "Erreur lors de la recherche de l'enfant.");
    }
  };

  const fetchEnregistrements = async () => {
    try {
      const res = await axios.get(
        "/api/enregistrements-vaccination?idEnfant=" + id,
        { withCredentials: true }
      );
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.dateVaccination) - new Date(a.dateVaccination)
      );
      setEnregistrements(sorted);
    } catch (err) {
      console.error("Erreur chargement enregistrements", err);
      alert(err.response?.data || "Erreur lors de la recherche des enregistrements.");
    }
  };

  const fetchCreches = async () => {
    try {
      // Admin voit toutes les crèches, directrice voit les siennes
      const url = user.role === "admin" ? "/api/creches" : "/api/creches/mes-creches";
      const res = await axios.get(url, { withCredentials: true });
      setCreches(res.data);
    } catch (err) {
      console.error("Erreur chargement creches", err);
    }
  };

  // ======== MODIFIER L'ENFANT ========
  const handleModifier = async () => {
    try {
      await axios.put("/api/enfants/rectifier", {
        id: parseInt(id),
        nom: editNom,
        prenom: editPrenom,
        dateDeNaissance: editDate,
      }, { withCredentials: true });
      setShowModifier(false);
      fetchEnfant();
    } catch (err) {
      alert(err.response?.data || "Erreur modification");
    }
  };

  // ======== DÉSACTIVER L'ENFANT ========
  const handleDisable = async () => {
    if (!window.confirm("Désactiver cet enfant ? Il n'apparaîtra plus dans les listes.")) return;
    try {
      await axios.put("/api/enfants/disable", {
        id: parseInt(id),
      }, { withCredentials: true });
      navigate("/creche/" + enfant.nomCreche);
    } catch (err) {
      alert(err.response?.data || "Erreur désactivation");
    }
  };

  // ======== CHANGER DE CRÈCHE ========
  const handleChangeCreche = async () => {
      if (!newCrecheNom) {
        alert("Veuillez sélectionner une crèche");
        return;
      }
      try {
        await axios.put("/api/enfants/change-creche", {
          id: parseInt(id),
          nomCreche: newCrecheNom,
        }, { withCredentials: true });
        setShowChangerCreche(false);
        fetchEnfant();
      } catch (err) {
        alert(err.response?.data || "Erreur changement de crèche");
      }
    };


    // Ouvrir le panneau d'édition pour un enregistrement
  const handleOpenEditEv = (ev) => {
    setShowEditEv(ev.idVaccin + "-" + ev.dateVaccination);
    setEditEvVaccin(ev.idVaccin);
    setEditEvDate(ev.dateVaccination);
  };

  // Enregistrer la modification
  const handleEditEv = async (idVaccinAncien, dateAncienne) => {
    try {
      await axios.put("/api/enregistrements-vaccination/edit", {
        idEnfant: parseInt(id),
        idVaccin: parseInt(idVaccinAncien),
        ancienneDate: dateAncienne,
        newIdVaccin: parseInt(editEvVaccin),
        nouvelleDate: editEvDate,
      }, { withCredentials: true });
      setShowEditEv(null);
      fetchEnregistrements();
    } catch (err) {
      alert(err.response?.data || "Erreur modification");
    }
  };

  // Supprimer un enregistrement
  const handleDeleteEv = async (idVaccin, dateVaccination) => {
    if (!window.confirm("Supprimer cet enregistrement ?")) return;
    try {
      await axios.delete("/api/enregistrements-vaccination", {
        data: {
          idEnfant: parseInt(id),
          idVaccin: idVaccin,
          dateVaccination: dateVaccination,
        },
        withCredentials: true,
      });
      fetchEnregistrements();
    } catch (err) {
      alert(err.response?.data || "Erreur suppression");
    }
  };






  if (!enfant) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <button onClick={() => navigate("/creche/" + enfant.nomCreche)}>
        ← Retour à la crèche
      </button>

      <h1>
        {enfant.prenom} {enfant.nom}
      </h1>
      <p>
        Né(e) le {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")}
      </p>
      <p>Crèche : {enfant.nomCreche}</p>

      {/* ===== BOUTONS D'ACTION ===== */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/ajout-enregistrement")}>
          ➕ Ajouter un enregistrement
        </button>
        <button onClick={() => setShowModifier(!showModifier)}>
          ✏️ Modifier
        </button>
        <button onClick={() => setShowChangerCreche(!showChangerCreche)}>
          🏫 Changer de crèche
        </button>
        <button onClick={handleDisable} style={{ color: "red" }}>
          ❌ Désactiver
        </button>
      </div>

      {/* ===== PANNEAU MODIFIER ===== */}
      {showModifier && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span>Modifier l'enfant</span>
          </div>
          <div style={panelBodyStyle}>
            <input
              placeholder="Nom"
              value={editNom}
              onChange={(e) => setEditNom(e.target.value)}
            />
            <input
              placeholder="Prénom"
              value={editPrenom}
              onChange={(e) => setEditPrenom(e.target.value)}
            />
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <button onClick={handleModifier}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* ===== PANNEAU CHANGER DE CRÈCHE ===== */}
      {showChangerCreche && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <span>Changer de crèche</span>
          </div>
          <div style={panelBodyStyle}>
            <select
              value={newCrecheNom}
              onChange={(e) => setNewCrecheNom(e.target.value)}
            >
              <option value="">-- Choisir une crèche --</option>
              {creches
                .filter(c => c.nom !== enfant.nomCreche)
                .map(c => (
                  <option key={c.nom} value={c.nom}>{c.nom}</option>
                ))}
            </select>
            <button onClick={handleChangeCreche}>Transférer</button>
          </div>
        </div>
      )}

      {/* ===== HISTORIQUE VACCINAL ===== */}
      <h2>Historique vaccinal</h2>
      {enregistrements.length === 0 && <p>Aucun enregistrement.</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Vaccin</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Date</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Enregistré par</th>
          </tr>
        </thead>
        <tbody>
          {enregistrements.map((ev) => (
            <React.Fragment key={ev.idVaccin + "-" + ev.dateVaccination}>
              <tr>
                <td style={{ padding: "8px" }}>{ev.nomVaccin}</td>
                <td style={{ padding: "8px" }}>
                  {new Date(ev.dateVaccination).toLocaleDateString("fr-FR")}
                </td>
                <td style={{ padding: "8px" }}>{ev.prenomUtilisateur}</td>
                <td style={{ padding: "8px" }}>
                  <button onClick={() => handleOpenEditEv(ev)}>✏️</button>
                  <button onClick={() => handleDeleteEv(ev.idVaccin, ev.dateVaccination)}>🗑️</button>
                </td>
              </tr>
              {/* Panneau d'édition rétractable */}
              {showEditEv === ev.idVaccin + "-" + ev.dateVaccination && (
                <tr>
                  <td colSpan="4" style={{ padding: "10px", background: "#f9f9f9" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <select value={editEvVaccin} onChange={(e) => setEditEvVaccin(e.target.value)}>
                        {vaccins.map(v => (
                          <option key={v.id} value={v.id}>{v.nom}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editEvDate}
                        onChange={(e) => setEditEvDate(e.target.value)}
                      />
                      <button onClick={() => handleEditEv(ev.idVaccin, ev.dateVaccination)}>
                        ✅
                      </button>
                      <button onClick={() => setShowEditEv(null)}>❌</button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================== STYLES ====================
const panelStyle = {
  border: "1px solid #ccc",
  borderRadius: "5px",
  marginBottom: "10px",
  marginTop: "15px",
};

const panelHeaderStyle = {
  background: "#f0f0f0",
  padding: "10px",
  fontWeight: "bold",
};

const panelBodyStyle = {
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export default Enfant;