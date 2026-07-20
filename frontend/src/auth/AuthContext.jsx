import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { setAccessToken, setOnAuthExpired } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // On first load there's no access token in memory yet (a page refresh
  // wipes it, by design — see docs/02-system-design.md §6), so we attempt a
  // silent refresh using the httpOnly cookie to restore the session.
  useEffect(() => {
    setOnAuthExpired(clearSession);
    (async () => {
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.access);
        const me = await authApi.me();
        setUser(me.data);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.access);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    setAccessToken(data.access);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshMe = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user?.role === "staff" || user?.role === "admin"),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, isLoading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
