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

  // Visibilité des panneaux
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCreche, setShowCreateCreche] = useState(false);
  const [showCreateVaccin, setShowCreateVaccin] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showInfos, setShowInfos] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [dangerConfirmed, setDangerConfirmed] = useState(false);
  const [showUltra, setShowUltra] = useState(false);
  const [ultraConfirmed, setUltraConfirmed] = useState(false);

  // Création user
  const [newUserPrenom, setNewUserPrenom] = useState("");
  const [newUserMdp, setNewUserMdp] = useState(null);
  // Création crèche
  const [newCrecheNom, setNewCrecheNom] = useState("");
  const [newCrecheDirecteur, setNewCrecheDirecteur] = useState("");
  // Création vaccin
  const [newVaccin, setNewVaccin] = useState({
    nom: "", maladiesPrevenues: "", pourEnfantsNesAvant: "", pourEnfantsNesApres: "",
    agePremiereVaccination: "", nbMoisPremierDelai: "", nbMoisDeuxiemeDelai: ""
  });

  // Édition vaccin
  const [editVaccinId, setEditVaccinId] = useState("");
  const [editVaccin, setEditVaccin] = useState({ ...newVaccin });

  // Zone dangereuse
  const [dangerMdp, setDangerMdp] = useState("");
  const [renameCrecheSelect, setRenameCrecheSelect] = useState("");
  const [renameCrecheNewName, setRenameCrecheNewName] = useState("");
  const [changeDirCreche, setChangeDirCreche] = useState("");
  const [changeDirNewDir, setChangeDirNewDir] = useState("");
  const [delUserSelect, setDelUserSelect] = useState("");
  const [obsoleteVaccinSelect, setObsoleteVaccinSelect] = useState("");

  // Zone ultra
  const [ultraMdp, setUltraMdp] = useState("");
  const [ultraDelCreche, setUltraDelCreche] = useState("");
  const [ultraDelUser, setUltraDelUser] = useState("");
  const [ultraDelVaccin, setUltraDelVaccin] = useState("");
  const [ultraDelEvEnfant, setUltraDelEvEnfant] = useState("");
  const [ultraDelEvVaccin, setUltraDelEvVaccin] = useState("");
  const [selectedVaccinInfo, setSelectedVaccinInfo] = useState("");

  // Chargement initial
  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    fetchUsers(); fetchCreches(); fetchVaccins();
  }, []);

  const fetchUsers = async () => {
    const r = await axios.get("/api/users", { withCredentials: true });
    setUsers(r.data);
  };
  const fetchCreches = async () => {
    const r = await axios.get("/api/creches", { withCredentials: true });
    setCreches(r.data);
  };
  const fetchVaccins = async () => {
    const r = await axios.get("/api/vaccins", { withCredentials: true });
    setVaccins(r.data);
  };

  // Créations
  const handleCreateUser = async () => {
    try {
      const r = await axios.post("/api/users/create?prenom=" + newUserPrenom, null, { withCredentials: true });
      setNewUserMdp(r.data); setNewUserPrenom(""); fetchUsers();
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleCreateCreche = async () => {
    try {
      await axios.post("/api/creches", { nom: newCrecheNom, directeur: newCrecheDirecteur }, { withCredentials: true });
      setNewCrecheNom(""); setNewCrecheDirecteur(""); fetchCreches();
    } catch (e) { alert(e.response?.data || "Erreur"); }
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
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // Gestion utilisateurs
  const handleDisableUser = async (prenom) => {
    if (!window.confirm("Désactiver " + prenom + " ?")) return;
    await axios.put("/api/users/disable", { prenom }, { withCredentials: true });
    fetchUsers();
  };
  const handleRenameUser = async (ancien) => {
    const nv = prompt("Nouveau prénom :"); if (!nv) return;
    await axios.put(`/api/users/fix-name?ancienPrenom=${ancien}&nouveauPrenom=${nv}`, null, { withCredentials: true });
    fetchUsers();
  };
  const handleResetPassword = async (prenom) => {
    if (!window.confirm("Réinitialiser le mot de passe de " + prenom + " ?")) return;
    const r = await axios.put("/api/users/reset-password", { prenom }, { withCredentials: true });
    alert(r.data); fetchUsers();
  };

  // Zone dangereuse
  const promptMdp = () => prompt("Votre mot de passe admin :");
  const handleRenameCreche = async () => {
    const mdp = promptMdp(); if (!mdp) return;
    try {
      await axios.put("/api/creches/rename", { ancienNom: renameCrecheSelect, nouveauNom: renameCrecheNewName, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setRenameCrecheSelect(""); setRenameCrecheNewName("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleChangeDirecteur = async () => {
    const mdp = promptMdp(); if (!mdp) return;
    try {
      await axios.put("/api/creches/change-directeur", { nom: changeDirCreche, directeur: changeDirNewDir, mdpAdmin: mdp }, { withCredentials: true });
      fetchCreches(); setChangeDirCreche(""); setChangeDirNewDir("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleDeleteUserZone = async () => {
    const choix = window.confirm("Voulez-vous vraiment supprimer définitivement cet utilisateur ? (Cliquez sur Annuler pour le désactiver à la place)"); 
    if (choix) {
      const mdp = promptMdp(); if (!mdp) return;
      try {
        await axios.delete("/api/users/delete", { data: { prenom: delUserSelect, mdpAdmin: mdp }, withCredentials: true });
        fetchUsers(); fetchCreches(); setDelUserSelect("");
      } catch (e) { alert(e.response?.data || "Erreur"); }
    } else {
      handleDisableUser(delUserSelect); // désactiver à la place
    }
  };
  const handleEditVaccin = async () => {
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
      fetchVaccins(); setEditVaccinId("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };
  const handleObsoleteVaccin = async () => {
    const mdp = promptMdp(); if (!mdp) return;
    if (!window.confirm("Rendre ce vaccin obsolète ?")) return;
    try {
      await axios.put("/api/vaccins/rendre-obsolete", { id: obsoleteVaccinSelect, mdpAdmin: mdp }, { withCredentials: true });
      fetchVaccins(); setObsoleteVaccinSelect("");
    } catch (e) { alert(e.response?.data || "Erreur"); }
  };

  // Ultra dangereuse
  const ultraConfirm = (action, payload) => {
    const mdp = prompt("Mot de passe admin (ULTRA) :"); if (!mdp) return;
    if (!window.confirm("ACTION IRRÉVERSIBLE. Confirmez-vous ?")) return;
    action({ ...payload, mdpAdmin: mdp });
  };
  const handleUltraDeleteCreche = async () => {
    ultraConfirm(async (p) => {
      await axios.delete("/api/creches/delete", { data: p, withCredentials: true });
      fetchCreches(); setUltraDelCreche("");
    }, { nom: ultraDelCreche });
  };
  const handleUltraDeleteUser = async () => {
    ultraConfirm(async (p) => {
      await axios.delete("/api/users/delete", { data: p, withCredentials: true });
      fetchUsers(); fetchCreches(); setUltraDelUser("");
    }, { prenom: ultraDelUser });
  };
  const handleUltraDeleteVaccin = async () => {
    ultraConfirm(async (p) => {
      // Suppression physique du vaccin (nouvel endpoint nécessaire ?) On va utiliser un DELETE /vaccins/delete physique
      // Pour l'instant, on va supprimer via un appel à un nouvel endpoint DELETE /vaccins/physique
      await axios.delete("/api/vaccins/delete", { data: p, withCredentials: true });
      fetchVaccins(); setUltraDelVaccin("");
    }, { id: ultraDelVaccin });
  };
  const handleUltraDeleteEnregistrement = async () => {
    // Récupérer l'enregistrement ? On a besoin de l'id enfant, vaccin, date. On va demander la date.
    const date = prompt("Date de l'enregistrement (AAAA-MM-JJ) :"); if (!date) return;
    ultraConfirm(async (p) => {
      await axios.delete("/api/enregistrements-vaccination", {
        data: { idEnfant: parseInt(ultraDelEvEnfant), idVaccin: parseInt(ultraDelEvVaccin), dateVaccination: date, mdpAdmin: p.mdpAdmin },
        withCredentials: true
      });
      alert("Enregistrement supprimé"); setUltraDelEvEnfant(""); setUltraDelEvVaccin("");
    }, {});
  };

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <h1>Administration</h1>

      {/* Panneau 1 */}
      <Panel title="Créer une directrice" show={showCreateUser} setShow={setShowCreateUser}>
        <input placeholder="Prénom" value={newUserPrenom} onChange={e => setNewUserPrenom(e.target.value)} />
        <button onClick={handleCreateUser}>Créer</button>
        {newUserMdp && <p>✅ {newUserMdp}</p>}
      </Panel>

      {/* Panneau 2 */}
      <Panel title="Créer une crèche" show={showCreateCreche} setShow={setShowCreateCreche}>
        <input placeholder="Nom" value={newCrecheNom} onChange={e => setNewCrecheNom(e.target.value)} />
        <select value={newCrecheDirecteur} onChange={e => setNewCrecheDirecteur(e.target.value)}>
          <option value="">-- Directrice --</option>
          {users.filter(u => u.role === "directrice" && !u.estParti).map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
        </select>
        <button onClick={handleCreateCreche}>Créer</button>
      </Panel>

      {/* Panneau 3 */}
      <Panel title="Créer un vaccin" show={showCreateVaccin} setShow={setShowCreateVaccin}>
        <input placeholder="Nom" value={newVaccin.nom} onChange={e => setNewVaccin({...newVaccin, nom: e.target.value})} />
        <input placeholder="Maladies" value={newVaccin.maladiesPrevenues} onChange={e => setNewVaccin({...newVaccin, maladiesPrevenues: e.target.value})} />
        <input placeholder="Nés avant (année)" value={newVaccin.pourEnfantsNesAvant} onChange={e => setNewVaccin({...newVaccin, pourEnfantsNesAvant: e.target.value})} />
        <input placeholder="Nés après (année)" value={newVaccin.pourEnfantsNesApres} onChange={e => setNewVaccin({...newVaccin, pourEnfantsNesApres: e.target.value})} />
        <input placeholder="Âge 1ère dose (mois)" value={newVaccin.agePremiereVaccination} onChange={e => setNewVaccin({...newVaccin, agePremiereVaccination: e.target.value})} />
        <input placeholder="Délai 1 (mois)" value={newVaccin.nbMoisPremierDelai} onChange={e => setNewVaccin({...newVaccin, nbMoisPremierDelai: e.target.value})} />
        <input placeholder="Délai 2 (mois)" value={newVaccin.nbMoisDeuxiemeDelai} onChange={e => setNewVaccin({...newVaccin, nbMoisDeuxiemeDelai: e.target.value})} />
        <button onClick={handleCreateVaccin}>Créer</button>
      </Panel>

      {/* Panneau 4 : Liste utilisateurs */}
      <Panel title="Utilisateurs" show={showUserList} setShow={setShowUserList}>
        <h4>Directrices</h4>
        {users.filter(u => u.role === "directrice" && !u.estParti).map(u => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{u.prenom}</span>
            <span>
              <button onClick={() => handleRenameUser(u.prenom)}>✏️</button>
              <button onClick={() => handleResetPassword(u.prenom)}>🔑</button>
              <button onClick={() => handleDisableUser(u.prenom)}>❌</button>
            </span>
          </div>
        ))}
        <h4>Administrateurs</h4>
        {users.filter(u => u.role === "admin").map(u => (
          <div key={u.id}>{u.prenom} (non modifiable)</div>
        ))}
      </Panel>

      {/* Panneau 5 : Autres informations */}
      <Panel title="Autres informations" show={showInfos} setShow={setShowInfos}>
        <h4>Crèches</h4>
        {creches.map(c => (
          <div key={c.nom} style={{ marginBottom: 4 }}>
            {c.nom} — Dirigée par {c.directeurPrenom} — {c.nbEnfants} enfant(s) {c.estFerme ? "(fermée)" : ""}
          </div>
        ))}
        <h4>Vaccins</h4>
        <select value={selectedVaccinInfo} onChange={e => setSelectedVaccinInfo(e.target.value)}>
          <option value="">-- Choisir un vaccin --</option>
          {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </select>
        {selectedVaccinInfo && (() => {
          const v = vaccins.find(x => x.id === parseInt(selectedVaccinInfo));
          if (!v) return null;
          const delai2 = v.nbMoisDeuxiemeDelai ? `la dernière ${v.nbMoisDeuxiemeDelai} mois plus tard` : "il n'y a pas de troisième dose";
          const condition = v.pourEnfantsNesAvant ? `Concerne les enfants nés avant ${v.pourEnfantsNesAvant}. ` : v.pourEnfantsNesApres ? `Concerne les enfants nés après ${v.pourEnfantsNesApres}. ` : "";
          return (
            <div style={{ marginTop: 10 }}>
              <strong>{v.nom}</strong> est injecté contre : {v.maladiesPrevenues}.<br/>
              La première prise est à {v.agePremiereVaccination} mois, la seconde {v.nbMoisPremierDelai} mois plus tard, et {delai2}.<br/>
              {condition}
            </div>
          );
        })()}
      </Panel>

      {/* Zone dangereuse */}
      <div style={{ border: "2px solid orange", borderRadius: 5, marginBottom: 10 }}>
        <div style={{ background: "#ffe0b0", padding: 10, cursor: "pointer", fontWeight: "bold" }}
          onClick={() => {
            if (!dangerConfirmed) {
              if (window.confirm("⚠️ Zone dangereuse. Continuer ?")) { setDangerConfirmed(true); setShowDanger(true); }
            } else setShowDanger(!showDanger);
          }}>
          ⚠️ Zone dangereuse {showDanger ? "▲" : "▼"}
        </div>
        {showDanger && (
          <div style={{ padding: 10 }}>
            {/* Renommer crèche */}
            <div style={{ marginBottom: 10 }}>
              <strong>Renommer une crèche</strong><br/>
              <select value={renameCrecheSelect} onChange={e => setRenameCrecheSelect(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <input placeholder="Nouveau nom" value={renameCrecheNewName} onChange={e => setRenameCrecheNewName(e.target.value)} />
              <button onClick={handleRenameCreche}>Renommer</button>
            </div>
            {/* Changer directeur */}
            <div style={{ marginBottom: 10 }}>
              <strong>Changer directeur</strong><br/>
              <select value={changeDirCreche} onChange={e => setChangeDirCreche(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <select value={changeDirNewDir} onChange={e => setChangeDirNewDir(e.target.value)}>
                <option value="">-- Nouvelle directrice --</option>
                {users.filter(u => u.role === "directrice" && !u.estParti).map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
              </select>
              <button onClick={handleChangeDirecteur}>Appliquer</button>
            </div>
            {/* Supprimer utilisateur */}
            <div style={{ marginBottom: 10 }}>
              <strong>Supprimer une directrice</strong><br/>
              <select value={delUserSelect} onChange={e => setDelUserSelect(e.target.value)}>
                <option value="">-- Directrice --</option>
                {users.filter(u => u.role === "directrice").map(u => <option key={u.id} value={u.prenom}>{u.prenom}</option>)}
              </select>
              <button onClick={handleDeleteUserZone}>Supprimer</button>
            </div>
            {/* Modifier vaccin */}
            <div style={{ marginBottom: 10 }}>
              <strong>Modifier un vaccin</strong><br/>
              <select value={editVaccinId} onChange={e => { setEditVaccinId(e.target.value); const v = vaccins.find(x => x.id === parseInt(e.target.value)); if (v) setEditVaccin({ nom: v.nom, maladiesPrevenues: v.maladiesPrevenues, pourEnfantsNesAvant: v.pourEnfantsNesAvant || "", pourEnfantsNesApres: v.pourEnfantsNesApres || "", agePremiereVaccination: v.agePremiereVaccination, nbMoisPremierDelai: v.nbMoisPremierDelai, nbMoisDeuxiemeDelai: v.nbMoisDeuxiemeDelai || "" }); }}>
                <option value="">-- Vaccin --</option>
                {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              {editVaccinId && <>
                <input placeholder="Nom" value={editVaccin.nom} onChange={e => setEditVaccin({...editVaccin, nom: e.target.value})} />
                <input placeholder="Maladies" value={editVaccin.maladiesPrevenues} onChange={e => setEditVaccin({...editVaccin, maladiesPrevenues: e.target.value})} />
                <input placeholder="Nés avant" value={editVaccin.pourEnfantsNesAvant} onChange={e => setEditVaccin({...editVaccin, pourEnfantsNesAvant: e.target.value})} />
                <input placeholder="Nés après" value={editVaccin.pourEnfantsNesApres} onChange={e => setEditVaccin({...editVaccin, pourEnfantsNesApres: e.target.value})} />
                <input placeholder="Âge 1ère dose" value={editVaccin.agePremiereVaccination} onChange={e => setEditVaccin({...editVaccin, agePremiereVaccination: e.target.value})} />
                <input placeholder="Délai 1" value={editVaccin.nbMoisPremierDelai} onChange={e => setEditVaccin({...editVaccin, nbMoisPremierDelai: e.target.value})} />
                <input placeholder="Délai 2" value={editVaccin.nbMoisDeuxiemeDelai} onChange={e => setEditVaccin({...editVaccin, nbMoisDeuxiemeDelai: e.target.value})} />
                <button onClick={handleEditVaccin}>Enregistrer</button>
              </>}
            </div>
            {/* Rendre obsolète */}
            <div style={{ marginBottom: 10 }}>
              <strong>Rendre un vaccin obsolète</strong><br/>
              <select value={obsoleteVaccinSelect} onChange={e => setObsoleteVaccinSelect(e.target.value)}>
                <option value="">-- Vaccin --</option>
                {vaccins.filter(v => !v.estObsolete).map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              <button onClick={handleObsoleteVaccin}>Rendre obsolète</button>
            </div>
          </div>
        )}
      </div>

      {/* Zone ultra dangereuse */}
      <div style={{ border: "2px solid red", borderRadius: 5 }}>
        <div style={{ background: "#ffcccc", padding: 10, cursor: "pointer", fontWeight: "bold" }}
          onClick={() => {
            if (!ultraConfirmed) {
              if (window.confirm("☠️ Zone ULTRA dangereuse. Les suppressions sont IRRÉVERSIBLES. Continuer ?")) { setUltraConfirmed(true); setShowUltra(true); }
            } else setShowUltra(!showUltra);
          }}>
          ☠️ Zone ultra dangereuse {showUltra ? "▲" : "▼"}
        </div>
        {showUltra && (
          <div style={{ padding: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <strong>Supprimer une crèche</strong><br/>
              <select value={ultraDelCreche} onChange={e => setUltraDelCreche(e.target.value)}>
                <option value="">-- Crèche --</option>
                {creches.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
              <button onClick={handleUltraDeleteCreche}>Supprimer</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>Supprimer un utilisateur (définitif)</strong><br/>
              <select value={ultraDelUser} onChange={e => setUltraDelUser(e.target.value)}>
                <option value="">-- Utilisateur --</option>
                {users.map(u => <option key={u.id} value={u.prenom}>{u.prenom} ({u.role})</option>)}
              </select>
              <button onClick={handleUltraDeleteUser}>Supprimer</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>Supprimer un vaccin (définitif)</strong><br/>
              <select value={ultraDelVaccin} onChange={e => setUltraDelVaccin(e.target.value)}>
                <option value="">-- Vaccin --</option>
                {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              <button onClick={handleUltraDeleteVaccin}>Supprimer</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>Supprimer un enregistrement</strong><br/>
              <select value={ultraDelEvEnfant} onChange={e => setUltraDelEvEnfant(e.target.value)}>
                <option value="">-- Enfant --</option>
                {/* Idéalement charger la liste des enfants, mais on utilisera les enfants depuis les crèches (pas chargés ici). On va simplifier avec un champ texte pour l'ID enfant. */}
              </select>
              <input placeholder="ID Enfant" value={ultraDelEvEnfant} onChange={e => setUltraDelEvEnfant(e.target.value)} />
              <select value={ultraDelEvVaccin} onChange={e => setUltraDelEvVaccin(e.target.value)}>
                <option value="">-- Vaccin --</option>
                {vaccins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
              <button onClick={handleUltraDeleteEnregistrement}>Supprimer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Panel réutilisable
const Panel = ({ title, show, setShow, children }) => (
  <div style={{ border: "1px solid #ccc", borderRadius: 5, marginBottom: 10 }}>
    <div onClick={() => setShow(!show)} style={{ background: "#f0f0f0", padding: 10, cursor: "pointer", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
      <span>{title}</span><span>{show ? "▲" : "▼"}</span>
    </div>
    {show && <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>}
  </div>
);

export default Admin;