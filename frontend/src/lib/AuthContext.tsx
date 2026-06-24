"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem("dailynotescloud_token");
    localStorage.removeItem("dailynotescloud_user");
  };

  // Initialize auth state from localStorage on startup
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("dailynotescloud_token");
      const storedUser = localStorage.getItem("dailynotescloud_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token with backend
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem("dailynotescloud_user", JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            handleLogout();
          }
        } catch (err) {
          console.warn("[auth]: Could not verify session with backend, keeping cached session.", err);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const handleAuthSuccess = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    setError(null);
    localStorage.setItem("dailynotescloud_token", token);
    localStorage.setItem("dailynotescloud_user", JSON.stringify(user));
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      handleAuthSuccess(data.token, data.user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sign up failed.");
      }

      handleAuthSuccess(data.token, data.user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed.");
      }

      handleAuthSuccess(data.token, data.user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        signup,
        loginWithGoogle,
        logout: handleLogout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
