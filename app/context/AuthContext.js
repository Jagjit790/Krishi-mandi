"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("krishi_farmer_session");
      if (stored) {
        // Schedule state update after effect setup
        queueMicrotask(() => {
          setUser(JSON.parse(stored));
        });
      }
    } catch (e) {
      console.error("Failed to restore farmer auth session:", e);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem("krishi_farmer_session", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save auth session:", e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("krishi_farmer_session");
    } catch (e) {
      console.error("Failed to clear auth session:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
