"use client";

import React from "react";
import { Database, AlertTriangle, RefreshCw, KeyRound, ExternalLink } from "lucide-react";

interface DbNoticeProps {
  error: string;
  role?: string;
}

export function DbNotice({ error, role = "girlfriend" }: DbNoticeProps) {
  const isMissingDb = error.includes("DATABASE_URL") || error.includes("missing");
  const isTableMissing = error.includes("does not exist") || error.includes("relation");

  return (
    <div className="min-h-screen bg-warm-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-2xl text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-warm-dark mb-2">
          Database Setup Needed
        </h2>

        <p className="text-xs text-warm-subtle leading-relaxed mb-6">
          {isMissingDb
            ? "Your production deployment is missing the DATABASE_URL environment variable."
            : isTableMissing
            ? "Connected to PostgreSQL, but the required database tables have not been created yet."
            : "A database error occurred while loading your reward shop."}
        </p>

        {/* Error Callout */}
        <div className="bg-warm-muted/70 rounded-2xl p-3.5 text-left border border-warm-border mb-6">
          <div className="text-[10px] font-bold text-warm-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-warm-dark" />
            <span>Diagnostic Details</span>
          </div>
          <div className="font-mono text-[11px] text-rose-700 break-all leading-tight">
            {error}
          </div>
        </div>

        {/* Action Steps */}
        <div className="space-y-3 text-left bg-romantic-50/50 rounded-2xl p-4 border border-romantic-100 text-xs mb-6">
          <div className="font-bold text-warm-dark flex items-center gap-1.5 text-xs">
            <KeyRound className="w-4 h-4 text-romantic-500" />
            <span>How to resolve on Vercel:</span>
          </div>
          {isMissingDb ? (
            <ol className="list-decimal list-inside space-y-1 text-warm-subtle text-[11px] leading-relaxed">
              <li>Open your project in the Vercel Dashboard.</li>
              <li>Go to <b>Settings → Environment Variables</b>.</li>
              <li>
                Add <code className="bg-white px-1 py-0.5 rounded border">DATABASE_URL</code>{" "}
                with your Neon or PostgreSQL connection string.
              </li>
              <li>Click <b>Redeploy</b>.</li>
            </ol>
          ) : isTableMissing ? (
            <ol className="list-decimal list-inside space-y-1 text-warm-subtle text-[11px] leading-relaxed">
              <li>Run the migration against your production database:</li>
              <li className="font-mono text-[10px] bg-white p-1.5 rounded border">
                DATABASE_URL=&quot;&lt;your-neon-url&gt;&quot; npm run db:push
              </li>
              <li>Seed the initial catalog rewards:</li>
              <li className="font-mono text-[10px] bg-white p-1.5 rounded border">
                DATABASE_URL=&quot;&lt;your-neon-url&gt;&quot; npm run db:seed
              </li>
            </ol>
          ) : (
            <p className="text-[11px] text-warm-subtle">
              Verify that your PostgreSQL database server is active and accepts incoming connections.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 rounded-xl bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white text-xs font-semibold shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-3 rounded-xl bg-white border border-warm-border hover:bg-warm-muted text-warm-dark text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span>Diagnostics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
