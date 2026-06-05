import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useRedirectByRole } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PdgParametres = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();

  const [expirationMdp, setExpirationMdp] = useState(6);
  const [inactiviteMax, setInactiviteMax] = useState(12);
  const [seuilProche, setSeuilProche] = useState(14);
  const [delaiRappel, setDelaiRappel] = useState(7);

  useRedirectByRole(["pdg"]);

  useEffect(() => {
    if (!effectiveUser) return;
    fetchParametres();
  }, [effectiveUser]);

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

  return (
    <div className="page-container">
      <h1>Paramètres</h1>

      <div className="card">
        <div className="panel-header"><span>⚙️ Configuration (lecture seule)</span></div>
        <div className="panel-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
            <div className="form-group">
              <label>Expiration du mot de passe (mois)</label>
              <input type="number" className="form-input" value={expirationMdp} disabled />
              <small className="text-secondary">Tous les X mois, les utilisateurs devront changer leur mot de passe.</small>
            </div>
            <div className="form-group">
              <label>Inactivité maximale (mois)</label>
              <input type="number" className="form-input" value={inactiviteMax} disabled />
              <small className="text-secondary">Si aucun enregistrement créé depuis X mois, l'utilisateur est désactivé.</small>
            </div>
            <div className="form-group">
              <label>Seuil d'alerte proche (jours)</label>
              <input type="number" className="form-input" value={seuilProche} disabled />
              <small className="text-secondary">Notification X jours avant la date prévue d'un vaccin.</small>
            </div>
            <div className="form-group">
              <label>Délai de rappel (jours)</label>
              <input type="number" className="form-input" value={delaiRappel} disabled />
              <small className="text-secondary">Notification de rappel tous les X jours après la date prévue.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdgParametres;