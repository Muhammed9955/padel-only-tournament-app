"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerCareerStats } from "@/types/tournament";
import { fetchCloudLeaderboard } from "@/lib/supabaseSync";
import { getCareerLeaderboard } from "@/lib/storage";
import { Header } from "@/components/Header";
import {
  Trophy,
  ArrowLeft,
  Share2,
  Copy,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawName = params?.name as string;
  const decodedName = rawName ? decodeURIComponent(rawName) : "";

  const [player, setPlayer] = useState<PlayerCareerStats | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerCareerStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // 1. Try fetching from cloud
      const cloudData = await fetchCloudLeaderboard();
      const list = cloudData && cloudData.length > 0 ? cloudData : getCareerLeaderboard();
      setAllPlayers(list);

      const target = list.find(
        (p) => p.name.trim().toLowerCase() === decodedName.trim().toLowerCase()
      );
      setPlayer(target || null);
      setIsLoading(false);
    }

    if (decodedName) {
      loadData();
    }
  }, [decodedName]);

  // Overall player rank in career leaderboard
  const rank = player
    ? allPlayers.findIndex(
        (p) => p.name.trim().toLowerCase() === player.name.trim().toLowerCase()
      ) + 1
    : 0;

  const winRate =
    player && player.matchesPlayed > 0
      ? Math.round((player.matchesWon / player.matchesPlayed) * 100)
      : 0;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!player) return;
    const url = typeof window !== "undefined" ? `${window.location.href}?v=1` : "";
    const text = `🎾 PadelOnly Tour Player Profile: ${player.name}\n🏆 Career Rank #${rank} • ${player.totalPoints} Total Points\n🥇 ${player.championships} Championship(s) • ${player.toursPlayed} Tour(s) Played\n\nView profile & match history: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header
        activeTab="leaderboard"
        onTabChange={(tab) => router.push(tab === "arabiano" ? "/" : `/${tab}`)}
      />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 max-w-3xl">
        {/* Compact Back Link & Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-[11px] h-8 px-2.5 font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-8 px-2.5 shadow-md shadow-emerald-600/20"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading player profile...</p>
          </div>
        ) : !player ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-3xl">🔍</span>
            <h2 className="text-base font-bold text-white">Player Not Found</h2>
            <p className="text-xs text-slate-400">
              No tournament records found for &quot;{decodedName}&quot;.
            </p>
            <Link
              href="/leaderboard"
              className="inline-block px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Browse Leaderboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Organized Compact Player Hero Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3.5">
                {/* Compact Player Avatar */}
                <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30 shrink-0">
                  {player.name.charAt(0).toUpperCase()}
                  {rank <= 3 && (
                    <span className="absolute -top-1.5 -right-1.5 text-sm sm:text-base">
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Rank #{rank} Overall
                    </span>
                    {player.championships > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {player.championships} {player.championships === 1 ? "Title" : "Titles"}
                      </span>
                    )}
                    {player.top4Finishes > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {player.top4Finishes} Top 4
                      </span>
                    )}
                  </div>

                  {/* Player Name */}
                  <h1 className="text-base sm:text-xl font-black text-white mt-1 truncate">
                    {player.name}
                  </h1>

                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                    <span>{player.toursPlayed} {player.toursPlayed === 1 ? "Tour" : "Tours"} Played</span>
                    <span>•</span>
                    <span>~{(player.totalPoints / (player.toursPlayed || 1)).toFixed(1)} avg pts</span>
                  </p>
                </div>
              </div>

              {/* 4-Item Compact High-Density Stats Pill Row */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Points</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 block">{player.totalPoints}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Win Rate</span>
                  <span className="text-sm sm:text-base font-black text-cyan-400 mt-0.5 block">{winRate}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Record</span>
                  <span className="text-xs sm:text-sm font-black text-white mt-0.5 block">
                    <span className="text-emerald-400">{player.matchesWon}W</span>
                    <span className="text-slate-500 mx-0.5">-</span>
                    <span className="text-rose-400">{player.matchesLost}L</span>
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Avg Pts</span>
                  <span className="text-sm sm:text-base font-black text-amber-300 mt-0.5 block">
                    {(player.totalPoints / (player.toursPlayed || 1)).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Format Style Breakdown (Arabiano vs Mexicano) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">🎾 Arabiano Tour</span>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    {player.styleBreakdown?.arabiano || 0} tours
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">
                    {player.pointsBreakdown?.arabiano || 0} pts
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">🇲🇽 Mexicano Style</span>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    {player.styleBreakdown?.mexicano || 0} tours
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">
                    {player.pointsBreakdown?.mexicano || 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Tournament Finishes Timeline */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tournament Match History</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                  {player.tourHistory.length} Tours
                </span>
              </div>

              {player.tourHistory.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  No match breakdown recorded yet for this player.
                </div>
              ) : (
                <div className="space-y-2">
                  {player.tourHistory.map((tour, idx) => (
                    <div
                      key={tour.tourId || idx}
                      className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-2.5 text-xs"
                    >
                      {/* Left: Rank Badge + Tour Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-[11px] border shrink-0 ${
                            tour.rank === 1
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : tour.rank <= 4
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          #{tour.rank}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                            <span className="truncate">{tour.tourName}</span>
                            {tour.rank === 1 && <span className="text-xs shrink-0">🏆</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>
                              {new Date(tour.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{tour.style}</span>
                            <span>•</span>
                            <span className="text-slate-300">
                              {tour.matchesWon}W - {tour.matchesLost}L
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Points Pill Badge */}
                      <div className="shrink-0 text-right">
                        <span className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-black text-xs sm:text-sm">
                          +{tour.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
