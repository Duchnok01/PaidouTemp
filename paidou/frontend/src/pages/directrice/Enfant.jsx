import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Enfant = () => {
  const { id } = useParams();
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [enfant, setEnfant] = useState(null);
  const [enregistrements, setEnregistrements] = useState([]);
  const [creches, setCreches] = useState([]);
  const [showEditEv, setShowEditEv] = useState(null);
  const [editEvVaccin, setEditEvVaccin] = useState("");
  const [editEvDate, setEditEvDate] = useState("");
  const [vaccins, setVaccins] = useState([]);
  const [mdpDirectrice, setMdpDirectrice] = useState("");
  const [statutVaccinal, setStatutVaccinal] = useState([]);

  const [showModifier, setShowModifier] = useState(false);
  const [showChangerCreche, setShowChangerCreche] = useState(false);

  const [editNom, setEditNom] = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [newCrecheNom, setNewCrecheNom] = useState("");

  useEffect(() => {
    if (!effectiveUser) { navigate("/"); return; }
    fetchEnfant();
    fetchEnregistrements();
    fetchStatutVaccinal();
  }, [id, effectiveUser]);

  useEffect(() => {
    if (showChangerCreche && enfant) {
      fetchCrechesForChange();
    }
  }, [showChangerCreche, enfant]);

  useEffect(() => {
    if (showEditEv !== null) {
      axios.get("/api/vaccins", { withCredentials: true })
        .then(res => setVaccins(res.data))
        .catch(err => console.error(err));
    }
  }, [showEditEv]);

  const fetchEnfant = async () => {
    try {
      const res = await axios.get("/api/enfants/" + id, { withCredentials: true });
      setEnfant(res.data);
      setEditNom(res.data.nom);
      setEditPrenom(res.data.prenom);
      setEditDate(res.data.dateDeNaissance);
    } catch (err) {
      console.error("Erreur chargement enfant", err);
      navigate("/accueil");
    }
  };

  const fetchEnregistrements = async () => {
    try {
      const res = await axios.get("/api/enregistrements-vaccination?idEnfant=" + id, { withCredentials: true });
      const sorted = [...res.data].sort((a, b) => new Date(b.dateVaccination) - new Date(a.dateVaccination));
      setEnregistrements(sorted);
    } catch (err) {
      console.error("Erreur chargement enregistrements", err);
      navigate("/accueil");
    }
  };

  const fetchCrechesForChange = async () => {
    if (!enfant) return;
    try {
      const res = await axios.get("/api/creches/toutes", { withCredentials: true });
      setCreches(res.data.filter(c => c.nom !== enfant.nomCreche));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStatutVaccinal = async () => {
    try {
      const res = await axios.get("/api/enfants/" + id + "/statut-vaccinal", { withCredentials: true });
      setStatutVaccinal(res.data);
    } catch (err) {
      console.error("Erreur statut vaccinal", err);
    }
  };

  const handleModifier = async () => {
    if (!mdpDirectrice) { alert("Veuillez entrer votre mot de passe."); return; }
    try {
      await axios.put("/api/enfants/rectifier", {
        id: parseInt(id),
        nom: editNom,
        prenom: editPrenom,
        dateDeNaissance: editDate,
        mdpAdmin: mdpDirectrice,
      }, { withCredentials: true });
      setShowModifier(false);
      setMdpDirectrice("");
      fetchEnfant();
    } catch (err) {
      alert(err.response?.data || "Erreur modification");
    }
  };

  const handleDisable = async () => {
    if (!mdpDirectrice) { alert("Veuillez entrer votre mot de passe."); return; }
    if (!window.confirm("Désactiver cet enfant ? Il n'apparaîtra plus dans les listes.")) return;
    try {
      await axios.put("/api/enfants/disable", {
        id: parseInt(id),
        mdpAdmin: mdpDirectrice,
      }, { withCredentials: true });
      setMdpDirectrice("");
      navigate("/creche/" + enfant.nomCreche);
    } catch (err) {
      alert(err.response?.data || "Erreur désactivation");
    }
  };

  const handleChangeCreche = async () => {
    if (!newCrecheNom) { alert("Veuillez sélectionner une crèche"); return; }
    if (!mdpDirectrice) { alert("Veuillez entrer votre mot de passe."); return; }
    try {
      await axios.put("/api/enfants/change-creche", {
        id: parseInt(id),
        nomCreche: newCrecheNom,
        mdpAdmin: mdpDirectrice,
      }, { withCredentials: true });
      setShowChangerCreche(false);
      setMdpDirectrice("");
      fetchEnfant();
    } catch (err) {
      alert(err.response?.data || "Erreur changement de crèche");
    }
  };

  const handleOpenEditEv = (ev) => {
    setShowEditEv(ev.idVaccin + "-" + ev.dateVaccination);
    setEditEvVaccin(ev.idVaccin);
    setEditEvDate(ev.dateVaccination);
  };

  const handleEditEv = async (idVaccinAncien, dateAncienne) => {
    if (!mdpDirectrice) { alert("Veuillez entrer votre mot de passe."); return; }
    try {
      await axios.put("/api/enregistrements-vaccination/edit", {
        idEnfant: parseInt(id),
        idVaccin: parseInt(idVaccinAncien),
        ancienneDate: dateAncienne,
        newIdVaccin: parseInt(editEvVaccin),
        nouvelleDate: editEvDate,
        mdpAdmin: mdpDirectrice,
      }, { withCredentials: true });
      setShowEditEv(null);
      setMdpDirectrice("");
      fetchEnregistrements();
      fetchStatutVaccinal();
    } catch (err) {
      alert(err.response?.data || "Erreur modification");
    }
  };

  const handleDeleteEv = async (idVaccin, dateVaccination) => {
    if (!mdpDirectrice) { alert("Veuillez entrer votre mot de passe."); return; }
    if (!window.confirm("Supprimer cet enregistrement ?")) return;
    try {
      await axios.delete("/api/enregistrements-vaccination", {
        data: {
          idEnfant: parseInt(id),
          idVaccin: idVaccin,
          dateVaccination: dateVaccination,
          mdpAdmin: mdpDirectrice,
        },
        withCredentials: true,
      });
      setMdpDirectrice("");
      fetchEnregistrements();
      fetchStatutVaccinal();
    } catch (err) {
      alert(err.response?.data || "Erreur suppression");
    }
  };

  if (!enfant) return <p className="text-secondary">Chargement...</p>;

  return (
    <div className="page-container">
      <div className="header-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Retour</button>
      </div>

      <h1>{enfant.prenom} {enfant.nom}</h1>
      <p className="text-secondary">
        Né(e) le {new Date(enfant.dateDeNaissance).toLocaleDateString("fr-FR")} — Crèche : {enfant.nomCreche}
      </p>

      <div className="form-group">
        <label>Votre mot de passe</label>
        <input type="password" className="form-input" value={mdpDirectrice} onChange={(e) => setMdpDirectrice(e.target.value)} />
      </div>

      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => navigate("/ajout-enregistrement?creche=" + enfant.nomCreche + "&enfant=" + enfant.id)}>
          ➕ Ajouter un enregistrement
        </button>
        <button className="btn btn-secondary" onClick={() => setShowModifier(!showModifier)}>✏️ Modifier</button>
        <button className="btn btn-secondary" onClick={() => setShowChangerCreche(!showChangerCreche)}>🏫 Changer de crèche</button>
        <button className="btn btn-danger" onClick={handleDisable}>❌ Désactiver</button>
      </div>

      {showModifier && (
        <div className="card">
          <div className="panel-header"><span>Modifier l'enfant</span></div>
          <div className="panel-body">
            <input className="form-input" placeholder="Nom" value={editNom} onChange={(e) => setEditNom(e.target.value)} />
            <input className="form-input" placeholder="Prénom" value={editPrenom} onChange={(e) => setEditPrenom(e.target.value)} />
            <input className="form-input" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            <button className="btn btn-primary" onClick={handleModifier}>Enregistrer</button>
          </div>
        </div>
      )}

      {showChangerCreche && (
        <div className="card">
          <div className="panel-header"><span>Changer de crèche</span></div>
          <div className="panel-body">
            <select className="form-select" value={newCrecheNom} onChange={(e) => setNewCrecheNom(e.target.value)}>
              <option value="">-- Choisir une crèche --</option>
              {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleChangeCreche}>Transférer</button>
          </div>
        </div>
      )}

      <h2>Historique vaccinal</h2>
      {enregistrements.length === 0 && <p className="text-secondary">Aucun enregistrement.</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Vaccin</th><th>Date</th><th>Enregistré par</th><th></th>
          </tr>
        </thead>
        <tbody>
          {enregistrements.map((ev) => (
            <React.Fragment key={ev.idVaccin + "-" + ev.dateVaccination}>
              <tr>
                <td>{ev.nomVaccin}</td>
                <td>{new Date(ev.dateVaccination).toLocaleDateString("fr-FR")}</td>
                <td>{ev.prenomUtilisateur}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleOpenEditEv(ev)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteEv(ev.idVaccin, ev.dateVaccination)}>🗑️</button>
                </td>
              </tr>
              {showEditEv === ev.idVaccin + "-" + ev.dateVaccination && (
                <tr>
                  <td colSpan="4">
                    <div className="panel-body">
                      <select className="form-select" value={editEvVaccin} onChange={(e) => setEditEvVaccin(e.target.value)}>
                        {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                      </select>
                      <input type="date" className="form-input" value={editEvDate} onChange={(e) => setEditEvDate(e.target.value)} />
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditEv(ev.idVaccin, ev.dateVaccination)}>✅</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowEditEv(null)}>❌</button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <h2>Calendrier vaccinal</h2>
      {statutVaccinal.length === 0 && <p className="text-secondary">Chargement...</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Vaccin</th><th>Statut</th><th>Doses</th><th>Prochaine dose</th>
          </tr>
        </thead>
        <tbody>
          {statutVaccinal.map(s => {
            let couleur;
            if (s.statut.startsWith("RETARD")) couleur = "var(--danger)";
            else if (s.statut === "COMPLET") couleur = "var(--success)";
            else if (s.statut === "EN_COURS") couleur = "var(--info)";
            else couleur = "var(--text)";
            let prochaine = null;
            if (s.dosesRecues === 0) prochaine = s.dateDose1Recommandee;
            else if (s.dosesRecues === 1) prochaine = s.dateDose2Recommandee;
            else if (s.dosesRecues === 2 && s.dateDose3Recommandee) prochaine = s.dateDose3Recommandee;
            return (
              <tr key={s.idVaccin}>
                <td>{s.nomVaccin}</td>
                <td style={{ color: couleur, fontWeight: "bold" }}>{s.statut}</td>
                <td>{s.dosesRecues}/{s.dosesRequises}</td>
                <td>{prochaine ? new Date(prochaine).toLocaleDateString("fr-FR") : s.statut === "COMPLET" ? "✅" : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Enfant;