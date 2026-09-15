import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));
  const [loading, setLoading] = useState(Boolean(token));

  function persistAuth(authData) {
    localStorage.setItem("chat_token", authData.token);
    localStorage.setItem("chat_user", JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
  }

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    persistAuth(data);
    return data;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    persistAuth(data);
    return data;  
  }

  function logout() {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    let ignore = false;

    async function validateToken() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        if (!ignore) {
          setUser(data.user);
          localStorage.setItem("chat_user", JSON.stringify(data.user));
        }
      } catch {
        if (!ignore) logout();
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    validateToken();

    return () => {
      ignore = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
