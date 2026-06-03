import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Enregistrements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enregistrements, setEnregistrements] = useState([]);
  const [creches, setCreches] = useState([]);
  const [vaccins, setVaccins] = useState([]);

  // Filtres panneau gauche
  const [leftSearch, setLeftSearch] = useState("");
  const [leftCreche, setLeftCreche] = useState("");
  const [leftVaccin, setLeftVaccin] = useState("");
  const [leftDateDebut, setLeftDateDebut] = useState("");
  const [leftDateFin, setLeftDateFin] = useState("");
  const [leftShowCreche, setLeftShowCreche] = useState(false);
  const [leftShowUser, setLeftShowUser] = useState(false);

  // Filtres panneau droit
  const [rightSearch, setRightSearch] = useState("");
  const [rightCreche, setRightCreche] = useState("");
  const [rightVaccin, setRightVaccin] = useState("");
  const [rightDateDebut, setRightDateDebut] = useState("");
  const [rightDateFin, setRightDateFin] = useState("");
  const [rightShowCreche, setRightShowCreche] = useState(false);
  const [rightShowUser, setRightShowUser] = useState(false);

  // Sélection (identifiant unique = "idEnfant-idVaccin-date")
  const [selectedKeys, setSelectedKeys] = useState([]);

  const fetchEnregistrements = async () => {
    try {
      const all = [];
      for (const c of creches) {
        const res = await axios.get(`/api/enregistrements-vaccination?nomCreche=${c.nom}`, { withCredentials: true });
        all.push(...res.data.map(ev => ({ ...ev, crecheNom: c.nom })));
      }
      setEnregistrements(all);
    } catch (e) { console.error("Erreur chargement enregistrements", e); }
  };

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches", { withCredentials: true });
      setCreches(res.data);
    } catch (e) { console.error("Erreur chargement crèches", e); }
  };

  const fetchVaccins = async () => {
    try {
      const res = await axios.get("/api/vaccins?inclureObsoletes=true", { withCredentials: true });
      setVaccins(res.data);
    } catch (e) { console.error("Erreur chargement vaccins", e); }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/accueil"); return; }
    fetchCreches();
    fetchVaccins();
  }, [user]);

  useEffect(() => {
    if (creches.length > 0) fetchEnregistrements();
  }, [creches]);

  const evKey = (ev) => `${ev.idEnfant}-${ev.idVaccin}-${ev.dateVaccination}`;

  // ==================== FILTRAGE ====================
  const applyFilters = (list, search, creche, vaccin, dateDebut, dateFin) => {
    return list.filter(ev => {
      if (creche && ev.crecheNom !== creche) return false;
      if (vaccin && ev.idVaccin !== parseInt(vaccin)) return false;
      if (dateDebut && new Date(ev.dateVaccination) < new Date(dateDebut)) return false;
      if (dateFin && new Date(ev.dateVaccination) > new Date(dateFin)) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchEnfant = `${ev.prenomEnfant} ${ev.nomEnfant}`.toLowerCase().includes(q);
        const matchVaccin = ev.nomVaccin?.toLowerCase().includes(q);
        const matchCreche = ev.crecheNom?.toLowerCase().includes(q);
        const matchUser = ev.prenomUtilisateur?.toLowerCase().includes(q);
        if (!matchEnfant && !matchVaccin && !matchCreche && !matchUser) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.dateVaccination) - new Date(a.dateVaccination));
  };

  const nonSelected = applyFilters(
    enregistrements.filter(ev => !selectedKeys.includes(evKey(ev))),
    leftSearch, leftCreche, leftVaccin, leftDateDebut, leftDateFin
  );
  const selected = applyFilters(
    enregistrements.filter(ev => selectedKeys.includes(evKey(ev))),
    rightSearch, rightCreche, rightVaccin, rightDateDebut, rightDateFin
  );

  // ==================== SÉLECTION ====================
  const selectEv = (ev) => setSelectedKeys(prev => [...prev, evKey(ev)]);
  const unselectEv = (ev) => setSelectedKeys(prev => prev.filter(k => k !== evKey(ev)));
  const selectAllLeft = () => setSelectedKeys(prev => [...new Set([...prev, ...nonSelected.map(ev => evKey(ev))])]);
  const unselectAllRight = () => setSelectedKeys(prev => prev.filter(k => !selected.find(ev => evKey(ev) === k)));

  // ==================== HELPERS ====================
  const getSelectedEvs = () => enregistrements.filter(ev => selectedKeys.includes(evKey(ev)));

  const actionMessage = (action) => {
    const sel = getSelectedEvs();
    if (sel.length === 0) { alert("Aucun enregistrement sélectionné."); return false; }
    if (!window.confirm(`${action} ${sel.length} enregistrement(s) ?`)) return false;
    return true;
  };

  // ==================== ACTIONS ====================
  const handleSupprimer = async () => {
    if (!actionMessage("SUPPRIMER")) return;
    try {
      for (const ev of getSelectedEvs()) {
        await axios.delete("/api/enregistrements-vaccination", {
          data: { idEnfant: ev.idEnfant, idVaccin: ev.idVaccin, dateVaccination: ev.dateVaccination },
          withCredentials: true
        });
      }
      setSelectedKeys([]);
      fetchEnregistrements();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== RENDU ====================
  const renderEvRow = (ev, onClick, isSelected) => (
    <div key={evKey(ev)} onClick={onClick} className="list-item" style={{ cursor: "pointer", userSelect: "none" }}>
      <span>{isSelected ? "☑" : "☐"} {ev.prenomEnfant} {ev.nomEnfant} — {ev.nomVaccin}</span>
      <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
        {new Date(ev.dateVaccination).toLocaleDateString("fr-FR")}
      </span>
    </div>
  );

  const renderPanel = (
    title, list, search, setSearch,
    creche, setCreche, vaccin, setVaccin,
    dateDebut, setDateDebut, dateFin, setDateFin,
    showCreche, setShowCreche, showUser, setShowUser,
    selectAll, unselectAll, onRowClick, isRightPanel
  ) => (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header"><span>{title} ({list.length})</span></div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select className="form-select" value={creche} onChange={e => setCreche(e.target.value)} style={{ width: "180px" }}>
            <option value="">Toutes les crèches</option>
            {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
          </select>
          <select className="form-select" value={vaccin} onChange={e => setVaccin(e.target.value)} style={{ width: "180px" }}>
            <option value="">Tous les vaccins</option>
            {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem" }}>Du :</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="form-input" style={{ width: "160px" }} />
          <label style={{ fontSize: "0.85rem" }}>Au :</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="form-input" style={{ width: "160px" }} />
        </div>

        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <button className={`btn btn-sm ${showCreche ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowCreche(!showCreche)}>🏫 Crèche</button>
          <button className={`btn btn-sm ${showUser ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowUser(!showUser)}>👤 Enregistré par</button>
        </div>

        <div style={{ display: "flex", gap: "0.25rem" }}>
          {selectAll && <button className="btn btn-sm btn-primary" onClick={selectAll}>Tout sélectionner</button>}
          {unselectAll && <button className="btn btn-sm btn-secondary" onClick={unselectAll}>Tout désélectionner</button>}
        </div>

        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {list.length === 0 && <p className="text-secondary">Aucun enregistrement.</p>}
          {list.map(ev => renderEvRow(ev, () => onRowClick(ev), isRightPanel))}
        </div>

        {list.length > 0 && (showCreche || showUser) && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            {list.map(ev => (
              <div key={evKey(ev)}>
                {ev.prenomEnfant} {ev.nomEnfant} — {ev.nomVaccin} — {new Date(ev.dateVaccination).toLocaleDateString("fr-FR")}
                {showCreche && ` — ${ev.crecheNom}`}
                {showUser && ` — par ${ev.prenomUtilisateur}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des enregistrements</h1>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {renderPanel("📋 Enregistrements", nonSelected, leftSearch, setLeftSearch, leftCreche, setLeftCreche, leftVaccin, setLeftVaccin, leftDateDebut, setLeftDateDebut, leftDateFin, setLeftDateFin, leftShowCreche, setLeftShowCreche, leftShowUser, setLeftShowUser, selectAllLeft, null, selectEv, false)}
        {renderPanel("✅ Sélectionnés", selected, rightSearch, setRightSearch, rightCreche, setRightCreche, rightVaccin, setRightVaccin, rightDateDebut, setRightDateDebut, rightDateFin, setRightDateFin, rightShowCreche, setRightShowCreche, rightShowUser, setRightShowUser, null, unselectAllRight, unselectEv, true)}
      </div>

      {selectedKeys.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header"><span>🔧 Actions ({selectedKeys.length})</span></div>
          <div className="panel-body">
            <button className="btn btn-sm btn-danger" onClick={handleSupprimer}>🗑️ Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enregistrements;