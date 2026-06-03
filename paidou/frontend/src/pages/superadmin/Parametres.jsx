import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Parametres = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expirationMdp, setExpirationMdp] = useState(6);
  const [inactiviteMax, setInactiviteMax] = useState(12);
  const [seuilProche, setSeuilProche] = useState(14);
  const [delaiRappel, setDelaiRappel] = useState(7);
  const [saved, setSaved] = useState(false);

  const fetchParametres = async () => {
    try {
      const res = await axios.get("/api/parametres", { withCredentials: true });
      if (res.data) {
        setExpirationMdp(res.data.expirationMdp || 6);
        setInactiviteMax(res.data.inactiviteMax || 12);
        setSeuilProche(res.data.seuilProche || 14);
        setDelaiRappel(res.data.delaiRappel || 7);
      }
    } catch (e) {
      console.error("Erreur chargement paramètres", e);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/accueil"); return; }
    fetchParametres();
  }, [user]);

  const handleSave = async () => {
    try {
      await axios.put("/api/parametres", {
        expirationMdp,
        inactiviteMax,
        seuilProche,
        delaiRappel,
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e.response?.data || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="page-container">
      <h1>Paramètres globaux</h1>

      <div className="card">
        <div className="panel-header">
          <span>⚙️ Configuration</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>

            <div className="form-group">
              <label>Expiration du mot de passe (mois)</label>
              <input
                type="number"
                className="form-input"
                value={expirationMdp}
                onChange={(e) => setExpirationMdp(parseInt(e.target.value))}
                min={1}
                max={12}
              />
              <small className="text-secondary">Tous les X mois, les utilisateurs devront changer leur mot de passe.</small>
            </div>

            <div className="form-group">
              <label>Inactivité maximale (mois)</label>
              <input
                type="number"
                className="form-input"
                value={inactiviteMax}
                onChange={(e) => setInactiviteMax(parseInt(e.target.value))}
                min={1}
                max={24}
              />
              <small className="text-secondary">Si aucun enregistrement créé depuis X mois, l'utilisateur est automatiquement désactivé.</small>
            </div>

            <div className="form-group">
              <label>Seuil d'alerte proche (jours)</label>
              <input
                type="number"
                className="form-input"
                value={seuilProche}
                onChange={(e) => setSeuilProche(parseInt(e.target.value))}
                min={7}
                max={30}
              />
              <small className="text-secondary">Notification X jours avant la date prévue d'un vaccin.</small>
            </div>

            <div className="form-group">
              <label>Délai de rappel (jours)</label>
              <input
                type="number"
                className="form-input"
                value={delaiRappel}
                onChange={(e) => setDelaiRappel(parseInt(e.target.value))}
                min={1}
                max={30}
              />
              <small className="text-secondary">Notification de rappel tous les X jours après la date prévue, jusqu'à ce que le vaccin soit fait ou l'enfant désactivé.</small>
            </div>

            <button className="btn btn-primary" onClick={handleSave}>
              💾 Sauvegarder
            </button>
            {saved && <span className="success-message">✅ Paramètres sauvegardés.</span>}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;