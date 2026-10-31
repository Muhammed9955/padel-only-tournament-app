"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PlayerCareerStats,
  TournamentStyle,
} from "@/types/tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Search,
  Users,
  Calendar,
  ChevronRight,
  X,
  RotateCcw,
  Cloud,
  Share2,
  Copy,
  Check,
  Crown,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
  Clock,
} from "lucide-react";

interface GlobalLeaderboardProps {
  leaderboard: PlayerCareerStats[];
  onResetLeaderboard?: () => void;
  onAddSampleStats?: () => void;
  onSyncCloud?: () => Promise<{ success: boolean; message: string }>;
  isCloudConfigured?: boolean;
}

type SortField =
  | "points"
  | "winRate"
  | "tours"
  | "won"
  | "championships"
  | "top4"
  | "avg";

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  leaderboard,
  onSyncCloud,
}) => {
  // Default to active current month (2026-10) to showcase the monthly season battle!
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [filterStyle, setFilterStyle] = useState<"all" | TournamentStyle>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerCareerStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Extract all available months from tour history (with 2026-10 as current)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add("2026-10");

    leaderboard.forEach((p) => {
      (p.tourHistory || []).forEach((t) => {
        if (t.date) {
          const m = t.date.slice(0, 7);
          if (m && m.length === 7) {
            monthSet.add(m);
          }
        }
      });
    });

    return Array.from(monthSet).sort().reverse();
  }, [leaderboard]);

  const formatMonthLabel = (m: string) => {
    if (m === "all") return "🌟 All-Time Career";
    const [year, month] = m.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return m === "2026-10" ? `🔥 ${label} (Active)` : `🗓️ ${label}`;
  };

  // Compute processed, filtered and ranked players
  const processedPlayers = useMemo(() => {
    return leaderboard
      .map((player) => {
        if (selectedMonth === "all") {
          let tours = player.toursPlayed;
          let points = player.totalPoints;
          const won = player.matchesWon;
          const lost = player.matchesLost;
          const played = player.matchesPlayed;
          const champ = player.championships;
          const top4 = player.top4Finishes;

          if (filterStyle === "arabiano") {
            tours = player.styleBreakdown.arabiano;
            points = player.pointsBreakdown.arabiano;
          } else if (filterStyle === "mexicano") {
            tours = player.styleBreakdown.mexicano;
            points = player.pointsBreakdown.mexicano;
          }

          const winRate =
            played > 0 ? Math.round((won / played) * 100) : 0;
          const avgPoints = tours > 0 ? (points / tours).toFixed(1) : "0.0";

          return {
            ...player,
            displayTours: tours,
            displayPoints: points,
            displayWon: won,
            displayLost: lost,
            displayPlayed: played,
            displayChampionships: champ,
            displayTop4: top4,
            winRate,
            avgPoints,
          };
        } else {
          // Monthly dynamic calculation
          const matchingHistory = (player.tourHistory || []).filter((t) => {
            const isMatchDate = t.date?.startsWith(selectedMonth);
            const isMatchStyle = filterStyle === "all" || t.style === filterStyle;
            return isMatchDate && isMatchStyle;
          });

          const points = matchingHistory.reduce((acc, t) => acc + t.points, 0);
          const tours = matchingHistory.length;
          const won = matchingHistory.reduce((acc, t) => acc + t.matchesWon, 0);
          const lost = matchingHistory.reduce((acc, t) => acc + t.matchesLost, 0);
          const played = matchingHistory.reduce((acc, t) => acc + t.matchesPlayed, 0);
          const champ = matchingHistory.filter((t) => t.rank === 1).length;
          const top4 = matchingHistory.filter((t) => t.rank <= 4).length;
          const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
          const avgPoints = tours > 0 ? (points / tours).toFixed(1) : "0.0";

          return {
            ...player,
            displayTours: tours,
            displayPoints: points,
            displayWon: won,
            displayLost: lost,
            displayPlayed: played,
            displayChampionships: champ,
            displayTop4: top4,
            winRate,
            avgPoints,
          };
        }
      })
      .filter((p) => {
        // If monthly filter, only show players who participated in that month
        if (selectedMonth !== "all" && p.displayTours === 0) return false;
        // If style filter, only show players with tours in that style
        if (filterStyle !== "all" && p.displayTours === 0) return false;
        // Search filter
        if (searchQuery.trim()) {
          return p.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "points") {
          diff = b.displayPoints - a.displayPoints || b.displayWon - a.displayWon;
        } else if (sortField === "winRate") {
          diff = b.winRate - a.winRate || b.displayPoints - a.displayPoints;
        } else if (sortField === "tours") {
          diff = b.displayTours - a.displayTours || b.displayPoints - a.displayPoints;
        } else if (sortField === "won") {
          diff = b.displayWon - a.displayWon || b.displayPoints - a.displayPoints;
        } else if (sortField === "championships") {
          diff =
            b.displayChampionships - a.displayChampionships ||
            b.displayPoints - a.displayPoints;
        } else if (sortField === "top4") {
          diff = b.displayTop4 - a.displayTop4 || b.displayPoints - a.displayPoints;
        } else if (sortField === "avg") {
          diff = parseFloat(b.avgPoints) - parseFloat(a.avgPoints);
        } else {
          diff = b.displayPoints - a.displayPoints;
        }
        return sortAsc ? -diff : diff;
      });
  }, [leaderboard, selectedMonth, filterStyle, searchQuery, sortField, sortAsc]);

  // High-level season metrics
  const seasonStats = useMemo(() => {
    const totalPoints = processedPlayers.reduce((acc, p) => acc + p.displayPoints, 0);
    const totalMatchesPlayed = processedPlayers.reduce((acc, p) => acc + p.displayPlayed, 0);
    const estimatedMatches = Math.round(totalMatchesPlayed / 4);
    const maxTours =
      processedPlayers.length > 0
        ? Math.max(...processedPlayers.map((p) => p.displayTours))
        : 0;
    const leader = processedPlayers[0] || null;

    return {
      totalPoints,
      estimatedMatches,
      maxTours,
      playerCount: processedPlayers.length,
      leader,
    };
  }, [processedPlayers]);

  const handleCopyLeaderboardLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/leaderboard`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsAppLeaderboard = () => {
    const periodName =
      selectedMonth === "all"
        ? "All-Time"
        : formatMonthLabel(selectedMonth).replace(/[🔥🗓️]/g, "").trim();
    const top3 = processedPlayers
      .slice(0, 3)
      .map(
        (p, i) =>
          `${i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} #${i + 1} ${p.name}: ${p.displayPoints} pts (${p.displayTours} tours)`
      )
      .join("\n");
    const url = typeof window !== "undefined" ? `${window.location.origin}/leaderboard?v=1` : "";
    const msg = `🏆 *Arabiano Padel Leaderboard (${periodName})* 🏆\n\n${top3}\n\n👉 View complete standings & player profiles:\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  // Top 3 Podium
  const top1 = processedPlayers[0] || null;
  const top2 = processedPlayers[1] || null;
  const top3 = processedPlayers[2] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Season Selector */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Standings 2026
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Monthly Seasons with Lifetime Archives
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Arabiano Tour Hall of Fame
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every half won and match played is tracked permanently. Filter by monthly season or view lifetime career totals!
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleShareWhatsAppLeaderboard}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Share on WhatsApp
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLeaderboardLink}
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Link
                </>
              )}
            </Button>

            {onSyncCloud && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncing}
                onClick={async () => {
                  setIsSyncing(true);
                  setSyncFeedback(null);
                  try {
                    const res = await onSyncCloud();
                    setSyncFeedback(res.message);
                    setTimeout(() => setSyncFeedback(null), 3000);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                className="border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold"
              >
                <Cloud className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-pulse text-cyan-400" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync with Supabase"}
              </Button>
            )}

            {syncFeedback && (
              <span className="text-xs text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800">
                ✓ {syncFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Monthly Season Selector Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">Select Season:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMonth("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedMonth === "all"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-900"
              }`}
            >
              🌟 All-Time Career
            </button>

            {availableMonths.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedMonth === m
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-900"
                }`}
              >
                {formatMonthLabel(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Season Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              {selectedMonth === "all" ? "All-Time #1" : "October Leader"}
            </span>
            <span className="text-sm font-black text-white truncate block">
              {seasonStats.leader ? seasonStats.leader.name : "–"}
            </span>
            <span className="text-xs text-amber-400 font-bold">
              {seasonStats.leader ? `${seasonStats.leader.displayPoints} pts` : "0 pts"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Tours Recorded
            </span>
            <span className="text-sm sm:text-base font-black text-white block">
              {seasonStats.maxTours} Tournaments
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {selectedMonth === "all" ? "Complete Archive" : "October 2026"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Ranked Players
            </span>
            <span className="text-sm sm:text-base font-black text-white block">
              {seasonStats.playerCount} Competitors
            </span>
            <span className="text-xs text-cyan-400 font-bold">
              Active Roster
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Points Scored
            </span>
            <span className="text-sm sm:text-base font-black text-white block">
              {seasonStats.totalPoints} Points
            </span>
            <span className="text-xs text-teal-400 font-bold">
              ~{seasonStats.estimatedMatches} Matches Played
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Refresh & History Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-black text-white block text-xs sm:text-sm">
              {selectedMonth === "all"
                ? "🌟 Lifetime Career Archives Active"
                : `🗓️ Monthly Championship Season: ${formatMonthLabel(selectedMonth).replace(/[🔥🗓️]/g, "").trim()}`}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              {selectedMonth === "all"
                ? "Every half won and tournament finished is permanently preserved in the Hall of Fame archives."
                : "Points reset at the start of each month giving every player a fresh clean slate to compete for the monthly crown. All past scores are saved forever in Career History!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-3 py-1 rounded-full bg-slate-900 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            Season Resets: 1st of Every Month
          </span>
        </div>
      </div>

      {/* Mobile Champion Spotlight (Styled exactly like user reference) */}
      {top1 && (
        <div className="block md:hidden p-6 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border border-amber-500/30 text-center shadow-2xl relative overflow-hidden">
          {/* Radiant radial warm glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Trophy in glowing circle */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-400/40 shadow-xl shadow-amber-500/20 mb-3">
            <span className="text-3xl animate-bounce">🏆</span>
          </div>

          {/* Quote-framed Champion Pill */}
          <div className="relative flex items-center justify-center gap-2">
            <span className="text-3xl font-serif text-amber-400/70 font-black select-none">“</span>
            <Link
              href={`/player/${encodeURIComponent(top1.name)}`}
              className="px-4 py-2 rounded-2xl bg-amber-400/20 border-2 border-amber-400/70 shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm sm:text-base font-black text-amber-300 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-base">🥇</span>
              <span>{top1.name}</span>
            </Link>
            <span className="text-3xl font-serif text-amber-400/70 font-black select-none">”</span>
          </div>

          {/* Subtitle */}
          <p className="relative text-xs font-bold text-slate-300 tracking-wide mt-2">
            {selectedMonth === "all" ? "Tournament Champion (All-Time)" : `${formatMonthLabel(selectedMonth).replace(/[🔥🗓️]/g, "").trim()} Champion`}
          </p>

          {/* Leader Quick Highlights */}
          <div className="relative mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
            <span className="text-amber-300 font-black">{top1.displayPoints} pts</span>
            <span>•</span>
            <span>{top1.displayTours} tours</span>
            <span>•</span>
            <span className="text-emerald-400">{top1.winRate}% win rate</span>
            {top1.displayChampionships > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400">🏆 {top1.displayChampionships} titles</span>
              </>
            )}
          </div>

          {/* Runner-ups */}
          {top2 && (
            <div className="relative mt-3 pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <span>🥈</span>
                <Link href={`/player/${encodeURIComponent(top2.name)}`} className="text-slate-300 hover:text-white">
                  {top2.name} ({top2.displayPoints} pts)
                </Link>
              </span>
              {top3 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <span>🥉</span>
                    <Link href={`/player/${encodeURIComponent(top3.name)}`} className="text-slate-300 hover:text-white">
                      {top3.name} ({top3.displayPoints} pts)
                    </Link>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Desktop Top 3 Podium Cards */}
      {processedPlayers.length >= 3 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 items-end">
          {/* 🥈 #2 Silver Medal */}
          <div className="order-2 md:order-1 p-5 rounded-3xl bg-slate-900/90 border border-slate-700/60 shadow-xl relative overflow-hidden group hover:border-slate-500 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-400/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🥈</span>
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Rank #2
              </span>
            </div>

            <Link
              href={`/player/${encodeURIComponent(top2.name)}`}
              className="text-lg font-black text-white hover:text-slate-200 transition-colors block"
            >
              {top2.name}
            </Link>
            <div className="text-xs text-slate-400 mt-0.5">
              {top2.displayTours} {top2.displayTours === 1 ? "Tour" : "Tours"} • {top2.winRate}% Win Rate
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Points</span>
                <span className="text-2xl font-black text-slate-200">{top2.displayPoints}</span>
              </div>
              <Link
                href={`/player/${encodeURIComponent(top2.name)}`}
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
              >
                Profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 🥇 #1 Gold Champion */}
          <div className="order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 relative overflow-hidden group hover:border-amber-400 transition-all md:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Current Leader
                </span>
              </div>
              <span className="text-2xl">🥇</span>
            </div>

            <Link
              href={`/player/${encodeURIComponent(top1.name)}`}
              className="text-xl sm:text-2xl font-black text-white hover:text-amber-300 transition-colors block"
            >
              {top1.name}
            </Link>
            <div className="text-xs text-amber-300/80 font-medium mt-1 flex items-center gap-2">
              <span>{top1.displayTours} Tours</span>
              <span>•</span>
              <span>{top1.displayChampionships} {top1.displayChampionships === 1 ? "Title" : "Titles"}</span>
              <span>•</span>
              <span>{top1.winRate}% Win Rate</span>
            </div>

            <div className="mt-5 pt-4 border-t border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400/80 block uppercase font-bold">Total Points</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                  {top1.displayPoints}
                </span>
              </div>
              <Link
                href={`/player/${encodeURIComponent(top1.name)}`}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all"
              >
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 🥉 #3 Bronze Medal */}
          <div className="order-3 p-5 rounded-3xl bg-slate-900/90 border border-amber-900/40 shadow-xl relative overflow-hidden group hover:border-amber-700 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🥉</span>
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60">
                Rank #3
              </span>
            </div>

            <Link
              href={`/player/${encodeURIComponent(top3.name)}`}
              className="text-lg font-black text-white hover:text-amber-300 transition-colors block"
            >
              {top3.name}
            </Link>
            <div className="text-xs text-slate-400 mt-0.5">
              {top3.displayTours} {top3.displayTours === 1 ? "Tour" : "Tours"} • {top3.winRate}% Win Rate
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Points</span>
                <span className="text-2xl font-black text-amber-400">{top3.displayPoints}</span>
              </div>
              <Link
                href={`/player/${encodeURIComponent(top3.name)}`}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-lg sm:text-xl text-white font-black">
                {selectedMonth === "all" ? "Career Leaderboard" : `${formatMonthLabel(selectedMonth).replace(/[🔥🗓️]/g, "").trim()} Standings`}
              </CardTitle>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                {processedPlayers.length} Players
              </span>
            </div>

            {/* Format Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterStyle("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStyle === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Formats
              </button>
              <button
                type="button"
                onClick={() => setFilterStyle("arabiano")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStyle === "arabiano"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🎾 Arabiano
              </button>
              <button
                type="button"
                onClick={() => setFilterStyle("mexicano")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStyle === "mexicano"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🇲🇽 Mexicano
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search player name (e.g. Muhamed Khaled, Ahmed Kadry)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 rounded-xl text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>

        {/* Data Table */}
        <CardContent className="p-0">
          {/* Mobile Table View (Block on mobile, hidden on desktop) - Styled matching user screenshot */}
          <div className="block md:hidden">
            {processedPlayers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <span className="text-3xl">🎾</span>
                <p className="text-sm font-bold text-white">No players found</p>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? `No matching players for "${searchQuery}"`
                    : "No tournaments recorded in this season yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {/* Column Headers matching screenshot */}
                <div className="grid grid-cols-12 px-3 py-2.5 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider items-center border-b border-slate-800/80">
                  <div className="col-span-5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("points")}
                      className="hover:text-white transition-colors flex items-center gap-1 font-bold text-[10px]"
                    >
                      <span className="text-xs">👁️</span>
                      <span>Player</span>
                    </button>
                  </div>
                  <div className="col-span-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("won")}
                      className={`hover:text-white transition-colors font-bold text-[10px] ${
                        sortField === "won" ? "text-emerald-400 font-black" : ""
                      }`}
                    >
                      W-L
                    </button>
                  </div>
                  <div className="col-span-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("tours")}
                      className={`hover:text-white transition-colors font-bold text-[10px] ${
                        sortField === "tours" ? "text-cyan-400 font-black" : ""
                      }`}
                    >
                      Tours
                    </button>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("winRate")}
                      className={`hover:text-white transition-colors font-bold text-[10px] ${
                        sortField === "winRate" ? "text-emerald-400 font-black" : ""
                      }`}
                    >
                      Win%
                    </button>
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("points")}
                      className={`hover:text-white transition-colors font-bold text-[10px] pr-1 ${
                        sortField === "points" ? "text-cyan-400 font-black" : ""
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>

                {/* Mobile Rows */}
                {processedPlayers.map((player, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                  return (
                    <div
                      key={player.name}
                      onClick={() => setSelectedPlayer(player)}
                      className={`grid grid-cols-12 px-3 py-3 items-center text-xs transition-colors cursor-pointer hover:bg-slate-800/40 ${
                        idx === 0
                          ? "bg-amber-500/10 font-semibold"
                          : idx === 1
                          ? "bg-slate-300/5 font-semibold"
                          : idx === 2
                          ? "bg-amber-700/5 font-semibold"
                          : idx % 2 === 1
                          ? "bg-slate-950/40"
                          : ""
                      }`}
                    >
                      {/* Player Col: Rank + Name + Medal + Subtitle */}
                      <div className="col-span-5 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-black shrink-0 ${
                              idx < 3 ? "text-amber-400" : "text-slate-400"
                            }`}
                          >
                            {idx + 1}.
                          </span>
                          <Link
                            href={`/player/${encodeURIComponent(player.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-white hover:text-cyan-300 truncate transition-colors inline-flex items-center gap-1"
                          >
                            <span className="truncate">{player.name}</span>
                            {medal && <span className="shrink-0 text-xs">{medal}</span>}
                          </Link>
                        </div>
                        {/* Secondary stats row: titles / avg / format */}
                        <div className="text-[10px] text-slate-400 pl-4 mt-0.5 truncate flex items-center gap-1 font-medium">
                          {player.displayChampionships > 0 && (
                            <span className="text-amber-400 font-bold">
                              🏆 {player.displayChampionships}
                            </span>
                          )}
                          {player.displayChampionships > 0 && <span>•</span>}
                          <span>{player.avgPoints} avg</span>
                        </div>
                      </div>

                      {/* W-L Record */}
                      <div className="col-span-2 text-center text-[11px] font-semibold text-slate-300">
                        <span className="text-emerald-400 font-bold">{player.displayWon}</span>
                        <span className="text-slate-500">-</span>
                        <span className="text-rose-400 font-bold">{player.displayLost}</span>
                      </div>

                      {/* Tours Count */}
                      <div className="col-span-2 text-center text-[11px] font-bold text-slate-300">
                        {player.displayTours}
                      </div>

                      {/* Win% */}
                      <div className="col-span-1 text-center text-[11px] font-semibold text-slate-400">
                        {player.winRate}%
                      </div>

                      {/* Total Points (P) - Prominent bold blue/cyan styled number just like screenshot */}
                      <div className="col-span-2 text-right pr-1">
                        <span className="text-sm font-black text-cyan-400 tracking-tight">
                          {player.displayPoints}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View (Hidden on mobile, block on md+) */}
          <div className="hidden md:block overflow-x-auto">
          {processedPlayers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <span className="text-3xl">🎾</span>
              <p className="text-sm font-bold text-white">No players found</p>
              <p className="text-xs text-slate-500">
                {searchQuery
                  ? `No matching players for "${searchQuery}"`
                  : "No tournaments recorded in this season yet."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("tours")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "tours" ? "text-cyan-400 font-black" : ""
                      }`}
                    >
                      <span>Tours</span>
                      {sortField === "tours" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-cyan-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("points")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "points" ? "text-emerald-400 font-black" : ""
                      }`}
                    >
                      <span>Points</span>
                      {sortField === "points" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("won")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "won" ? "text-emerald-400 font-black" : ""
                      }`}
                    >
                      <span>Record (W-L)</span>
                      {sortField === "won" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("winRate")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "winRate" ? "text-emerald-400 font-black" : ""
                      }`}
                    >
                      <span>Win Rate</span>
                      {sortField === "winRate" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("championships")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "championships" ? "text-amber-400 font-black" : ""
                      }`}
                    >
                      <span>🏆 Titles</span>
                      {sortField === "championships" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-amber-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-amber-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("top4")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "top4" ? "text-cyan-400 font-black" : ""
                      }`}
                    >
                      <span>🎖️ Top 4</span>
                      {sortField === "top4" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-cyan-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSort("avg")}
                      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors uppercase font-bold text-[11px] ${
                        sortField === "avg" ? "text-teal-400 font-black" : ""
                      }`}
                    >
                      <span>Avg Pts</span>
                      {sortField === "avg" ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-teal-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-teal-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {processedPlayers.map((player, idx) => {
                  return (
                    <tr
                      key={player.name}
                      onClick={() => setSelectedPlayer(player)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        idx === 0
                          ? "bg-amber-500/5 font-semibold"
                          : idx === 1
                          ? "bg-slate-300/5 font-semibold"
                          : idx === 2
                          ? "bg-amber-700/5 font-semibold"
                          : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {idx === 0 && <span className="text-base">🥇</span>}
                          {idx === 1 && <span className="text-base">🥈</span>}
                          {idx === 2 && <span className="text-base">🥉</span>}
                          <span
                            className={`font-black ${
                              idx < 3 ? "text-amber-400" : "text-slate-400"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Player Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs shrink-0 shadow-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/player/${encodeURIComponent(player.name)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>{player.name}</span>
                              {player.displayChampionships > 0 && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  🏆 {player.displayChampionships}
                                </span>
                              )}
                            </Link>
                            <div className="text-[11px] text-slate-500">
                              {player.styleBreakdown.arabiano} Arabiano • {player.styleBreakdown.mexicano} Mexicano
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tours */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-slate-200">
                          {player.displayTours}
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 font-black text-sm border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                          {player.displayPoints}
                        </span>
                      </td>

                      {/* Match Record W-L */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-400 font-bold">
                          {player.displayWon}W
                        </span>
                        <span className="text-slate-500 mx-1">-</span>
                        <span className="text-rose-400 font-bold">
                          {player.displayLost}L
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`font-bold text-xs ${
                              player.winRate >= 65
                                ? "text-emerald-400"
                                : player.winRate >= 45
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                          >
                            {player.winRate}%
                          </span>
                          <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              style={{ width: `${player.winRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Championships */}
                      <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                        {player.displayChampionships > 0 ? `🏆 ${player.displayChampionships}` : "–"}
                      </td>

                      {/* Top 4 */}
                      <td className="py-3.5 px-4 text-center font-bold text-cyan-300">
                        {player.displayTop4 > 0 ? player.displayTop4 : "–"}
                      </td>

                      {/* Avg Points */}
                      <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                        {player.avgPoints}
                      </td>

                      {/* Action Link */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/player/${encodeURIComponent(player.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-white font-bold inline-flex items-center gap-1 transition-all"
                        >
                          Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Player Profile Modal (when clicking table row) */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xl shadow-lg shadow-emerald-500/20">
                  {selectedPlayer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {selectedPlayer.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedPlayer.toursPlayed} Tours • {selectedPlayer.totalPoints} Career Points
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Points</span>
                <span className="text-lg font-black text-emerald-400">{selectedPlayer.totalPoints}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Titles</span>
                <span className="text-lg font-black text-amber-400">🏆 {selectedPlayer.championships}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Win Rate</span>
                <span className="text-lg font-black text-cyan-400">
                  {selectedPlayer.matchesPlayed > 0 ? Math.round((selectedPlayer.matchesWon / selectedPlayer.matchesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Tour History List */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-slate-400 block">
                Tour History Log ({selectedPlayer.tourHistory?.length || 0})
              </span>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {(selectedPlayer.tourHistory || []).map((tour, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{tour.tourName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                          {tour.style}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(tour.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-amber-400 text-sm">
                        Rank #{tour.rank}
                      </div>
                      <div className="text-emerald-400 font-extrabold">
                        +{tour.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <Link
                href={`/player/${encodeURIComponent(selectedPlayer.name)}`}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Open Full Sharable Profile Page →
              </Link>
              <Button
                onClick={() => setSelectedPlayer(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
