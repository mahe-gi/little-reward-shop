"use client";

import React from "react";
import { logoutAction } from "@/actions/auth";

export function AdminSettings() {
  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-warm-dark">Admin Settings</h2>
        <p className="text-xs text-warm-subtle">
          Application configuration and session management.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-warm-border shadow-soft p-6 space-y-4 max-w-lg">
        <h3 className="font-serif text-base font-bold text-warm-dark">System & Preferences</h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-warm-border">
            <span className="text-warm-subtle">Application Name:</span>
            <span className="font-semibold text-warm-dark">Our Little Reward Shop</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-warm-border">
            <span className="text-warm-subtle">Girlfriend Name:</span>
            <span className="font-semibold text-warm-dark">Her</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-warm-border">
            <span className="text-warm-subtle">Admin / Boyfriend:</span>
            <span className="font-semibold text-warm-dark">Mahesh</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-warm-border">
            <span className="text-warm-subtle">Design System:</span>
            <span className="font-semibold text-romantic-600">Velvet & Keepsake (Stitch)</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-warm-subtle">PWA Status:</span>
            <span className="font-semibold text-emerald-600">Standalone PWA Ready</span>
          </div>
        </div>

        <div className="pt-4 border-t border-warm-border">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            Log Out of Admin
          </button>
        </div>
      </div>
    </div>
  );
}
