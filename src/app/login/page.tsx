"use client";

import React, { useState } from "react";
import { loginAction } from "@/actions/auth";
import { UserRole } from "@/types";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("girlfriend");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [existingSession, setExistingSession] = useState<{ name: string; role: UserRole } | null>(null);

  React.useEffect(() => {
    import("@/actions/auth").then(({ getSessionAction }) => {
      getSessionAction().then((session) => {
        if (session) {
          setExistingSession({ name: session.name, role: session.role });
        }
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("role", selectedRole);
    formData.append("password", password);

    try {
      const res = await loginAction(formData);
      if (res.success) {
        if (res.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch {
      setError("An unexpected error occurred. Please check server configuration.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-warm-cream via-romantic-50/40 to-warm-cream">
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl border border-warm-border text-center relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-romantic-200/30 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Icon */}
        <div className="relative w-16 h-16 rounded-2xl bg-romantic-100 border border-romantic-200 text-romantic-600 text-3xl flex items-center justify-center mx-auto mb-3 shadow-soft animate-heart">
          ❤️
        </div>

        <span className="text-[11px] uppercase tracking-widest font-semibold text-romantic-600">
          Our Private Universe
        </span>
        <h1 className="font-serif text-2xl font-bold text-warm-dark mt-1">
          Our Little Reward Shop
        </h1>
        <p className="text-xs text-warm-subtle mt-1.5 leading-relaxed">
          Good habits deserve good rewards. Sign in to your dedicated space.
        </p>

        {/* Existing Session Prompt (if already signed in) */}
        {existingSession && (
          <div className="mt-4 p-3 rounded-2xl bg-warm-muted border border-warm-border text-left">
            <div className="text-[11px] text-warm-subtle">Currently signed in:</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-warm-dark">
                {existingSession.role === "admin" ? "🧔 Mahesh" : "👩‍🦰 Her"}
              </span>
              <a
                href={existingSession.role === "admin" ? "/admin" : "/"}
                className="text-xs font-semibold text-romantic-600 hover:text-romantic-700 underline"
              >
                Go to {existingSession.role === "admin" ? "Admin" : "Shop"} →
              </a>
            </div>
          </div>
        )}

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 my-5 bg-warm-muted p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("girlfriend");
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "girlfriend"
                ? "bg-white text-romantic-600 shadow-sm"
                : "text-warm-subtle hover:text-warm-dark"
            }`}
          >
            <span>👩‍🦰</span>
            <span>I&apos;m Her</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "admin"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-warm-subtle hover:text-warm-dark"
            }`}
          >
            <span>🧔</span>
            <span>I&apos;m Mahesh</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div>
            <label className="block text-[11px] font-semibold text-warm-dark mb-1">
              {selectedRole === "girlfriend" ? "Her Password" : "Mahesh's Password"}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter private password..."
              className="w-full px-3.5 py-2.5 bg-white border border-warm-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-romantic-400 text-warm-dark placeholder:text-warm-taupe"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50 mt-2 active:scale-[0.98] ${
              selectedRole === "admin"
                ? "bg-stone-900 hover:bg-stone-800"
                : "bg-romantic-500 hover:bg-romantic-600"
            }`}
          >
            {isLoading
              ? "Signing in..."
              : selectedRole === "admin"
              ? "Enter Admin Control 🧔"
              : "Enter Reward Shop ❤️"}
          </button>
        </form>

        <div className="mt-6 pt-3 border-t border-warm-border text-[11px] text-warm-subtle">
          Encrypted with love & pinky promises 💌
        </div>
      </div>
    </div>
  );
}
