import React, { useState } from "react"; 
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [prenom, setPrenom] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleLogin = async () => {
    setError("");

    try {
      const response = await axios.post(
        "/api/users/login",
        { prenom, mdp },
        { withCredentials: true }
      );

      const result = response.data;

      if (!Array.isArray(result)) {
        setError("Réponse serveur invalide");
        return;
      }

      const status = result[0];

      if (
        status === "Mot de passe incorrect" ||
        status === "Prenom introuvable"
      ) {
        setError(status);
        return;
      }

      try {
        const meRes = await axios.get("/api/users/me", { withCredentials: true });
        login({ id: meRes.data.id, prenom: result[2], role: result[1] });
      } catch (err) {
        login({ prenom: result[2], role: result[1] });
      }

      if (status === "changer-mdp") {
        window.location.href = "/changer-mdp";
      } else if (status === "superadmin" || status === "admin") {
        window.location.href = "/superadmin/users";
      } else if (status === "pdg") {
        window.location.href = "/pdg/users";
      } else if (status === "coordinateur") {
        window.location.href = "/coordinateur";
      } else {
        window.location.href = "/accueil";
      }
    } catch (err) {
      const message = Array.isArray(err.response?.data)
        ? err.response.data[0]
        : err.response?.data || "Erreur lors de la connexion.";
      setError(message);
    }
  };

  return (
    <div className="page-center">
      <div className="card auth-card">
        <h1 className="brand-title">Paidou</h1>
        <p className="text-secondary">Suivi vaccinal des crèches</p>

        <div className="form-group">
          <label>Prénom</label>
          <div className="input-with-suffix">
            <input
              type="text"
              placeholder="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <span className="input-suffix">@paidou.fr</span>
          </div>
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="mot de passe"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={handleLogin}>
          Se connecter
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;