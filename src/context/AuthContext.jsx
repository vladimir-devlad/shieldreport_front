// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const decodeUser = (token) => {
  try {
    const decoded = jwtDecode(token);

    // Si el token ya expiró lo descartamos
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem("token");
      return null;
    }

    return {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      name: decoded.name,
      lastName: decoded.last_name,
    };
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem("token");
  const decodedUser = storedToken ? decodeUser(storedToken) : null;

  // Si el usuario decodificado es null el token era inválido/expirado
  const [token, setToken] = useState(decodedUser ? storedToken : null);
  const [user, setUser] = useState(decodedUser);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(decodeUser(newToken));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
