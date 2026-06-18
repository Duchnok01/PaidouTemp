import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


const Creches = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [creches, setCreches] = useState([]);
  const [users, setUsers] = useState([]);

  // Filtres panneau gauche (non sélectionnées)
  const [leftSearch, setLeftSearch] = useState("");
  const [leftStatut, setLeftStatut] = useState("ouvert");
  const [leftShowDirectrice, setLeftShowDirectrice] = useState(false);
  const [leftShowEnfants, setLeftShowEnfants] = useState(false);

  // Filtres panneau droit (sélectionnées)
  const [rightSearch, setRightSearch] = useState("");
  const [rightStatut, setRightStatut] = useState("tous");
  const [rightShowDirectrice, setRightShowDirectrice] = useState(false);
  const [rightShowEnfants, setRightShowEnfants] = useState(false);

  // Sélection
  const [selectedNoms, setSelectedNoms] = useState([]);

  // Édition
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editValue2, setEditValue2] = useState("");

  // Création
  const [newNom, setNewNom] = useState("");
  const [newDirectrice, setNewDirectrice] = useState("");

  useRedirectByRole(["superadmin"]);

  useEffect(() => {
    if (!effectiveUser) return;
    fetchCreches();
    fetchUsers();
  }, [effectiveUser]);
  
  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches", { withCredentials: true });
      setCreches(res.data);
    } catch (e) { alert(e.response?.data || "Erreur chargement crèches"); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      setUsers(res.data.filter(u => u.role === "directrice" && !u.estParti));
    } catch (e) { console.error("Erreur chargement utilisateurs", e); }
  };

  // ==================== FILTRAGE ====================
  const applyFilters = (list, search, statut, showDirectrice, showEnfants) => {
    return list.filter(c => {
      if (statut === "ouvert" && c.estFerme) return false;
      if (statut === "ferme" && !c.estFerme) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchNom = c.nom.toLowerCase().includes(q);
        const matchDirectrice = showDirectrice && c.directeurPrenom?.toLowerCase().includes(q);
        if (!matchNom && !matchDirectrice) return false;
      }
      return true;
    }).sort((a, b) => a.nom.localeCompare(b.nom));
  };

  const nonSelected = applyFilters(
    creches.filter(c => !selectedNoms.includes(c.nom)),
    leftSearch, leftStatut, leftShowDirectrice, leftShowEnfants
  );
  const selected = applyFilters(
    creches.filter(c => selectedNoms.includes(c.nom)),
    rightSearch, rightStatut, rightShowDirectrice, rightShowEnfants
  );

  // ==================== SÉLECTION ====================
  const selectCreche = (nom) => setSelectedNoms(prev => [...prev, nom]);
  const unselectCreche = (nom) => setSelectedNoms(prev => prev.filter(x => x !== nom));
  const selectAllLeft = () => setSelectedNoms(prev => [...new Set([...prev, ...nonSelected.map(c => c.nom)])]);
  const unselectAllRight = () => setSelectedNoms(prev => prev.filter(x => !selected.find(c => c.nom === x)));

  // ==================== HELPERS ====================
  const getSelectedCreches = () => creches.filter(c => selectedNoms.includes(c.nom));

  const actionMessage = (action) => {
    const sel = getSelectedCreches();
    if (sel.length === 0) { alert("Aucune crèche sélectionnée."); return false; }
    const noms = sel.map(c => c.nom).join(", ");
    if (!window.confirm(`${action} : ${noms} ?`)) return false;
    return true;
  };

  const statutLabel = (s) => {
    if (s === "ouvert") return "Ouvertes";
    if (s === "ferme") return "Fermées";
    return "Toutes";
  };

  const cycleStatut = (current, setter) => {
    if (current === "ouvert") setter("ferme");
    else if (current === "ferme") setter("tous");
    else setter("ouvert");
  };

  // ==================== ACTIONS ====================
  const handleCreateCreche = async () => {
    if (!newNom || !newDirectrice) { alert("Nom et directrice obligatoires."); return; }
    try {
      await axios.post("/api/superadmin/creches", { nom: newNom, directeur: newDirectrice }, { withCredentials: true });
      setNewNom(""); setNewDirectrice("");
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleRename = async () => {
    const sel = getSelectedCreches();
    if (sel.length !== 1) { alert("Sélectionnez exactement une crèche."); return; }
    if (!editValue) { alert("Entrez un nouveau nom."); return; }
    try {
      await axios.put("/api/superadmin/creches/rename", { ancienNom: sel[0].nom, nouveauNom: editValue }, { withCredentials: true });
      setEditMode(null); setEditValue("");
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleChangeDirecteur = async () => {
    const sel = getSelectedCreches();
    if (sel.length !== 1) { alert("Sélectionnez exactement une crèche."); return; }
    if (!editValue2) { alert("Sélectionnez une directrice."); return; }
    try {
      await axios.put("/api/superadmin/creches/change-directeur", { nom: sel[0].nom, directeur: editValue2 }, { withCredentials: true });
      setEditMode(null); setEditValue2("");
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleFermer = async () => {
    if (!actionMessage("Fermer")) return;
    try {
      for (const c of getSelectedCreches()) {
        await axios.put("/api/superadmin/creches/fermer", { nom: c.nom }, { withCredentials: true });
      }
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleRouvrir = async () => {
    if (!actionMessage("Rouvrir")) return;
    try {
      for (const c of getSelectedCreches()) {
        await axios.put("/api/superadmin/creches/rouvrir", { nom: c.nom }, { withCredentials: true });
      }
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSupprimer = async () => {
    if (!actionMessage("SUPPRIMER DÉFINITIVEMENT")) return;
    for (const c of getSelectedCreches()) {
      if (c.nbEnfants > 0) {
        alert(`${c.nom} contient encore ${c.nbEnfants} enfant(s). Transférez-les d'abord.`);
        return;
      }
    }
    try {
      for (const c of getSelectedCreches()) {
        await axios.delete("/api/superadmin/creches/delete", { data: { nom: c.nom }, withCredentials: true });
      }
      setSelectedNoms([]);
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== RENDU ====================
  const renderCrecheRow = (c, onClick, isSelected) => (
    <div key={c.nom} onClick={onClick} className="list-item" style={{ cursor: "pointer", userSelect: "none" }}>
      <span>{isSelected ? "☑" : "☐"} {c.nom}</span>
      <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
        {c.estFerme ? "🔒 Fermée" : "✅ Ouverte"} — {c.nbEnfants} enfant(s)
      </span>
    </div>
  );

  const renderPanel = (
    title, list, search, setSearch, statut, setStatut,
    showDirectrice, setShowDirectrice, showEnfants, setShowEnfants,
    selectAll, unselectAll, onRowClick, isRightPanel
  ) => (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header"><span>{title} ({list.length})</span></div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" />
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-secondary" onClick={() => cycleStatut(statut, setStatut)}>{statutLabel(statut)}</button>
          <button className={`btn btn-sm ${showDirectrice ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowDirectrice(!showDirectrice)}>👩‍💼 Directrice</button>
          <button className={`btn btn-sm ${showEnfants ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowEnfants(!showEnfants)}>👶 Enfants</button>
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {selectAll && <button className="btn btn-sm btn-primary" onClick={selectAll}>Tout sélectionner</button>}
          {unselectAll && <button className="btn btn-sm btn-secondary" onClick={unselectAll}>Tout désélectionner</button>}
        </div>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {list.length === 0 && <p className="text-secondary">Aucune crèche.</p>}
          {list.map(c => renderCrecheRow(c, () => onRowClick(c.nom), isRightPanel))}
        </div>
        {(showDirectrice || showEnfants) && list.length > 0 && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            {list.map(c => (
              <div key={c.nom}>
                {c.nom}
                {showDirectrice && ` — Dirigée par ${c.directeurPrenom || "Aucune"}`}
                {showEnfants && ` — ${c.nbEnfants} enfant(s)`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des crèches</h1>

      {/* Création */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="panel-header"><span>➕ Créer une crèche</span></div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="text" placeholder="Nom" value={newNom} onChange={e => setNewNom(e.target.value)} className="form-input" style={{ width: "200px" }} />
            <select className="form-select" value={newDirectrice} onChange={e => setNewDirectrice(e.target.value)} style={{ width: "200px" }}>
              <option value="">-- Directrice --</option>
              {users.map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleCreateCreche}>Créer</button>
          </div>
        </div>
      </div>

      {/* Panneaux */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {renderPanel("🏫 Crèches", nonSelected, leftSearch, setLeftSearch, leftStatut, setLeftStatut, leftShowDirectrice, setLeftShowDirectrice, leftShowEnfants, setLeftShowEnfants, selectAllLeft, null, selectCreche, false)}
        {renderPanel("✅ Sélectionnées", selected, rightSearch, setRightSearch, rightStatut, setRightStatut, rightShowDirectrice, setRightShowDirectrice, rightShowEnfants, setRightShowEnfants, null, unselectAllRight, unselectCreche, true)}
      </div>

      {/* Barre d'actions */}
      {selectedNoms.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header"><span>🔧 Actions ({selectedNoms.length})</span></div>
          <div className="panel-body">
            <div className="btn-group" style={{ flexWrap: "wrap", gap: "0.5rem" }}>

              {editMode === "rename" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <input className="form-input" placeholder="Nouveau nom" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: "150px" }} />
                  <button className="btn btn-sm btn-primary" onClick={handleRename}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("rename")} disabled={getSelectedCreches().length !== 1}>✏️ Renommer</button>
              )}

              {editMode === "changeDirecteur" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <select className="form-select" value={editValue2} onChange={e => setEditValue2(e.target.value)} style={{ width: "150px" }}>
                    <option value="">-- Directrice --</option>
                    {users.map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleChangeDirecteur}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("changeDirecteur")} disabled={getSelectedCreches().length !== 1}>👩‍💼 Changer directrice</button>
              )}

              <button className="btn btn-sm btn-warning" onClick={handleFermer}>🔒 Fermer</button>
              <button className="btn btn-sm btn-success" onClick={handleRouvrir}>🔓 Rouvrir</button>
              <button className="btn btn-sm btn-danger" onClick={handleSupprimer}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>  
  );
};

export default Creches;
