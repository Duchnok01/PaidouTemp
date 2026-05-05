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
      const response = await axios.post("/api/users/login", {
        prenom,
        mdp,
      });

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

      // login context
      login({
        prenom: result[2],
        role: result[1],
      });

      // redirections
      if (status === "changer-mdp") {
        navigate("/changer-mdp");
      } else if (status === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/accueil");
      }
    } catch (err) {
      setError("Erreur serveur");
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