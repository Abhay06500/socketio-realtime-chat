import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

// Create authentication context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Load saved user data from local storage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load saved authentication token
  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));

  // Track authentication validation state
  const [loading, setLoading] = useState(Boolean(token));

  // Save authentication data locally and update state
  function persistAuth(authData) {
    localStorage.setItem("chat_token", authData.token);
    localStorage.setItem("chat_user", JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
  }

  // Login user with provided credentials
  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    persistAuth(data);
    return data;
  }

  // Register a new user
  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    persistAuth(data);
    return data;  
  }

  // Clear authentication data and logout the user
  function logout() {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUser(null);
  }

  // Validate the stored authentication token
  useEffect(() => {
    let ignore = false;

    async function validateToken() {
      // Stop validation when no token is available
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the currently authenticated user
        const { data } = await api.get("/auth/me");

        if (!ignore) {
          setUser(data.user);
          localStorage.setItem("chat_user", JSON.stringify(data.user));
        }
      } catch {
        // Logout if the token is invalid or expired
        if (!ignore) logout();
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    validateToken();

    // Prevent state updates after component cleanup
    return () => {
      ignore = true;
    };
  }, [token]);

  // Memoize authentication values shared through context
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

// Custom hook for accessing authentication context
export function useAuth() {
  const context = useContext(AuthContext);

  // Ensure the hook is used inside AuthProvider
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}