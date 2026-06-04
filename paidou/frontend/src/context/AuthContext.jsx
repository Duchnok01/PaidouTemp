import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation
  const [simulatedUser, setSimulatedUser] = useState(null); // { id, prenom, role }
  const [simulatableUsers, setSimulatableUsers] = useState([]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/users/me", { withCredentials: true });
        setUser({ id: res.data.id, prenom: res.data.prenom, role: res.data.role });
        // Vérifier si une simulation est active
        await refreshSimulationStatus();
      } catch (err) {
        setUser(null);
        setSimulatedUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Récupérer le statut de simulation depuis le backend
  const refreshSimulationStatus = async () => {
    try {
      const res = await axios.get("/api/simulation/status", { withCredentials: true });
      if (res.data.isSimulating) {
        setSimulatedUser({
          id: res.data.effectiveId,
          prenom: res.data.effectivePrenom,
          role: res.data.effectiveRole,
        });
      } else {
        setSimulatedUser(null);
      }
    } catch (err) {
      setSimulatedUser(null);
    }
  };

  // Récupérer la liste des utilisateurs simulables
  const fetchSimulatableUsers = async () => {
    try {
      const res = await axios.get("/api/simulation/simulatable", { withCredentials: true });
      setSimulatableUsers(res.data);
    } catch (err) {
      setSimulatableUsers([]);
    }
  };

  const login = (userData) => {
    setUser({
      id: userData.id,
      prenom: userData.prenom,
      role: userData.role,
    });
    setSimulatedUser(null);
  };

  const logout = async () => {
    await axios.post("/api/users/logout", {}, { withCredentials: true });
    setUser(null);
    setSimulatedUser(null);
    setSimulatableUsers([]);
  };

  // Démarrer la simulation d'un utilisateur
  const startSimulation = async (targetUserId) => {
    try {
      const res = await axios.post(`/api/simulation/start/${targetUserId}`, null, { withCredentials: true });
      await refreshSimulationStatus();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Arrêter la simulation
  const stopSimulation = async () => {
    try {
      await axios.post("/api/simulation/stop", null, { withCredentials: true });
      setSimulatedUser(null);
    } catch (err) {
      console.error("Erreur arrêt simulation", err);
    }
  };

  // L'utilisateur effectif (simulé ou réel)
  const effectiveUser = simulatedUser || user;

  if (loading) return <div>Chargement...</div>;

  return (
    <AuthContext.Provider value={{
      user,           // utilisateur réel
      effectiveUser,  // utilisateur effectif (simulé si simulation active)
      simulatedUser,  // null si pas de simulation, sinon l'utilisateur simulé
      simulatableUsers,
      login,
      logout,
      startSimulation,
      stopSimulation,
      fetchSimulatableUsers,
      refreshSimulationStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;