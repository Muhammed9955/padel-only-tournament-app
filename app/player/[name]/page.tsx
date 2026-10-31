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
  Medal,
  Activity,
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
    const url = typeof window !== "undefined" ? window.location.href : "";
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

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 space-y-6 max-w-4xl">
        {/* Back Link & Quick Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Profile
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Share on WhatsApp
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading player profile...</p>
          </div>
        ) : !player ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <span className="text-4xl">🔍</span>
            <h2 className="text-xl font-bold text-white">Player Not Found</h2>
            <p className="text-sm text-slate-400">
              No tournament records found for &quot;{decodedName}&quot;.
            </p>
            <Link
              href="/leaderboard"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Browse Leaderboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player Hero Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white font-black text-2xl sm:text-3xl shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20">
                    {player.name.charAt(0).toUpperCase()}
                    {rank <= 3 && (
                      <span className="absolute -top-2 -right-2 text-xl">
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Rank #{rank} Overall
                      </span>
                      {player.championships > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {player.championships} {player.championships === 1 ? "Title" : "Titles"}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {player.name}
                    </h1>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Arabiano & Mexicano Player</span>
                      <span>•</span>
                      <span>{player.toursPlayed} {player.toursPlayed === 1 ? "Tournament" : "Tournaments"} Played</span>
                    </p>
                  </div>
                </div>

                {/* Big Total Points Stat */}
                <div className="sm:text-right bg-slate-950/70 p-4 rounded-2xl border border-slate-800 w-full sm:w-auto">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Total Career Points
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mt-0.5">
                    {player.totalPoints}
                  </div>
                  <span className="text-xs text-slate-400">
                    ~{(player.totalPoints / (player.toursPlayed || 1)).toFixed(1)} pts / tour
                  </span>
                </div>
              </div>

              {/* Stats Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block">Trophies</span>
                  <div className="text-xl font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    {player.championships} Champion
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block">Top 4 Finishes</span>
                  <div className="text-xl font-black text-cyan-400 mt-0.5 flex items-center gap-1.5">
                    <Medal className="w-4 h-4" />
                    {player.top4Finishes} Finishes
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block">Win Rate</span>
                  <div className="text-xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    {winRate}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block">Matches Record</span>
                  <div className="text-xl font-black text-white mt-0.5">
                    <span className="text-emerald-400">{player.matchesWon}W</span>
                    <span className="text-slate-500 mx-1">-</span>
                    <span className="text-rose-400">{player.matchesLost}L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament History Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Tournament Finishes in 2026
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {player.tourHistory.length} Recorded
                </span>
              </div>

              {player.tourHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  No match breakdown recorded yet for this player.
                </div>
              ) : (
                <div className="space-y-3">
                  {player.tourHistory.map((tour, idx) => (
                    <div
                      key={tour.tourId || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm border ${
                            tour.rank === 1
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : tour.rank <= 4
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          #{tour.rank}
                        </div>

                        <div>
                          <div className="text-base font-bold text-white flex items-center gap-2">
                            {tour.tourName}
                            {tour.rank === 1 && <span className="text-sm">🏆 Winner</span>}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{new Date(tour.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</span>
                            <span>•</span>
                            <span className="capitalize">{tour.style} format</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Matches
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {tour.matchesWon}W - {tour.matchesLost}L ({tour.matchesPlayed} games)
                          </span>
                        </div>

                        <div className="text-right pl-3 border-l border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Points
                          </span>
                          <span className="text-xl font-black text-emerald-400">
                            {tour.points}
                          </span>
                        </div>
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
