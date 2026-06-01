import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDangerZone = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ==================== ÉTATS ====================
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState(true);

  // Filtres
  const [filterRole, setFilterRole] = useState("");    // "" = tous, sinon "directrice", "pdg", etc.
  const [filterStatut, setFilterStatut] = useState(""); // "" = tous, "actif", "parti"

  // Création
  const [newPrenom, setNewPrenom] = useState("");
  const [newRole, setNewRole] = useState("directrice");
  const [newMdp, setNewMdp] = useState(null);

  // Modification
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editPrenom, setEditPrenom] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editMdp, setEditMdp] = useState("");

  // Paramètre global
  const [moisChangementMdp, setMoisChangementMdp] = useState(6);

  // ==================== FETCH ====================
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      setUsers(res.data);
    } catch (e) {
      alert(e.response?.data || "Erreur chargement utilisateurs");
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/accueil"); return; }
    fetchUsers();
  }, [user]);

  // ==================== FILTRES ====================
  const filteredUsers = users
    .filter(u => {
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatut === "actif" && u.estParti) return false;
      if (filterStatut === "parti" && !u.estParti) return false;
      return true;
    })
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.prenom.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    })
    .sort((a, b) => {
      // Group by role
      const order = ["superadmin", "pdg", "coordinateur", "directrice"];
      const roleA = order.indexOf(a.role);
      const roleB = order.indexOf(b.role);
      if (roleA !== roleB) return roleA - roleB;
      return a.prenom.localeCompare(b.prenom);
    });

  // ==================== ACTIONS ====================
  const handleCreateUser = async () => {
    try {
      const res = await axios.post(`/api/users/create?prenom=${newPrenom}&role=${newRole}`, null, { withCredentials: true });
      setNewMdp(res.data);
      setNewPrenom("");
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSelectUser = (u) => {
    if (selectedUserId === u.id) {
      setSelectedUserId(null);
      setEditPrenom("");
      setEditRole("");
      setEditMdp("");
    } else {
      setSelectedUserId(u.id);
      setEditPrenom(u.prenom);
      setEditRole(u.role);
      setEditMdp("");
    }
  };

  const handleRenameUser = async () => {
    try {
      await axios.put(`/api/users/fix-name?ancienPrenom=${users.find(u => u.id === selectedUserId)?.prenom}&nouveauPrenom=${editPrenom}`, null, { withCredentials: true });
      fetchUsers();
      setSelectedUserId(null);
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleChangeRole = async () => {
    try {
      await axios.put(`/api/users/change-role`, { id: selectedUserId, nouveauRole: editRole }, { withCredentials: true });
      fetchUsers();
      setSelectedUserId(null);
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleSetPassword = async () => {
    try {
      await axios.put(`/api/users/set-password-admin`, { id: selectedUserId, nouveauMdp: editMdp }, { withCredentials: true });
      alert("Mot de passe défini.");
      setEditMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleResetPassword = async (u) => {
    if (!window.confirm("Réinitialiser le mot de passe de " + u.prenom + " ?")) return;
    try {
      const res = await axios.put("/api/users/reset-password", { prenom: u.prenom }, { withCredentials: true });
      alert(res.data);
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleForceChangeMdp = async (u) => {
    try {
      await axios.put(`/api/users/force-change-mdp`, { id: u.id }, { withCredentials: true });
      alert(u.prenom + " devra changer son mot de passe à la prochaine connexion.");
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleDisableUser = async (u) => {
    if (!window.confirm("Désactiver " + u.prenom + " ?")) return;
    try {
      await axios.put("/api/users/disable", { prenom: u.prenom }, { withCredentials: true });
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleReactiverUser = async (u) => {
    try {
      await axios.put(`/api/users/reactiver`, { prenom: u.prenom }, { withCredentials: true });
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm("SUPPRIMER DÉFINITIVEMENT " + u.prenom + " ?")) return;
    try {
      await axios.delete("/api/users/delete", { data: { prenom: u.prenom } });
      fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== RENDU ====================
  return (
    <div className="page-container">
      <h1>Super Administration</h1>

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
      <div className="card">
        <div className="panel-header" onClick={() => setShowPanel(!showPanel)}>
          <span>👥 Users</span>
          <span>{showPanel ? "▲" : "▼"}</span>
        </div>
        {showPanel && (
          <div className="panel-body">

            {/* Filtres */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: "150px" }}
              />
              <button className={`btn btn-sm ${filterRole === "" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterRole("")}>Tous</button>
              <button className={`btn btn-sm ${filterRole === "directrice" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterRole("directrice")}>Directrices</button>
              <button className={`btn btn-sm ${filterRole === "coordinateur" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterRole("coordinateur")}>Coordinatrices</button>
              <button className={`btn btn-sm ${filterRole === "pdg" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterRole("pdg")}>PDG</button>
              <button className={`btn btn-sm ${filterRole === "superadmin" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterRole("superadmin")}>SuperAdmins</button>
              <span style={{ margin: "0 0.5rem", color: "var(--gray-400)" }}>|</span>
              <button className={`btn btn-sm ${filterStatut === "" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterStatut("")}>Tous</button>
              <button className={`btn btn-sm ${filterStatut === "actif" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterStatut("actif")}>Actifs</button>
              <button className={`btn btn-sm ${filterStatut === "parti" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterStatut("parti")}>Partis</button>
            </div>

            {/* Création */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Prénom"
                value={newPrenom}
                onChange={(e) => setNewPrenom(e.target.value)}
                className="form-input"
                style={{ width: "150px" }}
              />
              <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: "150px" }}>
                <option value="directrice">Directrice</option>
                <option value="coordinateur">Coordinateur</option>
                <option value="pdg">PDG</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleCreateUser}>Créer</button>
              {newMdp && <span className="success-message">✅ MDP : {newMdp}</span>}
            </div>

            {/* Tableau */}
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Prénom</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>MDP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={selectedUserId === u.id ? { backgroundColor: "var(--info-bg)" } : {}}>
                      <td>{u.id}</td>
                      <td>{u.prenom}</td>
                      <td>{u.role}</td>
                      <td>{u.estParti ? "❌ Parti" : "✅ Actif"}</td>
                      <td>{u.doitChangerMdp ? "🔑 Changement requis" : "✅ Défini"}</td>
                      <td>
                        <div className="btn-group" style={{ gap: "4px" }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleSelectUser(u)}>
                            {selectedUserId === u.id ? "✖" : "✏️"}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleResetPassword(u)}>🔄 MDP</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleForceChangeMdp(u)}>🔐 Forcer</button>
                          {u.estParti ? (
                            <button className="btn btn-sm btn-success" onClick={() => handleReactiverUser(u)}>↩️ Réactiver</button>
                          ) : (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDisableUser(u)}>❌ Désactiver</button>
                          )}
                          {u.role !== "superadmin" && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formulaire d'édition (si un user est sélectionné) */}
            {selectedUserId && (
              <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--gray-50)" }}>
                <div className="panel-header">
                  <span>✏️ Modifier : {users.find(u => u.id === selectedUserId)?.prenom}</span>
                </div>
                <div className="panel-body" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={editPrenom}
                    onChange={(e) => setEditPrenom(e.target.value)}
                    className="form-input"
                    style={{ width: "150px" }}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleRenameUser}>Renommer</button>

                  <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: "150px" }}>
                    <option value="directrice">Directrice</option>
                    <option value="coordinateur">Coordinateur</option>
                    <option value="pdg">PDG</option>
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleChangeRole}>Changer rôle</button>

                  <input
                    type="text"
                    placeholder="Nouveau MDP"
                    value={editMdp}
                    onChange={(e) => setEditMdp(e.target.value)}
                    className="form-input"
                    style={{ width: "150px" }}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleSetPassword}>Définir MDP</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;