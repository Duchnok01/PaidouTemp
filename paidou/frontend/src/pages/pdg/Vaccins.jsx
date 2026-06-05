import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PdgVaccins = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [vaccins, setVaccins] = useState([]);

  const [leftSearch, setLeftSearch] = useState("");
  const [leftStatut, setLeftStatut] = useState("actif");
  const [leftNeAvant, setLeftNeAvant] = useState("");
  const [leftNeApres, setLeftNeApres] = useState("");
  const [leftShowMaladies, setLeftShowMaladies] = useState(false);
  const [leftShowDates, setLeftShowDates] = useState(false);
  const [leftShowDelais, setLeftShowDelais] = useState(false);

  const [rightSearch, setRightSearch] = useState("");
  const [rightStatut, setRightStatut] = useState("tous");
  const [rightNeAvant, setRightNeAvant] = useState("");
  const [rightNeApres, setRightNeApres] = useState("");
  const [rightShowMaladies, setRightShowMaladies] = useState(false);
  const [rightShowDates, setRightShowDates] = useState(false);
  const [rightShowDelais, setRightShowDelais] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({
    nom: "", maladiesPrevenues: "", neAvantLe: "", neApresLe: "",
    agePremiereVaccination: "", nbMoisPremierDelai: "", nbMoisDeuxiemeDelai: ""
  });

  useRedirectByRole(["pdg"]);

  useEffect(() => {
    if (!effectiveUser) return;
    fetchVaccins();
  }, [effectiveUser]);

  const fetchVaccins = async () => {
    try {
      const res = await axios.get("/api/vaccins?inclureObsoletes=true", { withCredentials: true });
      setVaccins(res.data);
    } catch (e) { alert(e.response?.data || "Erreur chargement vaccins"); }
  };

  const applyFilters = (list, search, statut, neAvant, neApres) => {
    return list.filter(v => {
      if (statut === "actif" && v.estObsolete) return false;
      if (statut === "obsolete" && !v.estObsolete) return false;
      if (neAvant && v.neAvantLe && new Date(v.neAvantLe) > new Date(neAvant)) return false;
      if (neApres && v.neApresLe && new Date(v.neApresLe) < new Date(neApres)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.nom.toLowerCase().includes(q) && !v.maladiesPrevenues?.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.nom.localeCompare(b.nom));
  };

  const nonSelected = applyFilters(vaccins.filter(v => !selectedIds.includes(v.id)), leftSearch, leftStatut, leftNeAvant, leftNeApres);
  const selected = applyFilters(vaccins.filter(v => selectedIds.includes(v.id)), rightSearch, rightStatut, rightNeAvant, rightNeApres);

  const selectVaccin = (id) => setSelectedIds(prev => [...prev, id]);
  const unselectVaccin = (id) => setSelectedIds(prev => prev.filter(x => x !== id));
  const selectAllLeft = () => setSelectedIds(prev => [...new Set([...prev, ...nonSelected.map(v => v.id)])]);
  const unselectAllRight = () => setSelectedIds(prev => prev.filter(x => !selected.find(v => v.id === x)));

  const getSelectedVaccins = () => vaccins.filter(v => selectedIds.includes(v.id));

  const actionMessage = (action) => {
    const sel = getSelectedVaccins();
    if (sel.length === 0) { alert("Aucun vaccin sélectionné."); return false; }
    const noms = sel.map(v => v.nom).join(", ");
    if (!window.confirm(`${action} : ${noms} ?`)) return false;
    return true;
  };

  const handleCreate = async () => {
    const f = newForm;
    if (!f.nom || !f.maladiesPrevenues || !f.agePremiereVaccination || !f.nbMoisPremierDelai) {
      alert("Nom, maladies, âge 1ère dose et délai 1 sont obligatoires."); return;
    }
    try {
      await axios.post("/api/superadmin/vaccins", {
        nom: f.nom, listeMaladies: f.maladiesPrevenues, neAvantLe: f.neAvantLe || null, neApresLe: f.neApresLe || null,
        agePremiereVaccination: parseInt(f.agePremiereVaccination), nbMoisPremierDelai: parseInt(f.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: f.nbMoisDeuxiemeDelai ? parseInt(f.nbMoisDeuxiemeDelai) : null
      }, { withCredentials: true });
      setNewForm({ nom: "", maladiesPrevenues: "", neAvantLe: "", neApresLe: "", agePremiereVaccination: "", nbMoisPremierDelai: "", nbMoisDeuxiemeDelai: "" });
      fetchVaccins();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleModifier = async () => {
    const sel = getSelectedVaccins();
    if (sel.length !== 1) { alert("Sélectionnez exactement un vaccin."); return; }
    const f = editForm;
    try {
      await axios.put("/api/superadmin/vaccins/edit", {
        id: sel[0].id, nom: f.nom, listeMaladies: f.maladiesPrevenues, neAvantLe: f.neAvantLe || null, neApresLe: f.neApresLe || null,
        agePremiereVaccination: parseInt(f.agePremiereVaccination), nbMoisPremierDelai: parseInt(f.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: f.nbMoisDeuxiemeDelai ? parseInt(f.nbMoisDeuxiemeDelai) : null
      }, { withCredentials: true });
      setEditMode(null);
      fetchVaccins();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleObsolete = async () => {
    if (!actionMessage("Rendre obsolète")) return;
    try {
      for (const v of getSelectedVaccins()) {
        await axios.put("/api/superadmin/vaccins/rendre-obsolete", { id: v.id }, { withCredentials: true });
      }
      fetchVaccins();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleReactiver = async () => {
    if (!actionMessage("Réactiver")) return;
    try {
      for (const v of getSelectedVaccins()) {
        await axios.put("/api/superadmin/vaccins/reactiver", { id: v.id }, { withCredentials: true });
      }
      fetchVaccins();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const statutLabel = (s) => { if (s === "actif") return "Actifs"; if (s === "obsolete") return "Obsolètes"; return "Tous"; };
  const cycleStatut = (current, setter) => { if (current === "actif") setter("obsolete"); else if (current === "obsolete") setter("tous"); else setter("actif"); };
  const formatDelais = (v) => {
    let txt = `1ère à ${v.agePremiereVaccination} mois, 2ème +${v.nbMoisPremierDelai} mois`;
    if (v.nbMoisDeuxiemeDelai) txt += `, 3ème +${v.nbMoisDeuxiemeDelai} mois`;
    else txt += " (2 doses)";
    return txt;
  };

  const renderVaccinRow = (v, onClick, isSelected) => (
    <div key={v.id} onClick={onClick} className="list-item" style={{ cursor: "pointer", userSelect: "none" }}>
      <span>{isSelected ? "☑" : "☐"} {v.nom}</span>
      <span className="text-secondary" style={{ fontSize: "0.85rem" }}>{v.estObsolete ? "⚠️ Obsolète" : "✅ Actif"}</span>
    </div>
  );

  const renderPanel = (title, list, search, setSearch, statut, setStatut, neAvant, setNeAvant, neApres, setNeApres, showMaladies, setShowMaladies, showDates, setShowDates, showDelais, setShowDelais, selectAll, unselectAll, onRowClick, isRightPanel) => (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header"><span>{title} ({list.length})</span></div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" />
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-secondary" onClick={() => cycleStatut(statut, setStatut)}>{statutLabel(statut)}</button>
          <button className={`btn btn-sm ${showMaladies ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowMaladies(!showMaladies)}>🦠 Maladies</button>
          <button className={`btn btn-sm ${showDates ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowDates(!showDates)}>📅 Dates limites</button>
          <button className={`btn btn-sm ${showDelais ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowDelais(!showDelais)}>⏱️ Délais</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem" }}>Nés avant le :</label>
          <input type="date" value={neAvant} onChange={e => setNeAvant(e.target.value)} className="form-input" style={{ width: "160px" }} />
          <label style={{ fontSize: "0.85rem" }}>Nés après le :</label>
          <input type="date" value={neApres} onChange={e => setNeApres(e.target.value)} className="form-input" style={{ width: "160px" }} />
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {selectAll && <button className="btn btn-sm btn-primary" onClick={selectAll}>Tout sélectionner</button>}
          {unselectAll && <button className="btn btn-sm btn-secondary" onClick={unselectAll}>Tout désélectionner</button>}
        </div>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {list.length === 0 && <p className="text-secondary">Aucun vaccin.</p>}
          {list.map(v => renderVaccinRow(v, () => onRowClick(v.id), isRightPanel))}
        </div>
        {list.length > 0 && (showMaladies || showDates || showDelais) && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            {list.map(v => (
              <div key={v.id}><strong>{v.nom}</strong>{showMaladies && ` — ${v.maladiesPrevenues}`}{showDates && <>{v.neAvantLe && ` — Avant le ${new Date(v.neAvantLe).toLocaleDateString("fr-FR")}`}{v.neApresLe && ` — Après le ${new Date(v.neApresLe).toLocaleDateString("fr-FR")}`}</>}{showDelais && ` — ${formatDelais(v)}`}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des vaccins</h1>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="panel-header"><span>➕ Créer un vaccin</span></div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" placeholder="Nom" value={newForm.nom} onChange={e => setNewForm({...newForm, nom: e.target.value})} className="form-input" style={{ width: "150px" }} />
            <input type="text" placeholder="Maladies" value={newForm.maladiesPrevenues} onChange={e => setNewForm({...newForm, maladiesPrevenues: e.target.value})} className="form-input" style={{ width: "200px" }} />
            <input type="date" placeholder="Né avant le" value={newForm.neAvantLe} onChange={e => setNewForm({...newForm, neAvantLe: e.target.value})} className="form-input" style={{ width: "160px" }} />
            <input type="date" placeholder="Né après le" value={newForm.neApresLe} onChange={e => setNewForm({...newForm, neApresLe: e.target.value})} className="form-input" style={{ width: "160px" }} />
            <input type="number" placeholder="Âge 1ère (mois)" value={newForm.agePremiereVaccination} onChange={e => setNewForm({...newForm, agePremiereVaccination: e.target.value})} className="form-input" style={{ width: "100px" }} />
            <input type="number" placeholder="Délai 1 (mois)" value={newForm.nbMoisPremierDelai} onChange={e => setNewForm({...newForm, nbMoisPremierDelai: e.target.value})} className="form-input" style={{ width: "100px" }} />
            <input type="number" placeholder="Délai 2 (mois)" value={newForm.nbMoisDeuxiemeDelai} onChange={e => setNewForm({...newForm, nbMoisDeuxiemeDelai: e.target.value})} className="form-input" style={{ width: "100px" }} />
            <button className="btn btn-primary" onClick={handleCreate}>Créer</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {renderPanel("💉 Vaccins", nonSelected, leftSearch, setLeftSearch, leftStatut, setLeftStatut, leftNeAvant, setLeftNeAvant, leftNeApres, setLeftNeApres, leftShowMaladies, setLeftShowMaladies, leftShowDates, setLeftShowDates, leftShowDelais, setLeftShowDelais, selectAllLeft, null, selectVaccin, false)}
        {renderPanel("✅ Sélectionnés", selected, rightSearch, setRightSearch, rightStatut, setRightStatut, rightNeAvant, setRightNeAvant, rightNeApres, setRightNeApres, rightShowMaladies, setRightShowMaladies, rightShowDates, setRightShowDates, rightShowDelais, setRightShowDelais, null, unselectAllRight, unselectVaccin, true)}
      </div>

      {selectedIds.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header"><span>🔧 Actions ({selectedIds.length})</span></div>
          <div className="panel-body">
            <div className="btn-group" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              {editMode === "modifier" ? (
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
                  <input type="text" placeholder="Nom" value={editForm.nom || ""} onChange={e => setEditForm({...editForm, nom: e.target.value})} className="form-input" style={{ width: "130px" }} />
                  <input type="text" placeholder="Maladies" value={editForm.maladiesPrevenues || ""} onChange={e => setEditForm({...editForm, maladiesPrevenues: e.target.value})} className="form-input" style={{ width: "180px" }} />
                  <input type="date" value={editForm.neAvantLe || ""} onChange={e => setEditForm({...editForm, neAvantLe: e.target.value})} className="form-input" style={{ width: "150px" }} />
                  <input type="date" value={editForm.neApresLe || ""} onChange={e => setEditForm({...editForm, neApresLe: e.target.value})} className="form-input" style={{ width: "150px" }} />
                  <input type="number" placeholder="Âge 1ère" value={editForm.agePremiereVaccination || ""} onChange={e => setEditForm({...editForm, agePremiereVaccination: e.target.value})} className="form-input" style={{ width: "80px" }} />
                  <input type="number" placeholder="Délai 1" value={editForm.nbMoisPremierDelai || ""} onChange={e => setEditForm({...editForm, nbMoisPremierDelai: e.target.value})} className="form-input" style={{ width: "80px" }} />
                  <input type="number" placeholder="Délai 2" value={editForm.nbMoisDeuxiemeDelai || ""} onChange={e => setEditForm({...editForm, nbMoisDeuxiemeDelai: e.target.value})} className="form-input" style={{ width: "80px" }} />
                  <button className="btn btn-sm btn-primary" onClick={handleModifier}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => {
                  const sel = getSelectedVaccins();
                  if (sel.length !== 1) { alert("Sélectionnez exactement un vaccin."); return; }
                  setEditForm({ ...sel[0] });
                  setEditMode("modifier");
                }}>✏️ Modifier</button>
              )}
              <button className="btn btn-sm btn-warning" onClick={handleObsolete}>⚠️ Rendre obsolète</button>
              <button className="btn btn-sm btn-success" onClick={handleReactiver}>↩️ Réactiver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdgVaccins;