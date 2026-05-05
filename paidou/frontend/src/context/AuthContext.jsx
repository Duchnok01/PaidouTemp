import React, { createContext, useContext, useState } from "react";

// Création du contexte
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser({
      prenom: userData.prenom,
      role: userData.role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour accès rapide
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;