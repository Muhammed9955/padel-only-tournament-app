"use client";

import React, { useState } from "react";
import { TournamentState } from "@/types/tournament";
import { calculatePlayerPoints } from "@/lib/pairing";
import { Card } from "@/components/ui/card";
import {
  History,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TourHistoryViewProps {
  history: TournamentState[];
  onClearHistory?: () => void;
}

export const TourHistoryView: React.FC<TourHistoryViewProps> = ({
  history,
}) => {
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTourId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/20 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              📜 Archives
            </span>
            <span className="text-xs text-slate-400">
              {history.length} Tournament{history.length === 1 ? "" : "s"} Completed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Tour History & Archives
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past tournaments, champions, and detailed match scores.
          </p>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            No Finished Tournaments Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            When you complete an Arabiano Tour or Mexicano Style tournament, it
            will be archived here with full match records and standings.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((tour) => {
            const isExpanded = expandedTourId === tour.id;
            const statsMap = calculatePlayerPoints(tour.players, tour.rounds);
            const ranked = [...tour.players].sort((a, b) => {
              const pA = statsMap.get(a.id)?.points ?? 0;
              const pB = statsMap.get(b.id)?.points ?? 0;
              if (pB !== pA) return pB - pA;
              return (statsMap.get(b.id)?.matchesWon ?? 0) - (statsMap.get(a.id)?.matchesWon ?? 0);
            });

            const winner = ranked[0];
            const isMexicano = tour.style === "mexicano";

            return (
              <Card
                key={tour.id}
                className="bg-slate-900/90 border border-slate-800 shadow-xl rounded-2xl overflow-hidden hover:border-slate-700 transition-all"
              >
                <div
                  onClick={() => toggleExpand(tour.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isMexicano
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isMexicano ? "🇲🇽 Mexicano Style" : "🎾 Arabiano Tour"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {tour.completedAt
                          ? new Date(tour.completedAt).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Completed"}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white">
                      {tour.name}
                    </h3>

                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{tour.players.length} Players</span>
                      <span>•</span>
                      <span>{tour.rounds.length} Rounds</span>
                      <span>•</span>
                      <span>{tour.courtCount} Courts</span>
                    </div>
                  </div>

                  {/* Winner Pill */}
                  <div className="flex items-center gap-4">
                    {winner && (
                      <div className="p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                          Champion 🏆
                        </span>
                        <div className="text-sm font-black text-white">
                          {winner.name}
                        </div>
                        <div className="text-xs text-emerald-400 font-bold">
                          {statsMap.get(winner.id)?.points ?? 0} pts
                        </div>
                      </div>
                    )}

                    <div className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/60 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Final Tournament Standings
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                            <th className="py-2 px-3">Rank</th>
                            <th className="py-2 px-3">Player</th>
                            <th className="py-2 px-3 text-center">Points</th>
                            <th className="py-2 px-3 text-center">Matches</th>
                            <th className="py-2 px-3 text-center">W - L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {ranked.map((p, idx) => {
                            const pStat = statsMap.get(p.id) || {
                              points: 0,
                              matchesWon: 0,
                              matchesLost: 0,
                              matchesPlayed: 0,
                            };
                            return (
                              <tr key={p.id} className="hover:bg-slate-800/30">
                                <td className="py-2 px-3 font-bold text-amber-400">
                                  #{idx + 1}
                                </td>
                                <td className="py-2 px-3 font-bold text-white">
                                  {p.name}
                                </td>
                                <td className="py-2 px-3 text-center font-black text-emerald-400">
                                  {pStat.points}
                                </td>
                                <td className="py-2 px-3 text-center text-slate-300">
                                  {pStat.matchesPlayed}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="text-emerald-400 font-semibold">
                                    {pStat.matchesWon}
                                  </span>{" "}
                                  -{" "}
                                  <span className="text-rose-400 font-semibold">
                                    {pStat.matchesLost}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
