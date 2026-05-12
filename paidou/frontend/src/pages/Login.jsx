import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [prenom, setPrenom] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
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

      // Après login, récupérer l'id utilisateur
      try {
        const meRes = await axios.get("/api/users/me", { withCredentials: true });
        login({ id: meRes.data.id, prenom: result[2], role: result[1] });
      } catch (err) {
        // fallback : si /me échoue, on met quand même prenom/role
        login({ prenom: result[2], role: result[1] });
      }

      // redirections
      if (status === "changer-mdp") {
        navigate("/changer-mdp");
      } else if (status === "admin") {
        navigate("/admin");
      } else {
        navigate("/accueil");
      }
    } catch (err) {
      const message = Array.isArray(err.response?.data) 
      ? err.response.data[0] 
      : err.response?.data || "Erreur lors de la connexion.";
      setError(message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Connexion</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="prenom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
        />
        <span style={{ marginLeft: "8px" }}>@paidou.fr</span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="password"
          placeholder="mot de passe"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
        />
      </div>

      <button onClick={handleLogin}>Se connecter</button>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
      )}
    </div>
  );
};

export default Login;