"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

export const AuthView: React.FC = () => {
  const { login, signup, loginWithGoogle, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Asynchronously load Google Identity Services client script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 2. Initialize and render the Google Sign-In Button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogleSignIn = () => {
      const g = window.google;
      if (g && g.accounts && g.accounts.id) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: GoogleCredentialResponse) => {
            setIsSubmitting(true);
            setAuthError(null);
            try {
              await loginWithGoogle(response.credential);
            } catch (err) {
              setAuthError((err as Error).message || "Google sign-in failed.");
              setIsSubmitting(false);
            }
          },
        });

        const buttonDiv = document.getElementById("google-signin-btn");
        if (buttonDiv) {
          g.accounts.id.renderButton(buttonDiv, {
            theme: "filled_dark",
            size: "large",
            shape: "pill",
            width: "360",
          });
        }
      }
    };

    // Poll for the Google script to be loaded on window
    const pollInterval = setInterval(() => {
      if (window.google) {
        clearInterval(pollInterval);
        initGoogleSignIn();
      }
    }, 100);

    return () => clearInterval(pollInterval);
  }, [loginWithGoogle, isSignUp]); // Re-initialize if view toggles to ensure button mounts correctly

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !displayName)) return;

    setIsSubmitting(true);
    setAuthError(null);
    clearError();

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setAuthError((err as Error).message || "Authentication failed.");
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setAuthError(null);
    clearError();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 items-center justify-center shadow-lg shadow-sky-500/15 mb-2">
            <span className="font-extrabold text-white text-xl">D</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-slate-400">
            {isSignUp ? "Sign up to start organizing your cloud notes" : "Sign in to access your cloud-synced notes"}
          </p>
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center animate-shake">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Display Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-sm font-semibold text-white hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-sky-500/10 cursor-pointer flex justify-center items-center"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800/60"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 tracking-wider">OR</span>
              <div className="flex-grow border-t border-slate-800/60"></div>
            </div>

            {/* Google OAuth Button Container */}
            <div className="flex justify-center">
              <div id="google-signin-btn" className="h-[40px]"></div>
            </div>
          </>
        )}

        <div className="text-center pt-2">
          <button
            onClick={toggleMode}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
