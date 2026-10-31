"use client";

import React from "react";
import Link from "next/link";
import { Trophy, History, Flame } from "lucide-react";

export type NavTab = "arabiano" | "mexicano" | "leaderboard" | "history";

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeCounts?: {
    arabiano: boolean;
    mexicano: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeCounts,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-emerald-500/20 shadow-2xl">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/30 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                PadelOnly <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Tour</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Americano & Mexicano Tournament Platform
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange("arabiano");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "arabiano"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>🎾 Arabiano Tour</span>
            {activeCounts?.arabiano && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            )}
          </Link>

          <Link
            href="/mexicano"
            onClick={(e) => {
              e.preventDefault();
              onTabChange("mexicano");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "mexicano"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>🇲🇽 Mexicano Style</span>
            {activeCounts?.mexicano && (
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            )}
          </Link>

          <Link
            href="/leaderboard"
            onClick={(e) => {
              e.preventDefault();
              onTabChange("leaderboard");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "leaderboard"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/history"
            onClick={(e) => {
              e.preventDefault();
              onTabChange("history");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Tour History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
