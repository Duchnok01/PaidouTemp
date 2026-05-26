import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/users/me", { withCredentials: true });
        setUser({ id: res.data.id, prenom: res.data.prenom, role: res.data.role });
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => {
    setUser({
      id: userData.id,
      prenom: userData.prenom,
      role: userData.role,
    });
  };

  const logout = async () => {
    await axios.post("/api/users/logout", {}, { withCredentials: true });
    setUser(null);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;