import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ==================== ÉTATS ====================
  const [users, setUsers] = useState([]);
  const [creches, setCreches] = useState([]);
  const [vaccins, setVaccins] = useState([]);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [mdpAdmin, setMdpAdmin] = useState("");
  const [showEditVaccin, setShowEditVaccin] = useState(false);
  const [editVaccinId, setEditVaccinId] = useState("");
  const [editVaccin, setEditVaccin] = useState({
    nom: "",
    maladiesPrevenues: "",
    pourEnfantsNesAvant: "",
    pourEnfantsNesApres: "",
    agePremiereVaccination: "",
    nbMoisPremierDelai: "",
    nbMoisDeuxiemeDelai: "",
  });

  // Panneaux rétractables
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCreche, setShowCreateCreche] = useState(false);
  const [showCreateVaccin, setShowCreateVaccin] = useState(false);
  const [showAssignDirectrice, setShowAssignDirectrice] = useState(false);

  // Champs formulaire création utilisateur
  const [newUserPrenom, setNewUserPrenom] = useState("");
  const [newUserMdp, setNewUserMdp] = useState(null);

  // Champs formulaire création crèche
  const [newCrecheNom, setNewCrecheNom] = useState("");
  const [newCrecheDirecteur, setNewCrecheDirecteur] = useState("");

  // Champs formulaire création vaccin
  const [newVaccin, setNewVaccin] = useState({
    nom: "",
    maladiesPrevenues: "",
    pourEnfantsNesAvant: "",
    pourEnfantsNesApres: "",
    agePremiereVaccination: "",
    nbMoisPremierDelai: "",
    nbMoisDeuxiemeDelai: "",
  });

  // Assignation directrice
  const [assignations, setAssignations] = useState({}); // { nomCreche: directeurPrenom }

  // ==================== CHARGEMENT INITIAL ====================
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
    fetchCreches();
    fetchVaccins();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur chargement users", err);
      const message = err.response?.data || "Erreur lors de la recuperation de la liste des directrices.";
      alert(message);
    }
  };

  const fetchCreches = async () => {
    try {
      const res = await axios.get("/api/creches", { withCredentials: true });
      setCreches(res.data);
      // Initialiser les assignations avec les directeurs actuels
      const initAssignations = {};
      res.data.forEach((c) => {
        initAssignations[c.nom] = c.directeurPrenom;
      });
      setAssignations(initAssignations);
    } catch (err) {
      console.error("Erreur chargement creches", err);
      const message = err.response?.data || "Erreur lors de la recuperation de la liste des creches.";
      alert(message);
    }
  };

  const fetchVaccins = async () => {
    try {
      const res = await axios.get("/api/vaccins", { withCredentials: true });
      setVaccins(res.data);
    } catch (err) {
      console.error("Erreur chargement vaccins", err);
      const message = err.response?.data || "Erreur lors de la recuperation de la liste des vaccins.";
      alert(message);
    }
  };

  // ==================== ACTIONS ====================

  // Créer un utilisateur
  const handleCreateUser = async () => {
    try {
      const res = await axios.post(
        "/api/users/create?prenom=" + newUserPrenom,
        null,
        { withCredentials: true }
      );
      setNewUserMdp(res.data);
      setNewUserPrenom("");
      fetchUsers();
    } catch (err) {
      console.error("Erreur création user", err);
      const message = err.response?.data || "Erreur lors de la creation de l'utilisateur.";
      alert(message);
    }
  };

  // Créer une crèche
  const handleCreateCreche = async () => {
    try {
      await axios.post(
        "/api/creches",
        { nom: newCrecheNom, directeur: newCrecheDirecteur },
        { withCredentials: true }
      );
      setNewCrecheNom("");
      setNewCrecheDirecteur("");
      fetchCreches();
    } catch (err) {
      console.error("Erreur création creche", err);
      const message = err.response?.data || "Erreur lors de la creation de la creche.";
      alert(message);
    }
  };

  // Créer un vaccin
  const handleCreateVaccin = async () => {
    try {
      const payload = {
        nom: newVaccin.nom,
        listeMaladies: newVaccin.maladiesPrevenues,
        pourEnfantsNesAvant: newVaccin.pourEnfantsNesAvant || null,
        pourEnfantsNesApres: newVaccin.pourEnfantsNesApres || null,
        agePremiereVaccination: parseInt(newVaccin.agePremiereVaccination),
        nbMoisPremierDelai: parseInt(newVaccin.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: newVaccin.nbMoisDeuxiemeDelai
          ? parseInt(newVaccin.nbMoisDeuxiemeDelai)
          : null,
      };
      await axios.post("/api/vaccins", payload, { withCredentials: true });
      setNewVaccin({
        nom: "",
        maladiesPrevenues: "",
        pourEnfantsNesAvant: "",
        pourEnfantsNesApres: "",
        agePremiereVaccination: "",
        nbMoisPremierDelai: "",
        nbMoisDeuxiemeDelai: "",
      });
      fetchVaccins();
    } catch (err) {
      console.error("Erreur création vaccin", err);
      const message = err.response?.data || "Erreur lors de la creation du vaccin.";
      alert(message);
    }
  };

  // Changer le directeur d'une crèche
  const handleChangeDirecteur = async (nomCreche) => {
    try {
      await axios.put(
        "/api/creches/change-directeur",
        { nom: nomCreche, directeur: assignations[nomCreche] },
        { withCredentials: true }
      );
      fetchCreches();
    } catch (err) {
      console.error("Erreur changement directeur", err);
      const message = err.response?.data || "Erreur lors de la tentative de changement de directeur.";
      alert(message);
    }
  };


  const handleDisableUser = async (prenom) => {
    if (!window.confirm("Désactiver " + prenom + " ?")) return;
    try {
        await axios.put("/api/users/disable", { prenom: prenom }, { withCredentials: true });
        fetchUsers();
    } catch (err) {
        console.error("Erreur désactivation user", err);
        const message = err.response?.data || "Erreur lors de la désactivation du compte.";
        alert(message);
    }
  };
  

  const handleRenameUser = async (ancienPrenom) => {
    const nouveauPrenom = prompt("Nouveau prénom pour " + ancienPrenom + " :");
    if (!nouveauPrenom) return;
    try {
        await axios.put("/api/users/fix-name?ancienPrenom=" + ancienPrenom + "&nouveauPrenom=" + nouveauPrenom, null, { withCredentials: true });
        fetchUsers();
    } catch (err) {
        console.error("Erreur renommage", err);
        const message = err.response?.data || "Erreur lors du renommage de cet utilisateur.";
        alert(message);
    }
  };

  const handleResetPassword = async (prenom) => {
      if (!window.confirm("Réinitialiser le mot de passe de " + prenom + " ?")) return;
      try {
          const res = await axios.put("/api/users/reset-password", { prenom: prenom }, { withCredentials: true });
          alert(res.data);
          fetchUsers();
      } catch (err) {
          console.error("Erreur reset MDP", err);
          const message = err.response?.data || "Erreur lors de la reinitialisation du mot de passe.";
          alert(message);
      }
  };





  const handleDeleteUser = async (prenom) => {
      if (!mdpAdmin) { alert("Veuillez entrer votre mot de passe admin"); return; }
      if (!window.confirm("Supprimer DÉFINITIVEMENT " + prenom + " ?")) return;
      try {
          await axios.delete("/api/users/delete", { data: { prenom, mdpAdmin }, withCredentials: true });
          fetchUsers();
          fetchCreches();
      } catch (err) {
          alert(err.response?.data || "Erreur suppression");
      }
  };

  const handleDeleteCreche = async (nom) => {
      if (!mdpAdmin) { alert("Veuillez entrer votre mot de passe admin"); return; }
      if (!window.confirm("Supprimer DÉFINITIVEMENT la crèche " + nom + " ?")) return;
      try {
          await axios.delete("/api/creches/delete", { data: { nom, mdpAdmin }, withCredentials: true });
          fetchCreches();
      } catch (err) {
          alert(err.response?.data || "Erreur suppression");
      }
  };

  const handleObsoleteVaccin = async (id) => {
      if (!mdpAdmin) { alert("Veuillez entrer votre mot de passe admin"); return; }
      if (!window.confirm("Rendre ce vaccin obsolète ? Il restera en historique mais n'apparaîtra plus dans les sélections.")) return;
      try {
          await axios.put("/api/vaccins/rendre-obsolete", { id, mdpAdmin }, { withCredentials: true });
          fetchVaccins();
      } catch (err) {
          alert(err.response?.data || "Erreur");
      }
  };



  const handleRenameCreche = async (ancienNom) => {
      const nouveauNom = prompt("Nouveau nom pour " + ancienNom + " :");
      if (!nouveauNom || !mdpAdmin) return;
      try {
          await axios.put("/api/creches/rename", { ancienNom, nouveauNom, mdpAdmin }, { withCredentials: true });
          fetchCreches();
      } catch (err) {
          alert(err.response?.data || "Erreur renommage");
      }
  };

  const handleTransferEnfants = async (fromCreche) => {
      const toCreche = prompt("Transférer tous les enfants de " + fromCreche + " vers quelle crèche ?");
      if (!toCreche || !mdpAdmin) return;
      try {
          await axios.put("/api/enfants/transfer-all", { from: fromCreche, to: toCreche, mdpAdmin }, { withCredentials: true });
          fetchCreches();
      } catch (err) {
          alert(err.response?.data || "Erreur transfert");
      }
  };





  const handleEditVaccin = async () => {
    try {
      const payload = {
        id: parseInt(editVaccinId),
        nom: editVaccin.nom,
        listeMaladies: editVaccin.maladiesPrevenues,
        pourEnfantsNesAvant: editVaccin.pourEnfantsNesAvant || null,
        pourEnfantsNesApres: editVaccin.pourEnfantsNesApres || null,
        agePremiereVaccination: parseInt(editVaccin.agePremiereVaccination),
        nbMoisPremierDelai: parseInt(editVaccin.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: editVaccin.nbMoisDeuxiemeDelai
          ? parseInt(editVaccin.nbMoisDeuxiemeDelai)
          : null,
      };
      await axios.put("/api/vaccins/edit", payload, { withCredentials: true });
      setShowEditVaccin(false);
      fetchVaccins();
    } catch (err) {
      alert(err.response?.data || "Erreur modification vaccin");
    }
  };
  
  const openEditVaccin = (v) => {
    setEditVaccinId(v.id);
    setEditVaccin({
      nom: v.nom,
      maladiesPrevenues: v.maladiesPrevenues,
      pourEnfantsNesAvant: v.pourEnfantsNesAvant || "",
      pourEnfantsNesApres: v.pourEnfantsNesApres || "",
      agePremiereVaccination: v.agePremiereVaccination || "",
      nbMoisPremierDelai: v.nbMoisPremierDelai || "",
      nbMoisDeuxiemeDelai: v.nbMoisDeuxiemeDelai || "",
    });
    setShowEditVaccin(true);
  };






  // ==================== RENDU ====================
  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <h1>Admin</h1>

      {/* ===== CRÉER UN UTILISATEUR ===== */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle} onClick={() => setShowCreateUser(!showCreateUser)}>
          <span>Créer une directrice</span>
          <span>{showCreateUser ? "▲" : "▼"}</span>
        </div>
        {showCreateUser && (
          <div style={panelBodyStyle}>
            <input
              type="text"
              placeholder="Prénom"
              value={newUserPrenom}
              onChange={(e) => setNewUserPrenom(e.target.value)}
            />
            <button onClick={handleCreateUser}>Créer</button>
            {newUserMdp && <p>✅ {newUserMdp}</p>}
          </div>
        )}
      </div>


        




      {/* ===== CRÉER UNE CRÈCHE ===== */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle} onClick={() => setShowCreateCreche(!showCreateCreche)}>
          <span>Créer une crèche</span>
          <span>{showCreateCreche ? "▲" : "▼"}</span>
        </div>
        {showCreateCreche && (
          <div style={panelBodyStyle}>
            <input
              type="text"
              placeholder="Nom de la crèche"
              value={newCrecheNom}
              onChange={(e) => setNewCrecheNom(e.target.value)}
            />
            <select
              value={newCrecheDirecteur}
              onChange={(e) => setNewCrecheDirecteur(e.target.value)}
            >
              <option value="">-- Choisir une directrice --</option>
              {users
                .filter((u) => u.role === "directrice")
                .map((u) => (
                  <option key={u.id} value={u.prenom}>
                    {u.prenom}
                  </option>
                ))}
            </select>
            <button onClick={handleCreateCreche}>Créer</button>
          </div>
        )}
      </div>

      {/* ===== CRÉER UN VACCIN ===== */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle} onClick={() => setShowCreateVaccin(!showCreateVaccin)}>
          <span>Créer un vaccin</span>
          <span>{showCreateVaccin ? "▲" : "▼"}</span>
        </div>
        {showCreateVaccin && (
          <div style={panelBodyStyle}>
            <input placeholder="Nom" value={newVaccin.nom} onChange={(e) => setNewVaccin({ ...newVaccin, nom: e.target.value })} />
            <input placeholder="Maladies" value={newVaccin.maladiesPrevenues} onChange={(e) => setNewVaccin({ ...newVaccin, maladiesPrevenues: e.target.value })} />
            <input placeholder="Nés avant (année)" value={newVaccin.pourEnfantsNesAvant} onChange={(e) => setNewVaccin({ ...newVaccin, pourEnfantsNesAvant: e.target.value })} />
            <input placeholder="Nés après (année)" value={newVaccin.pourEnfantsNesApres} onChange={(e) => setNewVaccin({ ...newVaccin, pourEnfantsNesApres: e.target.value })} />
            <input placeholder="Âge 1ère vaccination (mois)" value={newVaccin.agePremiereVaccination} onChange={(e) => setNewVaccin({ ...newVaccin, agePremiereVaccination: e.target.value })} />
            <input placeholder="Délai 1 (mois)" value={newVaccin.nbMoisPremierDelai} onChange={(e) => setNewVaccin({ ...newVaccin, nbMoisPremierDelai: e.target.value })} />
            <input placeholder="Délai 2 (mois)" value={newVaccin.nbMoisDeuxiemeDelai} onChange={(e) => setNewVaccin({ ...newVaccin, nbMoisDeuxiemeDelai: e.target.value })} />
            <button onClick={handleCreateVaccin}>Créer</button>
          </div>
        )}
      </div>










        {/* ===== MODIFIER UN VACCIN ===== */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle} onClick={() => setShowEditVaccin(!showEditVaccin)}>
            <span>Modifier un vaccin</span>
            <span>{showEditVaccin ? "▲" : "▼"}</span>
          </div>
          {showEditVaccin && (
            <div style={panelBodyStyle}>
              <select
                value={editVaccinId}
                onChange={(e) => {
                  const v = vaccins.find(v => v.id === parseInt(e.target.value));
                  if (v) openEditVaccin(v);
                }}
              >
                <option value="">-- Choisir un vaccin --</option>
                {vaccins.map(v => (
                  <option key={v.id} value={v.id}>{v.nom}</option>
                ))}
              </select>
              {editVaccinId && (
                <>
                  <input placeholder="Nom" value={editVaccin.nom} onChange={(e) => setEditVaccin({ ...editVaccin, nom: e.target.value })} />
                  <input placeholder="Maladies" value={editVaccin.maladiesPrevenues} onChange={(e) => setEditVaccin({ ...editVaccin, maladiesPrevenues: e.target.value })} />
                  <input placeholder="Nés avant (année)" value={editVaccin.pourEnfantsNesAvant} onChange={(e) => setEditVaccin({ ...editVaccin, pourEnfantsNesAvant: e.target.value })} />
                  <input placeholder="Nés après (année)" value={editVaccin.pourEnfantsNesApres} onChange={(e) => setEditVaccin({ ...editVaccin, pourEnfantsNesApres: e.target.value })} />
                  <input placeholder="Âge 1ère vaccination (mois)" value={editVaccin.agePremiereVaccination} onChange={(e) => setEditVaccin({ ...editVaccin, agePremiereVaccination: e.target.value })} />
                  <input placeholder="Délai 1 (mois)" value={editVaccin.nbMoisPremierDelai} onChange={(e) => setEditVaccin({ ...editVaccin, nbMoisPremierDelai: e.target.value })} />
                  <input placeholder="Délai 2 (mois)" value={editVaccin.nbMoisDeuxiemeDelai} onChange={(e) => setEditVaccin({ ...editVaccin, nbMoisDeuxiemeDelai: e.target.value })} />
                  <button onClick={handleEditVaccin}>Enregistrer</button>
                </>
              )}
            </div>
          )}
        </div>









      {/* ===== ASSIGNER DIRECTRICE ===== */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle} onClick={() => setShowAssignDirectrice(!showAssignDirectrice)}>
          <span>Assigner directrice à une crèche</span>
          <span>{showAssignDirectrice ? "▲" : "▼"}</span>
        </div>
        {showAssignDirectrice && (
          <div style={panelBodyStyle}>
            {creches.map((creche) => (
              <div key={creche.nom} style={{ marginBottom: "10px" }}>
                <strong>{creche.nom}</strong> : 
                <select
                  value={assignations[creche.nom] || ""}
                  onChange={(e) =>
                    setAssignations({ ...assignations, [creche.nom]: e.target.value })
                  }
                >
                  <option value="">-- Choisir --</option>
                  {users
                    .filter((u) => u.role === "directrice")
                    .map((u) => (
                      <option key={u.id} value={u.prenom}>
                        {u.prenom}
                      </option>
                    ))}
                </select>
                <button onClick={() => handleChangeDirecteur(creche.nom)}>
                  Appliquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>




        {/* ===== GÉRER LES DIRECTRICES ===== */}
        {users.filter(u => u.role === "directrice" && !u.estParti).length === 0 && (
            <p>Aucune directrice active.</p>
        )}
        {users.filter(u => u.role === "directrice" && !u.estParti).map(u => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <span>{u.prenom}</span>
                <div>
                    <button onClick={() => handleRenameUser(u.prenom)} style={{ marginRight: "5px" }}>✏️</button>
                    <button onClick={() => handleResetPassword(u.prenom)} style={{ marginRight: "5px" }}>🔑</button>
                    <button onClick={() => handleDisableUser(u.prenom)}>❌</button>
                </div>
            </div>
        ))}











  {/* ===== ZONE DANGEREUSE ===== */}
  <div style={{ ...panelStyle, border: "2px solid red" }}>
      <div style={{ ...panelHeaderStyle, background: "#ffe0e0" }}>
          <span>⚠️ Zone dangereuse</span>
      </div>
      <div style={panelBodyStyle}>
          <input
              type="password"
              placeholder="Votre mot de passe admin"
              value={mdpAdmin}
              onChange={(e) => setMdpAdmin(e.target.value)}
          />
          
          <h4>Supprimer une directrice</h4>
          {users.filter(u => u.role === "directrice").map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{u.prenom}</span>
                  <button onClick={() => handleDeleteUser(u.prenom)}>🗑️</button>
              </div>
          ))}
          
          

          <h4>Crèches</h4>
          {creches.map(c => (
              <div key={c.nom} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <span>{c.nom}</span>
                  <div>
                      <button onClick={() => handleRenameCreche(c.nom)} style={{ marginRight: "5px" }}>✏️</button>
                      <button onClick={() => handleTransferEnfants(c.nom)} style={{ marginRight: "5px" }}>➡️</button>
                      <button onClick={() => handleDeleteCreche(c.nom)}>🗑️</button>
                  </div>
              </div>
          ))}
          
          <h4>Vaccins</h4>
          {vaccins.map(v => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{v.nom} {v.estObsolete ? "(obsolète)" : ""}</span>
                  <button onClick={() => handleObsoleteVaccin(v.id)}>🔒</button>
              </div>
          ))}
      </div>
  </div>















      {/* ===== LISTES ===== */}
      <div style={{ marginTop: "30px" }}>
        <h3>Utilisateurs</h3>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.prenom} — {u.role} {u.estParti ? "(inactif)" : ""}
            </li>
          ))}
        </ul>

        <h3>Crèches</h3>
        <ul>
          {creches.map((c) => (
            <li key={c.nom}>
              {c.nom} — Dirigée par {c.directeurPrenom}
            </li>
          ))}
        </ul>

        <h3>Vaccins</h3>
        <ul>
          {vaccins.map((v) => (
            <li key={v.id}>
              {v.nom} — {v.maladiesPrevenues}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ==================== STYLES ====================
const panelStyle = {
  border: "1px solid #ccc",
  borderRadius: "5px",
  marginBottom: "10px",
};

const panelHeaderStyle = {
  background: "#f0f0f0",
  padding: "10px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "bold",
};

const panelBodyStyle = {
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export default Admin;