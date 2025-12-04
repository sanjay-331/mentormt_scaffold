// // frontend/src/context/AuthContext.jsx
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import api from '../services/api';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setLoading(false);
//       return;
//     }
//     // fetch /me using api client (it will attach auth header)
//     api.get('/auth/me')
//       .then(res => setUser(res.data))
//       .catch(() => {
//         localStorage.removeItem('token');
//         setUser(null);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }
// src/context/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on first render
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Call backend /api/auth/login
  const login = async (email, password) => {
    // IMPORTANT: backend expects email/password as query params, not JSON body
    const response = await api.post("/api/auth/login", null, {
      params: { email, password },
    });

    const { access_token, user: userData } = response.data;

    setAccessToken(access_token);
    setUser(userData);

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(userData));

    return userData;
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  };

  const value = { user, accessToken, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
