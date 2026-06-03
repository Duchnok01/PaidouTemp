import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ==================== ÉTATS ====================
  const [users, setUsers] = useState([]);
  const [creches, setCreches] = useState([]);

  // Filtres panneau gauche (non sélectionnés)
  const [leftSearch, setLeftSearch] = useState("");
  const [leftStatut, setLeftStatut] = useState("pres"); // "pres" | "parti" | "tous"
  const [leftMdp, setLeftMdp] = useState("tous"); // "tous" | "doit" | "pas"
  const [leftRoles, setLeftRoles] = useState({ directrice: true, coordinateur: true, pdg: true });
  const [leftShowCreche, setLeftShowCreche] = useState(false);

  // Filtres panneau droit (sélectionnés)
  const [rightSearch, setRightSearch] = useState("");
  const [rightStatut, setRightStatut] = useState("tous");
  const [rightMdp, setRightMdp] = useState("tous");
  const [rightRoles, setRightRoles] = useState({ directrice: true, coordinateur: true, pdg: true });
  const [rightShowCreche, setRightShowCreche] = useState(false);

  // Sélection
  const [selectedIds, setSelectedIds] = useState([]);

  // Formulaire d'édition
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editValue2, setEditValue2] = useState("");

  // Paramètre global
  const [moisChangementMdp, setMoisChangementMdp] = useState(6);

  // ==================== FETCH ====================
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      setUsers(res.data.filter(u => u.role !== "superadmin"));
    } catch (e) {
      alert(e.response?.data || "Erreur chargement utilisateurs");
    }
  };

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches", { withCredentials: true });
      setCreches(res.data);
    } catch (e) {
      console.error("Erreur chargement crèches", e);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/accueil"); return; }
    fetchUsers();
    fetchCreches();
  }, [user]);

  // ==================== FILTRAGE ====================
  const applyFilters = (list, search, statut, mdp, roles, showCreche) => {
    return list.filter(u => {
      if (statut === "pres" && u.estParti) return false;
      if (statut === "parti" && !u.estParti) return false;
      if (mdp === "doit" && !u.doitChangerMdp) return false;
      if (mdp === "pas" && u.doitChangerMdp) return false;
      if (!roles[u.role]) return false;
      if (search) {
        const q = search.toLowerCase();
        const crecheNom = creches.find(c => c.directeurPrenom === u.prenom)?.nom || "";
        const matchPrenom = u.prenom.toLowerCase().includes(q);
        const matchCreche = showCreche && crecheNom.toLowerCase().includes(q);
        const matchRole = u.role.toLowerCase().includes(q);
        if (!matchPrenom && !matchCreche && !matchRole) return false;
      }
      return true;
    }).sort((a, b) => {
      const order = ["pdg", "coordinateur", "directrice"];
      const roleA = order.indexOf(a.role);
      const roleB = order.indexOf(b.role);
      if (roleA !== roleB) return roleA - roleB;
      return a.prenom.localeCompare(b.prenom);
    });
  };

  const nonSelectedUsers = applyFilters(
    users.filter(u => !selectedIds.includes(u.id)),
    leftSearch, leftStatut, leftMdp, leftRoles, leftShowCreche
  );
  const selectedUsers = applyFilters(
    users.filter(u => selectedIds.includes(u.id)),
    rightSearch, rightStatut, rightMdp, rightRoles, rightShowCreche
  );

  // ==================== SÉLECTION ====================
  const selectUser = (id) => {
    setSelectedIds(prev => [...prev, id]);
  };

  const unselectUser = (id) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const selectAllLeft = () => {
    const ids = nonSelectedUsers.map(u => u.id);
    setSelectedIds(prev => [...new Set([...prev, ...ids])]);
  };

  const unselectAllRight = () => {
    const ids = selectedUsers.map(u => u.id);
    setSelectedIds(prev => prev.filter(x => !ids.includes(x)));
  };

  // ==================== ACTIONS ====================
  const getSelectedUsers = () => users.filter(u => selectedIds.includes(u.id));

  const actionMessage = (action) => {
    const sel = getSelectedUsers();
    if (sel.length === 0) {
      alert("Aucun utilisateur sélectionné.");
      return false;
    }
    const noms = sel.map(u => u.prenom).join(", ");
    if (!window.confirm(`${action} : ${noms} ?`)) return false;
    return true;
  };

  const handleChangeRole = async (nouveauRole) => {
    if (!actionMessage(`Changer le rôle en "${nouveauRole}" pour`)) return;
    try {
      await axios.put("/api/users/change-role-bulk", { ids: selectedIds, nouveauRole }, { withCredentials: true });
      fetchUsers();
      setSelectedIds([]);
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleDesactiver = async () => {
    if (!actionMessage("Désactiver")) return;
    const sel = getSelectedUsers();
    const pdgs = sel.filter(u => u.role === "pdg");
    const allPdgs = users.filter(u => u.role === "pdg" && !u.estParti);
    if (pdgs.length >= allPdgs.length && allPdgs.length > 0) {
      alert("Impossible : il doit rester au moins un PDG actif.");
      return;
    }
    try {
      for (const u of sel) {
        await axios.put("/api/users/disable", { prenom: u.prenom }, { withCredentials: true });
      }
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleReactiver = async () => {
    if (!actionMessage("Réactiver")) return;
    try {
      for (const u of getSelectedUsers()) {
        await axios.put("/api/users/reactiver", { prenom: u.prenom }, { withCredentials: true });
      }
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleResetMdp = async () => {
    if (!actionMessage("Réinitialiser le mot de passe de")) return;
    const results = [];
    try {
      for (const u of getSelectedUsers()) {
        const res = await axios.put("/api/users/reset-password", { prenom: u.prenom }, { withCredentials: true });
        results.push(`${u.prenom} : ${res.data}`);
      }
      alert(results.join("\n"));
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleForceChangeMdp = async () => {
    if (!actionMessage("Forcer le changement de MDP pour")) return;
    try {
      await axios.put("/api/users/force-change-mdp-bulk", { ids: selectedIds }, { withCredentials: true });
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSupprimer = async () => {
    if (!actionMessage("SUPPRIMER DÉFINITIVEMENT")) return;
    const sel = getSelectedUsers();
    const pdgs = sel.filter(u => u.role === "pdg");
    const allPdgs = users.filter(u => u.role === "pdg");
    if (pdgs.length >= allPdgs.length) {
      alert("Impossible de supprimer tous les PDG.");
      return;
    }
    for (const u of sel) {
      const dirCreches = creches.filter(c => c.directeurPrenom === u.prenom);
      if (dirCreches.length > 0) {
        alert(`${u.prenom} dirige encore ${dirCreches.map(c => c.nom).join(", ")}. Libérez ses crèches d'abord.`);
        return;
      }
    }
    try {
      for (const u of sel) {
        await axios.delete("/api/users/delete", { data: { prenom: u.prenom }, withCredentials: true });
      }
      setSelectedIds([]);
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleRetirerCreche = async () => {
    if (!actionMessage("Retirer la crèche de")) return;
    try {
      await axios.put("/api/users/retirer-creche-bulk", { ids: selectedIds }, { withCredentials: true });
      fetchUsers();
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleTransferCreche = async () => {
    const sel = getSelectedUsers();
    if (sel.length !== 1) {
      alert("Sélectionnez exactement une directrice pour transférer SES crèches.");
      return;
    }
    if (!editValue2) {
      alert("Sélectionnez une directrice cible.");
      return;
    }
    try {
      await axios.put("/api/creches/transferer-toutes", {
        fromDirectrice: sel[0].prenom,
        toDirectrice: editValue2,
      }, { withCredentials: true });
      setEditMode(null);
      setEditValue2("");
      fetchUsers();
      fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleChangeCoordo = async () => {
    if (!editValue2) {
      alert("Sélectionnez un coordinateur cible.");
      return;
    }
    if (!actionMessage(`Assigner le coordinateur "${editValue2}" à`)) return;
    try {
      await axios.put("/api/users/change-coordo-bulk", { ids: selectedIds, newCoordoPrenom: editValue2 }, { withCredentials: true });
      setEditMode(null);
      setEditValue2("");
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleRename = async () => {
    const sel = getSelectedUsers();
    if (sel.length !== 1) {
      alert("Sélectionnez exactement un utilisateur pour le renommer.");
      return;
    }
    if (!editValue) {
      alert("Entrez un nouveau prénom.");
      return;
    }
    try {
      await axios.put(`/api/users/fix-name?ancienPrenom=${sel[0].prenom}&nouveauPrenom=${editValue}`, null, { withCredentials: true });
      setEditMode(null);
      setEditValue("");
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSetMdp = async () => {
    const sel = getSelectedUsers();
    if (sel.length !== 1) {
      alert("Sélectionnez exactement un utilisateur pour définir son MDP.");
      return;
    }
    if (!editValue) {
      alert("Entrez un nouveau mot de passe.");
      return;
    }
    try {
      await axios.put("/api/users/set-password-admin", { id: sel[0].id, nouveauMdp: editValue }, { withCredentials: true });
      alert("Mot de passe défini.");
      setEditMode(null);
      setEditValue("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== HELPERS ====================
  const getCrecheNom = (u) => {
    return creches.find(c => c.directeurPrenom === u.prenom)?.nom || "";
  };

  const statutLabel = (s) => {
    if (s === "pres") return "Présents";
    if (s === "parti") return "Partis";
    return "Tous";
  };

  const mdpLabel = (m) => {
    if (m === "tous") return "MDP : Tous";
    if (m === "doit") return "MDP : À changer";
    return "MDP : OK";
  };

  const toggleRole = (role, roles, setRoles) => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const cycleStatut = (current, setter) => {
    if (current === "pres") setter("parti");
    else if (current === "parti") setter("tous");
    else setter("pres");
  };

  const cycleMdp = (current, setter) => {
    if (current === "tous") setter("doit");
    else if (current === "doit") setter("pas");
    else setter("tous");
  };

  // ==================== RENDU ====================
  const renderUserRow = (u, onClick, isSelected) => (
    <div
      key={u.id}
      onClick={onClick}
      className="list-item"
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      <span>{isSelected ? "☑" : "☐"} {u.prenom} ({u.role})</span>
      {isSelected !== undefined && (
        <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
          {u.estParti ? "❌ Parti" : "✅ Présent"} 
          {u.doitChangerMdp ? " 🔑" : ""}
        </span>
      )}
    </div>
  );

  const renderPanel = (
    title,
    usersList,
    search, setSearch,
    statut, setStatut,
    mdp, setMdp,
    roles, setRoles,
    showCreche, setShowCreche,
    selectAll, unselectAll,
    onRowClick,
    isRightPanel
  ) => (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header">
        <span>{title} ({usersList.length})</span>
      </div>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Champ recherche */}
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />

        {/* Filtres */}
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-secondary" onClick={() => cycleStatut(statut, setStatut)}>
            {statutLabel(statut)}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => cycleMdp(mdp, setMdp)}>
            {mdpLabel(mdp)}
          </button>
          <button
            className={`btn btn-sm ${showCreche ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowCreche(!showCreche)}
          >
            🏫 Crèche
          </button>
          {Object.keys(roles).map(role => (
            <button
              key={role}
              className={`btn btn-sm ${roles[role] ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleRole(role, roles, setRoles)}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Sélection/Désélection tout */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {selectAll && <button className="btn btn-sm btn-primary" onClick={selectAll}>Tout sélectionner</button>}
          {unselectAll && <button className="btn btn-sm btn-secondary" onClick={unselectAll}>Tout désélectionner</button>}
        </div>

        {/* Liste */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {usersList.length === 0 && <p className="text-secondary">Aucun utilisateur.</p>}
          {usersList.map(u => renderUserRow(u, () => onRowClick(u.id), isRightPanel))}
        </div>

        {/* Infos crèche si affiché */}
        {showCreche && usersList.length > 0 && (
          <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
            {usersList.map(u => (
              <div key={u.id}>{u.prenom} → {getCrecheNom(u) || "Aucune"}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Gestion des utilisateurs</h1>

      {/* ⚙️ Paramètres globaux */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="panel-header">
          <span>⚙️ Paramètres globaux</span>
        </div>
        <div className="panel-body">
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label>Changer MDP après (mois) :</label>
            <input
              type="number"
              className="form-input"
              value={moisChangementMdp}
              onChange={(e) => setMoisChangementMdp(parseInt(e.target.value))}
              min={1}
              max={24}
              style={{ width: "80px" }}
            />
            <button className="btn btn-primary btn-sm" onClick={() => alert("Paramètre sauvegardé (non implémenté)")}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* 👥 Panneau Users */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {/* Panneau gauche : non sélectionnés */}
        {renderPanel(
          "👥 Utilisateurs",
          nonSelectedUsers,
          leftSearch, setLeftSearch,
          leftStatut, setLeftStatut,
          leftMdp, setLeftMdp,
          leftRoles, setLeftRoles,
          leftShowCreche, setLeftShowCreche,
          selectAllLeft, null,
          selectUser,
          false
        )}

        {/* Panneau droit : sélectionnés */}
        {renderPanel(
          "✅ Sélectionnés",
          selectedUsers,
          rightSearch, setRightSearch,
          rightStatut, setRightStatut,
          rightMdp, setRightMdp,
          rightRoles, setRightRoles,
          rightShowCreche, setRightShowCreche,
          null, unselectAllRight,
          unselectUser,
          true
        )}
      </div>

      {/* Barre d'actions sur la sélection */}
      {selectedIds.length > 0 && (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
          <div className="panel-header">
            <span>🔧 Actions sur la sélection ({selectedIds.length})</span>
          </div>
          <div className="panel-body">
            <div className="btn-group" style={{ flexWrap: "wrap", gap: "0.5rem" }}>

              {/* Renommer */}
              {editMode === "rename" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <input className="form-input" placeholder="Nouveau prénom" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: "150px" }} />
                  <button className="btn btn-sm btn-primary" onClick={handleRename}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("rename")} disabled={getSelectedUsers().length !== 1}>✏️ Renommer</button>
              )}

              {/* Définir MDP */}
              {editMode === "setmdp" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <input type="text" className="form-input" placeholder="Nouveau MDP" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: "150px" }} />
                  <button className="btn btn-sm btn-primary" onClick={handleSetMdp}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("setmdp")} disabled={getSelectedUsers().length !== 1}>🔑 Définir MDP</button>
              )}

              <button className="btn btn-sm btn-primary" onClick={handleResetMdp}>🔄 Reset MDP</button>
              <button className="btn btn-sm btn-primary" onClick={handleForceChangeMdp}>🔐 Forcer chgt MDP</button>

              {/* Changer rôle */}
              <button className="btn btn-sm btn-primary" onClick={() => handleChangeRole("directrice")}>Rôle → Directrice</button>
              <button className="btn btn-sm btn-primary" onClick={() => handleChangeRole("coordinateur")}>Rôle → Coordinatrice</button>
              <button className="btn btn-sm btn-primary" onClick={() => handleChangeRole("pdg")}>Rôle → PDG</button>

              <button className="btn btn-sm btn-danger" onClick={handleDesactiver}>❌ Désactiver</button>
              <button className="btn btn-sm btn-success" onClick={handleReactiver}>↩️ Réactiver</button>
              <button className="btn btn-sm btn-warning" onClick={handleRetirerCreche}>🏫 Retirer crèche</button>

              {/* Transférer crèches */}
              {editMode === "transferCreche" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <select className="form-select" value={editValue2} onChange={e => setEditValue2(e.target.value)} style={{ width: "150px" }}>
                    <option value="">-- Directrice cible --</option>
                    {users.filter(u => u.role === "directrice" && u.id !== getSelectedUsers()[0]?.id).map(u => (
                      <option key={u.id} value={u.prenom}>{u.prenom}</option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleTransferCreche}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-warning" onClick={() => setEditMode("transferCreche")} disabled={getSelectedUsers().length !== 1}>📦 Transférer crèches</button>
              )}

              {/* Changer coordo */}
              {editMode === "changeCoordo" ? (
                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                  <select className="form-select" value={editValue2} onChange={e => setEditValue2(e.target.value)} style={{ width: "150px" }}>
                    <option value="">-- Coordinatrice --</option>
                    {users.filter(u => u.role === "coordinateur").map(u => (
                      <option key={u.id} value={u.prenom}>{u.prenom}</option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleChangeCoordo}>✅</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>✖</button>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => setEditMode("changeCoordo")}>👥 Changer coordo</button>
              )}

              <button className="btn btn-sm btn-danger" onClick={handleSupprimer}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;