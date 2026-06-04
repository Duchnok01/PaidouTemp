import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Parametres = () => {
  const { user, effectiveUser } = useAuth();
  const navigate = useNavigate();

  // Onglets
  const [tab, setTab] = useState("generaux"); // "generaux" | "permissions"

  // Paramètres généraux
  const [expirationMdp, setExpirationMdp] = useState(6);
  const [inactiviteMax, setInactiviteMax] = useState(12);
  const [seuilProche, setSeuilProche] = useState(14);
  const [delaiRappel, setDelaiRappel] = useState(7);
  const [savedParams, setSavedParams] = useState(false);

  // Permissions
  const [roles] = useState(["superadmin", "pdg", "coordinateur", "directrice"]);
  const [selectedRole, setSelectedRole] = useState("pdg");
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [savedPerms, setSavedPerms] = useState(false);

  // ==================== FETCH ====================
  const fetchParametres = async () => {
    try {
      const res = await axios.get("/api/parametres", { withCredentials: true });
      if (res.data) {
        setExpirationMdp(res.data.expirationMdp || 6);
        setInactiviteMax(res.data.inactiviteMax || 12);
        setSeuilProche(res.data.seuilProche || 14);
        setDelaiRappel(res.data.delaiRappel || 7);
      }
    } catch (e) { console.error("Erreur chargement paramètres", e); }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await axios.get("/api/superadmin/permissions", { withCredentials: true });
      setAllPermissions(res.data);
    } catch (e) { console.error("Erreur chargement permissions", e); }
  };

  const fetchRolePermissions = async (role) => {
    try {
      const res = await axios.get(`/api/superadmin/permissions/${role}`, { withCredentials: true });
      setRolePermissions(res.data.map(p => p.id));
    } catch (e) { console.error("Erreur chargement permissions rôle", e); }
  };

  useEffect(() => {
    if (!effectiveUser || effectiveUser.role !== "superadmin") { navigate("/accueil"); return; }
    fetchParametres();
    fetchAllPermissions();
  }, [user]);

  useEffect(() => {
    if (tab === "permissions") {
      fetchRolePermissions(selectedRole);
    }
  }, [tab, selectedRole]);

  // ==================== ACTIONS ====================
  const handleSaveParams = async () => {
    try {
      await axios.put("/api/parametres", {
        expirationMdp, inactiviteMax, seuilProche, delaiRappel,
      }, { withCredentials: true });
      setSavedParams(true);
      setTimeout(() => setSavedParams(false), 3000);
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const togglePermission = async (permissionId) => {
    const hasIt = rolePermissions.includes(permissionId);
    try {
      if (hasIt) {
        await axios.delete(`/api/superadmin/permissions/${selectedRole}/${permissionId}`, { withCredentials: true });
        setRolePermissions(prev => prev.filter(id => id !== permissionId));
      } else {
        await axios.post(`/api/superadmin/permissions/${selectedRole}/${permissionId}`, null, { withCredentials: true });
        setRolePermissions(prev => [...prev, permissionId]);
      }
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // Regrouper les permissions par catégorie
  const permissionsByCategorie = allPermissions.reduce((acc, p) => {
    const cat = p.categorie || "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categorieLabels = {
    "users": "👥 Utilisateurs",
    "creches": "🏫 Crèches",
    "enfants": "👶 Enfants",
    "vaccins": "💉 Vaccins",
    "enregistrements": "📋 Enregistrements",
    "logs": "📝 Logs",
    "parametres": "⚙️ Paramètres",
  };

  // ==================== RENDU ====================
  return (
    <div className="page-container">
      <h1>Paramètres</h1>

      {/* Onglets */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className={`btn ${tab === "generaux" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("generaux")}
        >
          ⚙️ Paramètres généraux
        </button>
        <button
          className={`btn ${tab === "permissions" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("permissions")}
        >
          🔐 Permissions
        </button>
      </div>

      {/* Onglet Paramètres généraux */}
      {tab === "generaux" && (
        <div className="card">
          <div className="panel-header"><span>⚙️ Configuration</span></div>
          <div className="panel-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
              <div className="form-group">
                <label>Expiration du mot de passe (mois)</label>
                <input type="number" className="form-input" value={expirationMdp}
                  onChange={(e) => setExpirationMdp(parseInt(e.target.value))} min={1} max={12} />
                <small className="text-secondary">Tous les X mois, les utilisateurs devront changer leur mot de passe.</small>
              </div>
              <div className="form-group">
                <label>Inactivité maximale (mois)</label>
                <input type="number" className="form-input" value={inactiviteMax}
                  onChange={(e) => setInactiviteMax(parseInt(e.target.value))} min={1} max={24} />
                <small className="text-secondary">Si aucun enregistrement créé depuis X mois, l'utilisateur est désactivé.</small>
              </div>
              <div className="form-group">
                <label>Seuil d'alerte proche (jours)</label>
                <input type="number" className="form-input" value={seuilProche}
                  onChange={(e) => setSeuilProche(parseInt(e.target.value))} min={7} max={30} />
                <small className="text-secondary">Notification X jours avant la date prévue d'un vaccin.</small>
              </div>
              <div className="form-group">
                <label>Délai de rappel (jours)</label>
                <input type="number" className="form-input" value={delaiRappel}
                  onChange={(e) => setDelaiRappel(parseInt(e.target.value))} min={1} max={30} />
                <small className="text-secondary">Notification de rappel tous les X jours après la date prévue.</small>
              </div>
              <button className="btn btn-primary" onClick={handleSaveParams}>💾 Sauvegarder</button>
              {savedParams && <span className="success-message">✅ Paramètres sauvegardés.</span>}
            </div>
          </div>
        </div>
      )}

      {/* Onglet Permissions */}
      {tab === "permissions" && (
        <div className="card">
          <div className="panel-header"><span>🔐 Permissions par rôle</span></div>
          <div className="panel-body">
            {/* Sélection du rôle */}
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Rôle :</label>
              <select className="form-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: "200px" }}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Tableau des permissions par catégorie */}
            {Object.keys(categorieLabels).map(cat => {
              const perms = permissionsByCategorie[cat];
              if (!perms || perms.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{categorieLabels[cat]}</h3>
                  <table className="table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>✅</th>
                        <th>Code</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perms.map(p => (
                        <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => togglePermission(p.id)}>
                          <td>
                            <input type="checkbox" checked={rolePermissions.includes(p.id)} readOnly />
                          </td>
                          <td><code>{p.code}</code></td>
                          <td style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametres;