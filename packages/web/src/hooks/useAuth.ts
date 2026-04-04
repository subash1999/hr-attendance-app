import { useState, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";
import React from "react";
import { ROLE_PERMISSIONS } from "@hr-attendance-app/types";

interface AuthState {
  readonly token: string | null;
  readonly employeeId: string | null;
  readonly role: string | null;
  readonly permissions: readonly string[];
  readonly isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, employeeId: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_PERMISSIONS: readonly string[] = [];
const AUTH_STORAGE_KEY = "hr-app-auth";

interface StoredAuth {
  readonly token: string;
  readonly employeeId: string;
  readonly role: string;
}

const INITIAL_AUTH: AuthState = {
  token: null,
  employeeId: null,
  role: null,
  permissions: EMPTY_PERMISSIONS,
  isAuthenticated: false,
};

const loadStoredAuth = (): AuthState => {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return INITIAL_AUTH;
    const stored = JSON.parse(raw) as StoredAuth;
    if (!stored.token || !stored.employeeId || !stored.role) return INITIAL_AUTH;
    const rolePermissions = ROLE_PERMISSIONS[stored.role] ?? EMPTY_PERMISSIONS;
    return {
      token: stored.token,
      employeeId: stored.employeeId,
      role: stored.role,
      permissions: rolePermissions,
      isAuthenticated: true,
    };
  } catch {
    return INITIAL_AUTH;
  }
};

const saveAuth = (token: string, employeeId: string, role: string): void => {
  try {
    const stored: StoredAuth = { token, employeeId, role };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
  } catch { /* noop */ }
};

const clearAuth = (): void => {
  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* noop */ }
};

export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(loadStoredAuth);

  const login = useCallback((token: string, employeeId: string, role: string) => {
    const rolePermissions = ROLE_PERMISSIONS[role] ?? EMPTY_PERMISSIONS;
    saveAuth(token, employeeId, role);
    setAuth({ token, employeeId, role, permissions: rolePermissions, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(INITIAL_AUTH);
  }, []);

  return React.createElement(AuthContext.Provider, { value: { ...auth, login, logout } }, children);
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
