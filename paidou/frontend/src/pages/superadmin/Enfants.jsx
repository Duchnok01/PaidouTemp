import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Enfants = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [enfants, setEnfants] = useState([]);
  const [creches, setCreches] = useState([]);

  // Filtres panneau gauche
  const [leftSearch, setLeftSearch] = useState("");
  const [leftStatut, setLeftStatut] = useState("pres");
  const [leftCreches, setLeftCreches] = useState({});
  const [leftAllCreches, setLeftAllCreches] = useState(true);
  const [leftShowCreche, setLeftShowCreche] = useState(false);
  const [leftShowDate, setLeftShowDate] = useState(false);
  const [leftShowAge, setLeftShowAge] = useState(false);

  // Filtres panneau droit
  const [rightSearch, setRightSearch] = useState("");
  const [rightStatut, setRightStatut] = useState("tous");
  const [rightCreches, setRightCreches] = useState({});
  const [rightAllCreches, setRightAllCreches] = useState(true);
  const [rightShowCreche, setRightShowCreche] = useState(false);
  const [rightShowDate, setRightShowDate] = useState(false);
  const [rightShowAge, setRightShowAge] = useState(false);

  // Sélection
  const [selectedIds, setSelectedIds] = useState([]);

  // Édition
  const [editMode, setEditMode] = useState(null);
  const [editPrenom, setEditPrenom] = useState("");
  const [editNom, setEditNom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editValue2, setEditValue2] = useState("");

  // Création
  const [newPrenom, setNewPrenom] = useState("");
  const [newNom, setNewNom] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCreche, setNewCreche] = useState("");


  useRedirectByRole(["superadmin"]);

  useEffect(() => {
    if (!effectiveUser) return;
    fetchCreches();
  }, [effectiveUser]);

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

  // ==================== FILTRAGE ====================
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
    }).sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const nonSelected = applyFilters(
    enfants.filter(e => !selectedIds.includes(e.id)),
    leftSearch, leftStatut, leftCreches, leftShowCreche
  );
  const selected = applyFilters(
    enfants.filter(e => selectedIds.includes(e.id)),
    rightSearch, rightStatut, rightCreches, rightShowCreche
  );

  // ==================== SÉLECTION ====================
  const selectEnfant = (id) => setSelectedIds(prev => [...prev, id]);
  const unselectEnfant = (id) => setSelectedIds(prev => prev.filter(x => x !== id));
  const selectAllLeft = () => setSelectedIds(prev => [...new Set([...prev, ...nonSelected.map(e => e.id)])]);
  const unselectAllRight = () => setSelectedIds(prev => prev.filter(x => !selected.find(e => e.id === x)));

  // ==================== HELPERS ====================
  const getSelectedEnfants = () => enfants.filter(e => selectedIds.includes(e.id));

  const actionMessage = (action) => {
    const sel = getSelectedEnfants();
    if (sel.length === 0) { alert("Aucun enfant sélectionné."); return false; }
    const noms = sel.map(e => `${e.prenom} ${e.nom}`).join(", ");
    if (!window.confirm(`${action} : ${noms} ?`)) return false;
    return true;
  };

  const statutLabel = (s) => {
    if (s === "pres") return "Présents";
    if (s === "parti") return "Partis";
    return "Tous";
  };

  const cycleStatut = (current, setter) => {
    if (current === "pres") setter("parti");
    else if (current === "parti") setter("tous");
    else setter("pres");
  };

  const toggleAllCreches = (all, setAll, setList) => {
    const newAll = !all;
    setAll(newAll);
    const updated = {};
    creches.forEach(c => { updated[c.nom] = newAll; });
    setList(updated);
  };

  const toggleCreche = (nom, list, setList, setAll) => {
    const updated = { ...list, [nom]: !list[nom] };
    setList(updated);
    setAll(Object.values(updated).every(v => v));
  };

  // ==================== ACTIONS ====================
  const handleCreateEnfant = async () => {
    if (!newPrenom || !newNom || !newDate || !newCreche) { alert("Tous les champs sont obligatoires."); return; }
    try {
      await axios.post("/api/superadmin/enfants", {
        prenom: newPrenom, nom: newNom, dateDeNaissance: newDate, nomCreche: newCreche
      }, { withCredentials: true });
      setNewPrenom(""); setNewNom(""); setNewDate(""); setNewCreche("");
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleModifier = async () => {
    const sel = getSelectedEnfants();
    if (sel.length !== 1) { alert("Sélectionnez exactement un enfant."); return; }
    try {
      await axios.put("/api/superadmin/enfants/rectifier", {
        id: sel[0].id, prenom: editPrenom, nom: editNom, dateDeNaissance: editDate
      }, { withCredentials: true });
      setEditMode(null);
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleChangeCreche = async () => {
    if (!editValue2) { alert("Sélectionnez une crèche cible."); return; }
    if (!actionMessage(`Transférer vers "${editValue2}"`)) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.put("/api/superadmin/enfants/change-creche", { id: e.id, nomCreche: editValue2 }, { withCredentials: true });
      }
      setEditMode(null); setEditValue2("");
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleDesactiver = async () => {
    if (!actionMessage("Désactiver")) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.put("/api/superadmin/enfants/disable", { id: e.id }, { withCredentials: true });
      }
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleReactiver = async () => {
    if (!actionMessage("Réactiver")) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.put("/api/superadmin/enfants/reactiver", { id: e.id }, { withCredentials: true });
      }
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleAnonymiser = async () => {
    if (!actionMessage("ANONYMISER (irréversible)")) return;
    if (!window.confirm("⚠️ Les données seront remplacées par des valeurs génériques. Les enregistrements de vaccination seront conservés. Continuer ?")) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.put("/api/superadmin/enfants/anonymiser", { id: e.id }, { withCredentials: true });
      }
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSupprimer = async () => {
    if (!actionMessage("SUPPRIMER DÉFINITIVEMENT (enfant + enregistrements)")) return;
    if (!window.confirm("☠️ Cette action est IRRÉVERSIBLE. L'enfant et tous ses enregistrements seront supprimés. Continuer ?")) return;
    try {
      for (const e of getSelectedEnfants()) {
        await axios.delete("/api/superadmin/enfants/delete-physique", { data: { id: e.id }, withCredentials: true });
      }
      setSelectedIds([]);
      fetchEnfants();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== RENDU ====================
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
        <button
          key={c.nom}
          className={`btn btn-sm ${crecheList[c.nom] ? "btn-primary" : "btn-secondary"}`}
          onClick={() => toggleCreche(c.nom, crecheList, setCrecheList, setAllCreches)}
        >
          {c.nom} ({c.directeurPrenom})
        </button>
      ))}
    </div>
  );

  const renderPanel = (
    title, list, search, setSearch, statut, setStatut,
    crechesFilter, setCrechesFilter, allCreches, setAllCreches,
    showCreche, setShowCreche, showDate, setShowDate, showAge, setShowAge,
    selectAll, unselectAll, onRowClick, isRightPanel
  ) => (
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
              <div key={e.id}>
                {e.prenom} {e.nom}
                {showDate && ` — Né(e) le ${new Date(e.dateDeNaissance).toLocaleDateString("fr-FR")}`}
                {showAge && ` — ${getAge(e.dateDeNaissance)}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des enfants</h1>

      {/* Création */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="panel-header"><span>➕ Créer un enfant</span></div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input type="text" placeholder="Prénom" value={newPrenom} onChange={e => setNewPrenom(e.target.value)} className="form-input" style={{ width: "130px" }} />
            <input type="text" placeholder="Nom" value={newNom} onChange={e => setNewNom(e.target.value)} className="form-input" style={{ width: "130px" }} />
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="form-input" style={{ width: "150px" }} />
            <select className="form-select" value={newCreche} onChange={e => setNewCreche(e.target.value)} style={{ width: "220px" }}>
              <option value="">-- Crèche --</option>
              {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom} ({c.directeurPrenom})</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleCreateEnfant}>Créer</button>
          </div>
        </div>
      </div>

      {/* Panneaux */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {renderPanel("👶 Enfants", nonSelected, leftSearch, setLeftSearch, leftStatut, setLeftStatut, leftCreches, setLeftCreches, leftAllCreches, setLeftAllCreches, leftShowCreche, setLeftShowCreche, leftShowDate, setLeftShowDate, leftShowAge, setLeftShowAge, selectAllLeft, null, selectEnfant, false)}
        {renderPanel("✅ Sélectionnés", selected, rightSearch, setRightSearch, rightStatut, setRightStatut, rightCreches, setRightCreches, rightAllCreches, setRightAllCreches, rightShowCreche, setRightShowCreche, rightShowDate, setRightShowDate, rightShowAge, setRightShowAge, null, unselectAllRight, unselectEnfant, true)}
      </div>

      {/* Barre d'actions */}
      {selectedIds.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header"><span>🔧 Actions ({selectedIds.length})</span></div>
          <div className="panel-body">
            <div className="btn-group" style={{ flexWrap: "wrap", gap: "0.5rem" }}>

              {editMode === "modifier" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
                  <input className="form-input" placeholder="Prénom" value={editPrenom} onChange={e => setEditPrenom(e.target.value)} style={{ width: "120px" }} />
                  <input className="form-input" placeholder="Nom" value={editNom} onChange={e => setEditNom(e.target.value)} style={{ width: "120px" }} />
                  <input type="date" className="form-input" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ width: "150px" }} />
                  <button className="btn btn-sm btn-primary" onClick={handleModifier}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => {
                  const sel = getSelectedEnfants();
                  if (sel.length !== 1) { alert("Sélectionnez exactement un enfant."); return; }
                  setEditPrenom(sel[0].prenom);
                  setEditNom(sel[0].nom);
                  setEditDate(sel[0].dateDeNaissance);
                  setEditMode("modifier");
                }}>✏️ Modifier</button>
              )}

              {editMode === "changeCreche" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <select className="form-select" value={editValue2} onChange={e => setEditValue2(e.target.value)} style={{ width: "220px" }}>
                    <option value="">-- Crèche cible --</option>
                    {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom} ({c.directeurPrenom})</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleChangeCreche}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("changeCreche")}>🏫 Changer crèche</button>
              )}

              <button className="btn btn-sm btn-danger" onClick={handleDesactiver}>❌ Désactiver</button>
              <button className="btn btn-sm btn-success" onClick={handleReactiver}>↩️ Réactiver</button>
              <button className="btn btn-sm btn-warning" onClick={handleAnonymiser}>🔒 Anonymiser</button>
              <button className="btn btn-sm btn-danger" onClick={handleSupprimer}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enfants;
