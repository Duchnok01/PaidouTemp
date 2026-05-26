import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ChangerMotDePasse = () => {
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user]);

  const handleSubmit = async () => {
    setError("");

    if (!user) {
      navigate("/");
      return;
    }

    if (nouveauMdp !== confirmation) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await axios.put("/api/users/set-password", {
        nouveauMdp: nouveauMdp,
      }, {
        withCredentials: true,
      });

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/accueil");
      }
    } catch (err) {
      const message = err.response?.data || "Erreur réseau ou serveur";
      setError(message);
    }
  };

  return (
    <div className="page-center">
      <div className="card auth-card">
        <h1 className="brand-title">Paidou</h1>
        <h2>Changer mot de passe</h2>

        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={nouveauMdp}
            onChange={(e) => setNouveauMdp(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Confirmation</label>
          <input
            type="password"
            placeholder="Confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSubmit}>
          Valider
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default ChangerMotDePasse;