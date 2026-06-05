import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [simulatedUser, setSimulatedUser] = useState(null);
  const [simulatableUsers, setSimulatableUsers] = useState([]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/users/me", { withCredentials: true });
        setUser({ id: res.data.id, prenom: res.data.prenom, role: res.data.role });
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

  const startSimulation = async (targetUserId) => {
    try {
      const res = await axios.post(`/api/simulation/start/${targetUserId}`, null, { withCredentials: true });
      await refreshSimulationStatus();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const stopSimulation = async () => {
    try {
      await axios.post("/api/simulation/stop", null, { withCredentials: true });
      setSimulatedUser(null);
    } catch (err) {
      console.error("Erreur arrêt simulation", err);
    }
  };

  const effectiveUser = simulatedUser || user;

  const getHomePath = () => {
    if (!effectiveUser) return "/";
    if (effectiveUser.role === "superadmin" || effectiveUser.role === "admin") return "/superadmin/users";
    if (effectiveUser.role === "pdg") return "/pdg";
    if (effectiveUser.role === "coordinateur") return "/coordinateur";
    return "/accueil";
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <AuthContext.Provider value={{
      user,
      effectiveUser,
      simulatedUser,
      simulatableUsers,
      login,
      logout,
      startSimulation,
      stopSimulation,
      fetchSimulatableUsers,
      refreshSimulationStatus,
      getHomePath,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Hook de redirection intelligente
export const useRedirectByRole = (allowedRoles) => {
  const { effectiveUser, getHomePath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!effectiveUser) {
      navigate("/");
      return;
    }
    if (!allowedRoles.includes(effectiveUser.role)) {
      navigate(getHomePath());
    }
  }, [effectiveUser, allowedRoles, navigate, getHomePath]);
};

export default AuthContext;