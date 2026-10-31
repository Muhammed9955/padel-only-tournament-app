"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTab } from "./Header";
import { TournamentState } from "@/types/tournament";
import { Trophy, History } from "lucide-react";

interface QuickHubProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  activeTournaments: {
    arabiano: TournamentState | null;
    mexicano: TournamentState | null;
  };
  leaderboardCount: number;
  historyCount: number;
}

export const QuickHub: React.FC<QuickHubProps> = ({
  activeTab: propActiveTab,
  onTabChange,
  activeTournaments,
  leaderboardCount,
  historyCount,
}) => {
  const pathname = usePathname();

  const activeTab: NavTab =
    propActiveTab ??
    (pathname === "/mexicano"
      ? "mexicano"
      : pathname === "/leaderboard"
      ? "leaderboard"
      : pathname === "/history"
      ? "history"
      : "arabiano");

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Card 1: Arabiano Tour */}
      <Link
        href="/"
        onClick={() => onTabChange?.("arabiano")}
        className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
          activeTab === "arabiano"
            ? "bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xl">🎾</span>
          {activeTournaments.arabiano ? (
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
              Live
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-medium">Ready</span>
          )}
        </div>
        <div className="text-sm font-extrabold text-white mt-2">
          Arabiano Tour
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {activeTournaments.arabiano
            ? `Round ${activeTournaments.arabiano.currentRoundId} • ${activeTournaments.arabiano.players.length} players`
            : "Americano rotation"}
        </div>
      </Link>

      {/* Card 2: Mexicano Style */}
      <Link
        href="/mexicano"
        onClick={() => onTabChange?.("mexicano")}
        className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
          activeTab === "mexicano"
            ? "bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xl">🇲🇽</span>
          {activeTournaments.mexicano ? (
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              Live
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-medium">Ready</span>
          )}
        </div>
        <div className="text-sm font-extrabold text-white mt-2">
          Mexicano Style
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {activeTournaments.mexicano
            ? `Round ${activeTournaments.mexicano.currentRoundId} • ${activeTournaments.mexicano.players.length} players`
            : "1&4 vs 2&3 ladder"}
        </div>
      </Link>

      {/* Card 3: Leaderboard */}
      <Link
        href="/leaderboard"
        onClick={() => onTabChange?.("leaderboard")}
        className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
          activeTab === "leaderboard"
            ? "bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500/60 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <Trophy className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-semibold">
            {leaderboardCount} Players
          </span>
        </div>
        <div className="text-sm font-extrabold text-white mt-2">
          Leaderboard
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Career stats & points
        </div>
      </Link>

      {/* Card 4: Tour History */}
      <Link
        href="/history"
        onClick={() => onTabChange?.("history")}
        className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
          activeTab === "history"
            ? "bg-gradient-to-br from-purple-950/60 to-slate-900 border-purple-500/60 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10"
            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <History className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] text-slate-400 font-semibold">
            {historyCount} Tours
          </span>
        </div>
        <div className="text-sm font-extrabold text-white mt-2">
          Tour Archives
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Past completed tours
        </div>
      </Link>
    </div>
  );
};
