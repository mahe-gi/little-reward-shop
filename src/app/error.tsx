"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-warm-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3 text-rose-600 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h2 className="font-serif text-xl font-bold text-warm-dark mb-1">
          Something went wrong
        </h2>

        <p className="text-xs text-warm-subtle leading-relaxed mb-4">
          An unexpected error occurred while loading this page.
        </p>

        {error?.message && (
          <div className="bg-warm-muted/70 rounded-xl p-3 text-left border border-warm-border mb-5">
            <div className="font-mono text-[11px] text-rose-700 break-all leading-tight">
              {error.message}
            </div>
            {error.digest && (
              <div className="text-[10px] text-warm-subtle mt-1 font-mono">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white text-xs font-semibold shadow-soft transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-warm-border hover:bg-warm-muted text-warm-dark text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
