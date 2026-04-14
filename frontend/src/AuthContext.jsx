import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE_URL } from "./api.js";

const TOKEN_KEY = "luminara-auth-token";

const AuthContext = createContext(null);

async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const loadMe = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const res = await apiFetch("/auth/me", { method: "GET" });
      if (!res.ok) {
        clearSession();
        setReady(true);
        return;
      }
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      clearSession();
    } finally {
      setReady(true);
    }
  }, [clearSession]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(
    async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const register = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Could not create account");
    }
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      reloadUser: loadMe,
    }),
    [user, ready, login, register, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export { apiFetch, TOKEN_KEY };
