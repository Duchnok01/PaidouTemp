import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PdgEnfants = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [enfants, setEnfants] = useState([]);
  const [creches, setCreches] = useState([]);

  const [leftSearch, setLeftSearch] = useState("");
  const [leftStatut, setLeftStatut] = useState("pres");
  const [leftCreches, setLeftCreches] = useState({});
  const [leftAllCreches, setLeftAllCreches] = useState(true);
  const [leftShowCreche, setLeftShowCreche] = useState(false);
  const [leftShowDate, setLeftShowDate] = useState(false);
  const [leftShowAge, setLeftShowAge] = useState(false);

  const [rightSearch, setRightSearch] = useState("");
  const [rightStatut, setRightStatut] = useState("tous");
  const [rightCreches, setRightCreches] = useState({});
  const [rightAllCreches, setRightAllCreches] = useState(true);
  const [rightShowCreche, setRightShowCreche] = useState(false);
  const [rightShowDate, setRightShowDate] = useState(false);
  const [rightShowAge, setRightShowAge] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  useRedirectByRole(["pdg"]);

  const fetchEnfants = async () => {
    try {
      const allEnfants = [];
      for (const c of creches) {
        const res = await axios.get("/api/enfants/all", { params: { nomCreche: c.nom }, withCredentials: true });
        allEnfants.push(...res.data.map(e => ({ ...e, nomCreche: c.nom, directeurPrenom: c.directeurPrenom })));
      }
      setEnfants(allEnfants);
    } catch (e) { console.error("Erreur chargement enfants", e); }
  };

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches", { withCredentials: true });
      setCreches(res.data);
      const initCreches = {};
      res.data.forEach(c => { initCreches[c.nom] = true; });
      setLeftCreches(initCreches);
      setRightCreches(initCreches);
    } catch (e) { console.error("Erreur chargement crèches", e); }
  };

  useEffect(() => {
    if (!effectiveUser) return;
    fetchCreches();
  }, [effectiveUser]);

  useEffect(() => {
    if (creches.length > 0) fetchEnfants();
  }, [creches]);

  const getAge = (dateNaissance) => {
    const now = new Date();
    const birth = new Date(dateNaissance);
    const mois = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return `${annees} an${annees > 1 ? "s" : ""} ${moisRestants} mois`;
  };

  const applyFilters = (list, search, statut, crechesFilter, showCreche) => {
    return list.filter(e => {
      if (statut === "pres" && e.estParti) return false;
      if (statut === "parti" && !e.estParti) return false;
      if (!crechesFilter[e.nomCreche]) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchPrenom = e.prenom.toLowerCase().includes(q);
        const matchNom = e.nom.toLowerCase().includes(q);
        const matchCreche = showCreche && e.nomCreche.toLowerCase().includes(q);
        const matchDirectrice = showCreche && e.directeurPrenom?.toLowerCase().includes(q);
        if (!matchPrenom && !matchNom && !matchCreche && !matchDirectrice) return false;
      }
      return true;
    }).sort((a, b) => `${a.nom} ${a.prenom}`.toLowerCase().localeCompare(`${b.nom} ${b.prenom}`.toLowerCase()));
  };

  const nonSelected = applyFilters(enfants.filter(e => !selectedIds.includes(e.id)), leftSearch, leftStatut, leftCreches, leftShowCreche);
  const selected = applyFilters(enfants.filter(e => selectedIds.includes(e.id)), rightSearch, rightStatut, rightCreches, rightShowCreche);

  const selectEnfant = (id) => setSelectedIds(prev => [...prev, id]);
  const unselectEnfant = (id) => setSelectedIds(prev => prev.filter(x => x !== id));
  const selectAllLeft = () => setSelectedIds(prev => [...new Set([...prev, ...nonSelected.map(e => e.id)])]);
  const unselectAllRight = () => setSelectedIds(prev => prev.filter(x => !selected.find(e => e.id === x)));

  const getSelectedEnfants = () => enfants.filter(e => selectedIds.includes(e.id));

  const actionMessage = (action) => {
    const sel = getSelectedEnfants();
    if (sel.length === 0) { alert("Aucun enfant sélectionné."); return false; }
    const noms = sel.map(e => `${e.prenom} ${e.nom}`).join(", ");
    if (!window.confirm(`${action} : ${noms} ?`)) return false;
    return true;
  };

  const handleAnonymiser = async () => {
    if (!actionMessage("ANONYMISER (irréversible)")) return;
    if (!window.confirm("⚠️ Les données seront remplacées par des valeurs génériques. Les enregistrements de vaccination seront conservés. Continuer ?")) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.put("/api/admin/enfants/anonymiser", { id: e.id }, { withCredentials: true });
      }
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const statutLabel = (s) => { if (s === "pres") return "Présents"; if (s === "parti") return "Partis"; return "Tous"; };
  const cycleStatut = (current, setter) => { if (current === "pres") setter("parti"); else if (current === "parti") setter("tous"); else setter("pres"); };
  const toggleAllCreches = (all, setAll, setList) => {
    const newAll = !all; setAll(newAll);
    const updated = {}; creches.forEach(c => { updated[c.nom] = newAll; });
    setList(updated);
  };
  const toggleCreche = (nom, list, setList, setAll) => {
    const updated = { ...list, [nom]: !list[nom] };
    setList(updated);
    setAll(Object.values(updated).every(v => v));
  };

  const renderEnfantRow = (e, onClick, isSelected) => (
    <div key={e.id} onClick={onClick} className="list-item" style={{ cursor: "pointer", userSelect: "none" }}>
      <span>{isSelected ? "☑" : "☐"} {e.prenom} {e.nom}</span>
      <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
        {e.estParti ? "❌ Parti" : "✅ Présent"}
        {isSelected !== undefined && e.nomCreche ? ` — ${e.nomCreche}` : ""}
      </span>
    </div>
  );

  const renderCrecheFilters = (crecheList, setCrecheList, allCreches, setAllCreches) => (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn btn-sm btn-secondary" onClick={() => toggleAllCreches(allCreches, setAllCreches, setCrecheList)}>
        {allCreches ? "Tout décocher" : "Tout cocher"}
      </button>
      {creches.map(c => (
        <button key={c.nom} className={`btn btn-sm ${crecheList[c.nom] ? "btn-primary" : "btn-secondary"}`} onClick={() => toggleCreche(c.nom, crecheList, setCrecheList, setAllCreches)}>
          {c.nom} ({c.directeurPrenom})
        </button>
      ))}
    </div>
  );

  const renderPanel = (title, list, search, setSearch, statut, setStatut, crechesFilter, setCrechesFilter, allCreches, setAllCreches, showCreche, setShowCreche, showDate, setShowDate, showAge, setShowAge, selectAll, unselectAll, onRowClick, isRightPanel) => (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header"><span>{title} ({list.length})</span></div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" />
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-secondary" onClick={() => cycleStatut(statut, setStatut)}>{statutLabel(statut)}</button>
          <button className={`btn btn-sm ${showCreche ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowCreche(!showCreche)}>🏫 Crèche</button>
          <button className={`btn btn-sm ${showDate ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowDate(!showDate)}>📅 Date naiss.</button>
          <button className={`btn btn-sm ${showAge ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowAge(!showAge)}>👶 Âge</button>
        </div>
        {renderCrecheFilters(crechesFilter, setCrechesFilter, allCreches, setAllCreches)}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {selectAll && <button className="btn btn-sm btn-primary" onClick={selectAll}>Tout sélectionner</button>}
          {unselectAll && <button className="btn btn-sm btn-secondary" onClick={unselectAll}>Tout désélectionner</button>}
        </div>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {list.length === 0 && <p className="text-secondary">Aucun enfant.</p>}
          {list.map(e => renderEnfantRow(e, () => onRowClick(e.id), isRightPanel))}
        </div>
        {(showDate || showAge) && list.length > 0 && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            {list.map(e => (
              <div key={e.id}>{e.prenom} {e.nom}{showDate && ` — Né(e) le ${new Date(e.dateDeNaissance).toLocaleDateString("fr-FR")}`}{showAge && ` — ${getAge(e.dateDeNaissance)}`}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des enfants</h1>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {renderPanel("👶 Enfants", nonSelected, leftSearch, setLeftSearch, leftStatut, setLeftStatut, leftCreches, setLeftCreches, leftAllCreches, setLeftAllCreches, leftShowCreche, setLeftShowCreche, leftShowDate, setLeftShowDate, leftShowAge, setLeftShowAge, selectAllLeft, null, selectEnfant, false)}
        {renderPanel("✅ Sélectionnés", selected, rightSearch, setRightSearch, rightStatut, setRightStatut, rightCreches, setRightCreches, rightAllCreches, setRightAllCreches, rightShowCreche, setRightShowCreche, rightShowDate, setRightShowDate, rightShowAge, setRightShowAge, null, unselectAllRight, unselectEnfant, true)}
      </div>

      {selectedIds.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header"><span>🔧 Actions ({selectedIds.length})</span></div>
          <div className="panel-body">
            <button className="btn btn-sm btn-warning" onClick={handleAnonymiser}>🔒 Anonymiser</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdgEnfants;
