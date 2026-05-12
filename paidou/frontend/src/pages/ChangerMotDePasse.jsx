import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ChangerMotDePasse = () => {
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Changer mot de passe</h2>

      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={nouveauMdp}
        onChange={(e) => setNouveauMdp(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Confirmation"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button onClick={handleSubmit}>Valider</button>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
      )}
    </div>
  );
};

export default ChangerMotDePasse;