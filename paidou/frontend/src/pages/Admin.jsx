import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // États généraux
  const [users, setUsers] = useState([]);
  const [creches, setCreches] = useState([]);
  const [vaccins, setVaccins] = useState([]);

  // Visibilité panneaux
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCreche, setShowCreateCreche] = useState(false);
  const [showCreateVaccin, setShowCreateVaccin] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showInfos, setShowInfos] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [dangerMdp, setDangerMdp] = useState("");
  const [showUltra, setShowUltra] = useState(false);
  const [ultraMdp, setUltraMdp] = useState("");

  // Créations
  const [newUserPrenom, setNewUserPrenom] = useState("");
  const [newUserMdp, setNewUserMdp] = useState(null);
  const [newCrecheNom, setNewCrecheNom] = useState("");
  const [newCrecheDirecteur, setNewCrecheDirecteur] = useState("");
  const [newVaccin, setNewVaccin] = useState({
    nom: "", maladiesPrevenues: "", pourEnfantsNesAvant: "", pourEnfantsNesApres: "",
    agePremiereVaccination: "", nbMoisPremierDelai: "", nbMoisDeuxiemeDelai: ""
  });

  // Zone dangereuse
  const [renameCrecheSelect, setRenameCrecheSelect] = useState("");
  const [renameCrecheNewName, setRenameCrecheNewName] = useState("");
  const [changeDirCreche, setChangeDirCreche] = useState("");
  const [changeDirNewDir, setChangeDirNewDir] = useState("");
  const [fermerCrecheSelect, setFermerCrecheSelect] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [delUserSelect, setDelUserSelect] = useState("");
  const [editVaccinId, setEditVaccinId] = useState("");
  const [editVaccin, setEditVaccin] = useState({ ...newVaccin });
  const [obsoleteVaccinSelect, setObsoleteVaccinSelect] = useState("");

  // Zone ultra
  const [ultraDelCreche, setUltraDelCreche] = useState("");
  const [ultraDelUser, setUltraDelUser] = useState("");
  const [ultraDelVaccin, setUltraDelVaccin] = useState("");
  const [ultraEvCreche, setUltraEvCreche] = useState("");
  const [ultraEvEnfant, setUltraEvEnfant] = useState("");
  const [ultraEvVaccin, setUltraEvVaccin] = useState("");
  const [ultraEvDate, setUltraEvDate] = useState("");
  const [ultraEvEnfantsList, setUltraEvEnfantsList] = useState([]);
  const [ultraEvRegistrementsList, setUltraEvRegistrementsList] = useState([]);
  const [ultraDelEnfantCreche, setUltraDelEnfantCreche] = useState("");
  const [ultraDelEnfant, setUltraDelEnfant] = useState("");
  const [ultraEnfantsList, setUltraEnfantsList] = useState([]);

  // Infos vaccin
  const [selectedVaccinInfo, setSelectedVaccinInfo] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/accueil"); return; }
    fetchUsers(); fetchCreches(); fetchVaccins();
  }, [user]);

  const fetchUsers = async () => {
    try { const r = await axios.get("/api/users", { withCredentials: true }); setUsers(r.data); }
    catch (e) { alert(e.response?.data || "Erreur chargement utilisateurs"); }
  };
  const fetchCreches = async () => {
    try { const r = await axios.get("/api/creches", { withCredentials: true }); setCreches(r.data); }
    catch (e) { alert(e.response?.data || "Erreur chargement crèches"); }
  };
  const fetchVaccins = async () => {
    try { const r = await axios.get("/api/vaccins?inclureObsoletes=true", { withCredentials: true }); setVaccins(r.data); }
    catch (e) { alert(e.response?.data || "Erreur chargement vaccins"); }
  };

  const fetchEnfantsForUltra = async (nomCreche) => {
    try {
        const res = await axios.get("/api/enfants/all?nomCreche=" + nomCreche, { withCredentials: true });
        setUltraEvEnfantsList(res.data);
    } catch (e) { console.error(e); }
};

const fetchEnregistrementsForUltra = async (idEnfant) => {
    try {
        const res = await axios.get("/api/enregistrements-vaccination?idEnfant=" + idEnfant, { withCredentials: true });
        setUltraEvRegistrementsList(res.data);
    } catch (e) { console.error(e); }
};

const fetchEnfantsForUltraDelete = async (nomCreche) => {
  try {
      const res = await axios.get("/api/enfants/all?nomCreche=" + nomCreche, { withCredentials: true });
      setUltraEnfantsList(res.data);
  } catch (e) { console.error(e); }
};

  // ==================== CRÉATIONS ====================
  const handleCreateUser = async () => {
    try {
      const r = await axios.post("/api/users/create?prenom=" + newUserPrenom, null, { withCredentials: true });
      setNewUserMdp(r.data); setNewUserPrenom(""); fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur création utilisateur"); }
  };
  const handleCreateCreche = async () => {
    try {
      await axios.post("/api/creches", { nom: newCrecheNom, directeur: newCrecheDirecteur }, { withCredentials: true });
      setNewCrecheNom(""); setNewCrecheDirecteur(""); fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur création crèche"); }
  };
  const handleCreateVaccin = async () => {
    try {
      await axios.post("/api/vaccins", {
        nom: newVaccin.nom,
        listeMaladies: newVaccin.maladiesPrevenues,
        pourEnfantsNesAvant: newVaccin.pourEnfantsNesAvant || null,
        pourEnfantsNesApres: newVaccin.pourEnfantsNesApres || null,
        agePremiereVaccination: parseInt(newVaccin.agePremiereVaccination),
        nbMoisPremierDelai: parseInt(newVaccin.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: newVaccin.nbMoisDeuxiemeDelai ? parseInt(newVaccin.nbMoisDeuxiemeDelai) : null
      }, { withCredentials: true });
      setNewVaccin({ nom: "", maladiesPrevenues: "", pourEnfantsNesAvant: "", pourEnfantsNesApres: "", agePremiereVaccination: "", nbMoisPremierDelai: "", nbMoisDeuxiemeDelai: "" });
      fetchVaccins();
    } catch (e) { alert(e.response?.data || "Erreur création vaccin"); }
  };

  // ==================== UTILISATEURS ====================
  const handleDisableUser = async (prenom) => {
    if (!window.confirm("Désactiver " + prenom + " ?")) return;
    try { await axios.put("/api/users/disable", { prenom }, { withCredentials: true }); fetchUsers(); }
    catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleRenameUser = async (ancien) => {
    const nv = prompt("Nouveau prénom :"); if (!nv) return;
    try { await axios.put(`/api/users/fix-name?ancienPrenom=${ancien}&nouveauPrenom=${nv}`, null, { withCredentials: true }); fetchUsers(); }
    catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleResetPassword = async (prenom) => {
    if (!window.confirm("Réinitialiser le mot de passe de " + prenom + " ?")) return;
    try { const r = await axios.put("/api/users/reset-password", { prenom }, { withCredentials: true }); alert(r.data); fetchUsers(); }
    catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== ZONE DANGEREUSE ====================
  const getAdminMdp = () => {
    if (!dangerMdp) { alert("Veuillez entrer votre mot de passe admin."); return null; }
    return dangerMdp;
  };

  const handleRenameCreche = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    try {
      await axios.put("/api/creches/rename", { ancienNom: renameCrecheSelect, nouveauNom: renameCrecheNewName, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setRenameCrecheSelect(""); setRenameCrecheNewName(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleChangeDirecteur = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    try {
      await axios.put("/api/creches/change-directeur", { nom: changeDirCreche, directeur: changeDirNewDir, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setChangeDirCreche(""); setChangeDirNewDir(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleFermerCreche = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    if (!window.confirm("Fermer la crèche " + fermerCrecheSelect + " ?")) return;
    try {
      await axios.put("/api/creches/fermer", { nom: fermerCrecheSelect, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setFermerCrecheSelect(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleTransferEnfants = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    if (!window.confirm("Transférer TOUS les enfants de " + transferFrom + " vers " + transferTo + " ?")) return;
    try {
      await axios.put("/api/creches/transferer-enfants", { from: transferFrom, to: transferTo, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setTransferFrom(""); setTransferTo(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleDeleteUserZone = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    const userToDelete = users.find(u => u.prenom === delUserSelect);
    if (userToDelete?.role === "admin") { alert("Impossible de supprimer un administrateur."); return; }
    const userCreches = creches.filter(c => c.directeurPrenom === delUserSelect);
    if (userCreches.length > 0) {
      alert("Impossible : " + delUserSelect + " dirige encore " + userCreches.map(c => c.nom).join(", "));
      return;
    }
    if (!window.confirm("Supprimer DÉFINITIVEMENT " + delUserSelect + " ?")) return;
    try {
      await axios.delete("/api/users/delete", { data: { prenom: delUserSelect, mdpAdmin: mdp }, withCredentials: true });
      fetchUsers(); fetchCreches(); setDelUserSelect(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleEditVaccin = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    try {
      await axios.put("/api/vaccins/edit", {
        id: parseInt(editVaccinId),
        nom: editVaccin.nom,
        listeMaladies: editVaccin.maladiesPrevenues,
        pourEnfantsNesAvant: editVaccin.pourEnfantsNesAvant || null,
        pourEnfantsNesApres: editVaccin.pourEnfantsNesApres || null,
        agePremiereVaccination: parseInt(editVaccin.agePremiereVaccination),
        nbMoisPremierDelai: parseInt(editVaccin.nbMoisPremierDelai),
        nbMoisDeuxiemeDelai: editVaccin.nbMoisDeuxiemeDelai ? parseInt(editVaccin.nbMoisDeuxiemeDelai) : null
      }, { withCredentials: true });
      fetchVaccins(); setEditVaccinId(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleObsoleteVaccin = async () => {
    const mdp = getAdminMdp(); if (!mdp) return;
    if (!window.confirm("Rendre ce vaccin obsolète ?")) return;
    try {
      await axios.put("/api/vaccins/rendre-obsolete", { id: obsoleteVaccinSelect, mdpAdmin: mdp }, { withCredentials: true });
      fetchVaccins(); setObsoleteVaccinSelect(""); setDangerMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // ==================== ZONE ULTRA ====================
  const getUltraMdp = () => {
    if (!ultraMdp) { alert("Veuillez entrer votre mot de passe admin (ultra)."); return null; }
    return ultraMdp;
  };
  const handleUltraDeleteCreche = async () => {
    const mdp = getUltraMdp(); if (!mdp) return;
    if (!window.confirm("SUPPRIMER la crèche " + ultraDelCreche + " ?")) return;
    try {
      await axios.delete("/api/creches/delete", { data: { nom: ultraDelCreche, mdpAdmin: mdp }, withCredentials: true });
      fetchCreches(); setUltraDelCreche(""); setUltraMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleUltraDeleteUser = async () => {
    const mdp = getUltraMdp(); if (!mdp) return;
    if (!window.confirm("SUPPRIMER " + ultraDelUser + " ?")) return;
    try {
      await axios.delete("/api/users/delete", { data: { prenom: ultraDelUser, mdpAdmin: mdp }, withCredentials: true });
      fetchUsers(); setUltraDelUser(""); setUltraMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleUltraDeleteVaccin = async () => {
    const mdp = getUltraMdp(); if (!mdp) return;
    if (!window.confirm("SUPPRIMER PHYSIQUEMENT ce vaccin ?")) return;
    try {
      await axios.delete("/api/vaccins/delete", { data: { id: ultraDelVaccin, mdpAdmin: mdp }, withCredentials: true });
      fetchVaccins(); setUltraDelVaccin(""); setUltraMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleUltraDeleteEnregistrement = async () => {
    const mdp = getUltraMdp(); if (!mdp) return;
    if (!window.confirm("Supprimer cet enregistrement ?")) return;
    try {
      await axios.delete("/api/enregistrements-vaccination", {
        data: { idEnfant: parseInt(ultraEvEnfant), idVaccin: parseInt(ultraEvVaccin), dateVaccination: ultraEvDate },
        withCredentials: true
      });
      alert("Supprimé."); setUltraEvEnfant(""); setUltraEvVaccin(""); setUltraEvDate(""); setUltraMdp("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  const handleUltraDeleteEnfant = async () => {
      const mdp = getUltraMdp(); if (!mdp) return;
      if (!window.confirm("SUPPRIMER DÉFINITIVEMENT cet enfant et tous ses enregistrements ?")) return;
      try {
          await axios.delete("/api/enfants/delete", {
              data: { id: parseInt(ultraDelEnfant), mdpAdmin: mdp },
              withCredentials: true
          });
          alert("Enfant supprimé définitivement.");
          setUltraDelEnfantCreche(""); setUltraDelEnfant(""); setUltraEnfantsList([]); setUltraMdp("");
      } catch (e) { alert(e.response?.data || "Erreur suppression enfant"); }
  };



  // ==================== RENDU ====================
  return (
    <div className="page-container">
      <h1>Administration</h1>

      {/* Panneaux création */}
      <Panel title="Créer une directrice" show={showCreateUser} setShow={setShowCreateUser}>
        <input className="form-input" placeholder="Prénom" value={newUserPrenom} onChange={e => setNewUserPrenom(e.target.value)} />
        <button className="btn btn-primary" onClick={handleCreateUser}>Créer</button>
        {newUserMdp && <p className="success-message">✅ {newUserMdp}</p>}
      </Panel>

      <Panel title="Créer une crèche" show={showCreateCreche} setShow={setShowCreateCreche}>
        <input className="form-input" placeholder="Nom" value={newCrecheNom} onChange={e => setNewCrecheNom(e.target.value)} />
        <select className="form-select" value={newCrecheDirecteur} onChange={e => setNewCrecheDirecteur(e.target.value)}>
          <option value="">-- Directrice --</option>
          {users.filter(u => u.role === "directrice" && !u.estParti).map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleCreateCreche}>Créer</button>
      </Panel>

      <Panel title="Créer un vaccin" show={showCreateVaccin} setShow={setShowCreateVaccin}>
        <input className="form-input" placeholder="Nom" value={newVaccin.nom} onChange={e => setNewVaccin({...newVaccin, nom: e.target.value})} />
        <input className="form-input" placeholder="Maladies" value={newVaccin.maladiesPrevenues} onChange={e => setNewVaccin({...newVaccin, maladiesPrevenues: e.target.value})} />
        <input className="form-input" placeholder="Nés avant (année)" value={newVaccin.pourEnfantsNesAvant} onChange={e => setNewVaccin({...newVaccin, pourEnfantsNesAvant: e.target.value})} />
        <input className="form-input" placeholder="Nés après (année)" value={newVaccin.pourEnfantsNesApres} onChange={e => setNewVaccin({...newVaccin, pourEnfantsNesApres: e.target.value})} />
        <input className="form-input" placeholder="Âge 1ère dose (mois)" value={newVaccin.agePremiereVaccination} onChange={e => setNewVaccin({...newVaccin, agePremiereVaccination: e.target.value})} />
        <input className="form-input" placeholder="Délai 1 (mois)" value={newVaccin.nbMoisPremierDelai} onChange={e => setNewVaccin({...newVaccin, nbMoisPremierDelai: e.target.value})} />
        <input className="form-input" placeholder="Délai 2 (mois)" value={newVaccin.nbMoisDeuxiemeDelai} onChange={e => setNewVaccin({...newVaccin, nbMoisDeuxiemeDelai: e.target.value})} />
        <button className="btn btn-primary" onClick={handleCreateVaccin}>Créer</button>
      </Panel>

      {/* Utilisateurs */}
      <Panel title="Utilisateurs" show={showUserList} setShow={setShowUserList}>
        <h4>Directrices</h4>
        {users.filter(u => u.role === "directrice" && !u.estParti).map(u => (
          <div key={u.id} className="user-row">
            <span>{u.prenom}</span>
            <div className="btn-group">
              <button className="btn btn-sm btn-secondary" onClick={() => handleRenameUser(u.prenom)}>✏️</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleResetPassword(u.prenom)}>🔑</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDisableUser(u.prenom)}>❌</button>
            </div>
          </div>
        ))}
        <h4>Administrateurs</h4>
        {users.filter(u => u.role === "admin").map(u => (
          <div key={u.id}>{u.prenom} (non modifiable)</div>
        ))}
      </Panel>

      {/* Autres informations */}
      <Panel title="Autres informations" show={showInfos} setShow={setShowInfos}>
        <h4>Crèches</h4>
        {creches.map(c => (
          <div key={c.nom}>{c.nom} — Dirigée par {c.directeurPrenom} — {c.nbEnfants} enfant(s) {c.estFerme ? "(fermée)" : ""}</div>
        ))}
        <h4>Vaccins</h4>
        <select className="form-select" value={selectedVaccinInfo} onChange={e => setSelectedVaccinInfo(e.target.value)}>
          <option value="">-- Vaccin --</option>
          {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </select>
        {selectedVaccinInfo && (() => {
          const v = vaccins.find(x => x.id === parseInt(selectedVaccinInfo));
          if (!v) return null;
          const delai2 = v.nbMoisDeuxiemeDelai ? `la dernière ${v.nbMoisDeuxiemeDelai} mois plus tard` : "il n'y a pas de troisième dose";
          const conditions = [];
          if (v.pourEnfantsNesAvant) conditions.push(`Concerne les enfants nés avant ${v.pourEnfantsNesAvant}.`);
          if (v.pourEnfantsNesApres) conditions.push(`Concerne les enfants nés après ${v.pourEnfantsNesApres}.`);
          return (
            <div style={{ marginTop: 10 }}>
              {v.estObsolete && <span className="badge badge-danger">⚠ Obsolète</span>}
              <p><strong>{v.nom}</strong> — {v.maladiesPrevenues}</p>
              <p>1ère à {v.agePremiereVaccination} mois, 2ème +{v.nbMoisPremierDelai} mois, {delai2}.</p>
              {conditions.length > 0 && <p>{conditions.join(" ")}</p>}
            </div>
          );
        })()}
      </Panel>

      {/* Zone dangereuse */}
      <div className="card danger-zone">
        <div className="panel-header" onClick={() => setShowDanger(!showDanger)}>
          <span>⚠️ Zone dangereuse</span>
          <span>{showDanger ? "▲" : "▼"}</span>
        </div>
        {showDanger && (
          <div className="panel-body">
            <div className="form-group">
              <label>Mot de passe admin</label>
              <input type="password" className="form-input" value={dangerMdp} onChange={e => setDangerMdp(e.target.value)} />
            </div>
            <Section title="Renommer une crèche">
              <select className="form-select" value={renameCrecheSelect} onChange={e => setRenameCrecheSelect(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <input className="form-input" placeholder="Nouveau nom" value={renameCrecheNewName} onChange={e => setRenameCrecheNewName(e.target.value)} />
              <button className="btn btn-sm btn-primary" onClick={handleRenameCreche}>Renommer</button>
            </Section>
            <Section title="Changer directeur">
              <select className="form-select" value={changeDirCreche} onChange={e => setChangeDirCreche(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <select className="form-select" value={changeDirNewDir} onChange={e => setChangeDirNewDir(e.target.value)}>
                <option value="">-- Nouvelle directrice --</option>
                {users.filter(u => u.role === "directrice" && !u.estParti).map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={handleChangeDirecteur}>Appliquer</button>
            </Section>
            <Section title="Fermer une crèche">
              <select className="form-select" value={fermerCrecheSelect} onChange={e => setFermerCrecheSelect(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.filter(c => !c.estFerme).map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={handleFermerCreche}>Fermer</button>
            </Section>
            <Section title="Transférer tous les enfants">
              <select className="form-select" value={transferFrom} onChange={e => { setTransferFrom(e.target.value); setTransferTo(""); }}>
                <option value="">-- Source --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <select className="form-select" value={transferTo} onChange={e => setTransferTo(e.target.value)} disabled={!transferFrom}>
                <option value="">-- Cible --</option>
                {creches.filter(c => c.nom !== transferFrom).map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={handleTransferEnfants}>Transférer</button>
            </Section>
            <Section title="Supprimer une directrice">
              <select className="form-select" value={delUserSelect} onChange={e => setDelUserSelect(e.target.value)}>
                <option value="">-- Directrice --</option>
                {users.filter(u => u.role === "directrice").map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
              </select>
              <button className="btn btn-sm btn-danger" onClick={handleDeleteUserZone}>Supprimer</button>
            </Section>
            <Section title="Modifier un vaccin">
              <select className="form-select" value={editVaccinId} onChange={e => {
                setEditVaccinId(e.target.value);
                const v = vaccins.find(x => x.id === parseInt(e.target.value));
                if (v) setEditVaccin({ nom: v.nom, maladiesPrevenues: v.maladiesPrevenues, pourEnfantsNesAvant: v.pourEnfantsNesAvant || "", pourEnfantsNesApres: v.pourEnfantsNesApres || "", agePremiereVaccination: v.agePremiereVaccination, nbMoisPremierDelai: v.nbMoisPremierDelai, nbMoisDeuxiemeDelai: v.nbMoisDeuxiemeDelai || "" });
              }}>
                <option value="">-- Vaccin --</option>
                {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              {editVaccinId && <>
                <input className="form-input" placeholder="Nom" value={editVaccin.nom} onChange={e => setEditVaccin({...editVaccin, nom: e.target.value})} />
                <input className="form-input" placeholder="Maladies" value={editVaccin.maladiesPrevenues} onChange={e => setEditVaccin({...editVaccin, maladiesPrevenues: e.target.value})} />
                <input className="form-input" placeholder="Nés avant" value={editVaccin.pourEnfantsNesAvant} onChange={e => setEditVaccin({...editVaccin, pourEnfantsNesAvant: e.target.value})} />
                <input className="form-input" placeholder="Nés après" value={editVaccin.pourEnfantsNesApres} onChange={e => setEditVaccin({...editVaccin, pourEnfantsNesApres: e.target.value})} />
                <input className="form-input" placeholder="Âge 1ère" value={editVaccin.agePremiereVaccination} onChange={e => setEditVaccin({...editVaccin, agePremiereVaccination: e.target.value})} />
                <input className="form-input" placeholder="Délai 1" value={editVaccin.nbMoisPremierDelai} onChange={e => setEditVaccin({...editVaccin, nbMoisPremierDelai: e.target.value})} />
                <input className="form-input" placeholder="Délai 2" value={editVaccin.nbMoisDeuxiemeDelai} onChange={e => setEditVaccin({...editVaccin, nbMoisDeuxiemeDelai: e.target.value})} />
                <button className="btn btn-sm btn-primary" onClick={handleEditVaccin}>Enregistrer</button>
              </>}
            </Section>
            <Section title="Rendre un vaccin obsolète">
              <select className="form-select" value={obsoleteVaccinSelect} onChange={e => setObsoleteVaccinSelect(e.target.value)}>
                <option value="">-- Vaccin --</option>
                {vaccins.filter(v => !v.estObsolete).map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              <button className="btn btn-sm btn-danger" onClick={handleObsoleteVaccin}>Rendre obsolète</button>
            </Section>
          </div>
        )}
      </div>

      {/* Zone ultra dangereuse */}
      <div className="card ultra-zone">
        <div className="panel-header" onClick={() => setShowUltra(!showUltra)}>
          <span>☠️ Zone ultra dangereuse</span>
          <span>{showUltra ? "▲" : "▼"}</span>
        </div>
        {showUltra && (
          <div className="panel-body">
            <div className="form-group">
              <label>Mot de passe admin (ultra)</label>
              <input type="password" className="form-input" value={ultraMdp} onChange={e => setUltraMdp(e.target.value)} />
            </div>
            <Section title="Supprimer une crèche (définitif)">
              <select className="form-select" value={ultraDelCreche} onChange={e => setUltraDelCreche(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <button className="btn btn-sm btn-danger" onClick={handleUltraDeleteCreche}>Supprimer</button>
            </Section>
            <Section title="Supprimer un utilisateur (définitif)">
              <select className="form-select" value={ultraDelUser} onChange={e => setUltraDelUser(e.target.value)}>
                <option value="">-- Utilisateur --</option>
                {users.filter(u => u.role !== "admin").map(u => <option key={u.id} value={u.prenom}>{u.prenom} ({u.role})</option>)}
              </select>
              <button className="btn btn-sm btn-danger" onClick={handleUltraDeleteUser}>Supprimer</button>
            </Section>
            <Section title="Supprimer un vaccin (physique)">
              <select className="form-select" value={ultraDelVaccin} onChange={e => setUltraDelVaccin(e.target.value)}>
                <option value="">-- Vaccin --</option>
                {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              <button className="btn btn-sm btn-danger" onClick={handleUltraDeleteVaccin}>Supprimer</button>
            </Section>
            <Section title="Supprimer un enfant (définitif)">
                <select className="form-select" value={ultraDelEnfantCreche} onChange={e => {
                    setUltraDelEnfantCreche(e.target.value);
                    setUltraDelEnfant("");
                    if (e.target.value) fetchEnfantsForUltraDelete(e.target.value);
                }}>
                    <option value="">-- Crèche --</option>
                    {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
                </select>
                <select className="form-select" value={ultraDelEnfant} onChange={e => setUltraDelEnfant(e.target.value)} disabled={!ultraDelEnfantCreche}>
                    <option value="">-- Enfant --</option>
                    {ultraEnfantsList.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom} {e.estParti ? "(désactivé)" : ""}</option>)}
                </select>
                <button className="btn btn-sm btn-danger" onClick={handleUltraDeleteEnfant} disabled={!ultraDelEnfant}>Supprimer</button>
            </Section>
            <Section title="Supprimer un enregistrement">
              <select className="form-select" value={ultraEvCreche} onChange={e => { setUltraEvCreche(e.target.value); setUltraEvEnfant(""); setUltraEvVaccin(""); setUltraEvDate(""); if (e.target.value) fetchEnfantsForUltra(e.target.value); }}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <select className="form-select" value={ultraEvEnfant} onChange={e => { setUltraEvEnfant(e.target.value); setUltraEvVaccin(""); setUltraEvDate(""); if (e.target.value) fetchEnregistrementsForUltra(e.target.value); }} disabled={!ultraEvCreche}>
                <option value="">-- Enfant --</option>
                {ultraEvEnfantsList.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
              <select className="form-select" value={ultraEvVaccin} onChange={e => { setUltraEvVaccin(e.target.value); setUltraEvDate(""); }} disabled={!ultraEvEnfant}>
                <option value="">-- Vaccin --</option>
                {[...new Map(ultraEvRegistrementsList.map(ev => [ev.idVaccin, ev.nomVaccin]))].map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
              </select>
              {ultraEvVaccin && (
                <select className="form-select" value={ultraEvDate} onChange={e => setUltraEvDate(e.target.value)}>
                  <option value="">-- Date --</option>
                  {ultraEvRegistrementsList.filter(ev => ev.idVaccin === parseInt(ultraEvVaccin)).map(ev => <option key={ev.dateVaccination} value={ev.dateVaccination}>{new Date(ev.dateVaccination).toLocaleDateString("fr-FR")}</option>)}
                </select>
              )}
              <button className="btn btn-sm btn-danger" onClick={handleUltraDeleteEnregistrement} disabled={!ultraEvDate}>Supprimer</button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Panel
const Panel = ({ title, show, setShow, children }) => (
  <div className="card">
    <div className="panel-header" onClick={() => setShow(!show)}>
      <span>{title}</span><span>{show ? "▲" : "▼"}</span>
    </div>
    {show && <div className="panel-body">{children}</div>}
  </div>
);

const Section = ({ title, children }) => (
  <div className="form-group">
    <strong>{title}:</strong>
    <div className="btn-group" style={{ flexWrap: "wrap", gap: 5, marginTop: 4 }}>{children}</div>
  </div>
);

export default Admin;