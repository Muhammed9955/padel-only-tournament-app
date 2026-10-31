"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header, NavTab } from "@/components/Header";
import { QuickHub } from "@/components/QuickHub";
import { TournamentView } from "@/components/TournamentView";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { TourHistoryView } from "@/components/TourHistoryView";
import { useTournamentContext } from "@/context/TournamentContext";

interface MainTournamentAppProps {
  initialTab?: NavTab;
}

export const MainTournamentApp: React.FC<MainTournamentAppProps> = ({
  initialTab,
}) => {
  const pathname = usePathname();
  const {
    activeTournaments,
    careerLeaderboard,
    tourHistory,
    isLoaded,
    saveTournament,
    clearTournament,
    completeTournament,
    resetLeaderboard,
    clearHistory,
    seedSampleStats,
    isCloudConfigured,
    syncToCloud,
  } = useTournamentContext();

  const activeTab: NavTab =
    initialTab ??
    (pathname === "/mexicano"
      ? "mexicano"
      : pathname === "/leaderboard"
      ? "leaderboard"
      : pathname === "/history"
      ? "history"
      : "arabiano");

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading Arabiano Tour...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header
        activeTab={activeTab}
        activeCounts={{
          arabiano: !!activeTournaments.arabiano,
          mexicano: !!activeTournaments.mexicano,
        }}
      />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 space-y-6">
        <QuickHub
          activeTab={activeTab}
          activeTournaments={activeTournaments}
          leaderboardCount={careerLeaderboard.length}
          historyCount={tourHistory.length}
        />

        {activeTab === "arabiano" && (
          <TournamentView
            style="arabiano"
            tournament={activeTournaments.arabiano}
            onSaveTournament={saveTournament}
            onClearTournament={() => clearTournament("arabiano")}
            onCompleteTournament={completeTournament}
          />
        )}

        {activeTab === "mexicano" && (
          <TournamentView
            style="mexicano"
            tournament={activeTournaments.mexicano}
            onSaveTournament={saveTournament}
            onClearTournament={() => clearTournament("mexicano")}
            onCompleteTournament={completeTournament}
          />
        )}

        {activeTab === "leaderboard" && (
          <GlobalLeaderboard
            leaderboard={careerLeaderboard}
            onResetLeaderboard={resetLeaderboard}
            onAddSampleStats={seedSampleStats}
            onSyncCloud={syncToCloud}
            isCloudConfigured={isCloudConfigured}
          />
        )}

        {activeTab === "history" && (
          <TourHistoryView
            history={tourHistory}
            onClearHistory={clearHistory}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Arabiano Tour • Americano & Mexicano Tournament Platform</span>
          <span>Automatic cloud sync with Supabase PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
};
