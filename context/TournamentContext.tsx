"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { NavTab } from "@/components/Header";
import {
  TournamentState,
  TournamentStyle,
  PlayerCareerStats,
} from "@/types/tournament";
import {
  getActiveTournaments,
  saveActiveTournament,
  clearActiveTournament,
  getCareerLeaderboard,
  saveCareerLeaderboard,
  getTournamentHistory,
  saveTournamentHistory,
  completeAndRecordTournament,
  clearCareerLeaderboard,
  migrateOldStorageIfPresent,
} from "@/lib/storage";
import {
  fetchCloudLeaderboard,
  fetchCloudTournamentHistory,
  syncCareerLeaderboardToCloud,
  syncTournamentToCloud,
} from "@/lib/supabaseSync";
import { isSupabaseConfigured } from "@/lib/supabase";

interface TournamentContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeTournaments: {
    arabiano: TournamentState | null;
    mexicano: TournamentState | null;
  };
  careerLeaderboard: PlayerCareerStats[];
  tourHistory: TournamentState[];
  isLoaded: boolean;
  isCloudConfigured: boolean;
  saveTournament: (tour: TournamentState) => void;
  clearTournament: (style: TournamentStyle) => void;
  completeTournament: (tour: TournamentState) => void;
  resetLeaderboard: () => void;
  clearHistory: () => void;
  seedSampleStats: () => void;
  syncToCloud: () => Promise<{ success: boolean; message: string }>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTabState] = useState<NavTab>("arabiano");
  const [activeTournaments, setActiveTournaments] = useState<{
    arabiano: TournamentState | null;
    mexicano: TournamentState | null;
  }>({ arabiano: null, mexicano: null });
  const [careerLeaderboard, setCareerLeaderboard] = useState<PlayerCareerStats[]>([]);
  const [tourHistory, setTourHistory] = useState<TournamentState[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Sync tab from pathname on initial load if directly navigated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "");
      if (path === "mexicano") setActiveTabState("mexicano");
      else if (path === "leaderboard") setActiveTabState("leaderboard");
      else if (path === "history") setActiveTabState("history");
      else if (path === "" || path === "arabiano") setActiveTabState("arabiano");

      // Handle browser back/forward buttons seamlessly
      const handlePopState = () => {
        const curPath = window.location.pathname.replace(/^\//, "");
        if (curPath === "mexicano") setActiveTabState("mexicano");
        else if (curPath === "leaderboard") setActiveTabState("leaderboard");
        else if (curPath === "history") setActiveTabState("history");
        else setActiveTabState("arabiano");
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  // Hydrate data once from local storage & cloud
  useEffect(() => {
    migrateOldStorageIfPresent();
    const tours = getActiveTournaments();
    const leaderboard = getCareerLeaderboard();
    const history = getTournamentHistory();

    setActiveTournaments(tours);
    setCareerLeaderboard(leaderboard);
    setTourHistory(history);
    setIsLoaded(true);

    // Asynchronously hydrate from cloud in background without blocking UI
    if (isSupabaseConfigured) {
      fetchCloudLeaderboard().then((cloudLb) => {
        if (cloudLb && cloudLb.length > 0) {
          setCareerLeaderboard(cloudLb);
          saveCareerLeaderboard(cloudLb);
        }
      });

      fetchCloudTournamentHistory().then((cloudHist) => {
        if (cloudHist && cloudHist.length > 0) {
          setTourHistory(cloudHist);
          saveTournamentHistory(cloudHist);
        }
      });
    }
  }, []);

  // Seamless tab changer that updates URL smoothly without full page reload
  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const targetUrl = tab === "arabiano" ? "/" : `/${tab}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, "", targetUrl);
      }
    }
  };

  const saveTournament = (tour: TournamentState) => {
    saveActiveTournament(tour);
    setActiveTournaments((prev) => ({
      ...prev,
      [tour.style]: tour,
    }));
  };

  const clearTournament = (style: TournamentStyle) => {
    clearActiveTournament(style);
    setActiveTournaments((prev) => ({
      ...prev,
      [style]: null,
    }));
  };

  const completeTournament = (tour: TournamentState) => {
    const { updatedLeaderboard, completedTour } = completeAndRecordTournament(tour);
    setActiveTournaments((prev) => ({
      ...prev,
      [tour.style]: null,
    }));
    setCareerLeaderboard(updatedLeaderboard);
    setTourHistory((prev) => [completedTour, ...prev]);
    setActiveTab("leaderboard");
  };

  const resetLeaderboard = () => {
    clearCareerLeaderboard();
    setCareerLeaderboard([]);
  };

  const clearHistory = () => {
    saveTournamentHistory([]);
    setTourHistory([]);
  };

  const seedSampleStats = () => {
    const samplePlayers: PlayerCareerStats[] = [
      {
        name: "Karim Hassan",
        toursPlayed: 3,
        styleBreakdown: { arabiano: 2, mexicano: 1 },
        totalPoints: 34,
        pointsBreakdown: { arabiano: 22, mexicano: 12 },
        matchesWon: 15,
        matchesLost: 5,
        matchesPlayed: 20,
        championships: 1,
        top4Finishes: 3,
        tourHistory: [],
      },
      {
        name: "Ahmed Zaki",
        toursPlayed: 3,
        styleBreakdown: { arabiano: 2, mexicano: 1 },
        totalPoints: 31,
        pointsBreakdown: { arabiano: 20, mexicano: 11 },
        matchesWon: 14,
        matchesLost: 6,
        matchesPlayed: 20,
        championships: 1,
        top4Finishes: 2,
        tourHistory: [],
      },
    ];
    saveCareerLeaderboard(samplePlayers);
    setCareerLeaderboard(samplePlayers);
  };

  const syncToCloud = async () => {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase not configured" };
    }
    try {
      if (careerLeaderboard.length > 0) {
        await syncCareerLeaderboardToCloud(careerLeaderboard);
      }
      if (activeTournaments.arabiano) {
        await syncTournamentToCloud(activeTournaments.arabiano);
      }
      if (activeTournaments.mexicano) {
        await syncTournamentToCloud(activeTournaments.mexicano);
      }
      return { success: true, message: "Synced successfully with Supabase!" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      return { success: false, message: msg };
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeTournaments,
        careerLeaderboard,
        tourHistory,
        isLoaded,
        isCloudConfigured: isSupabaseConfigured,
        saveTournament,
        clearTournament,
        completeTournament,
        resetLeaderboard,
        clearHistory,
        seedSampleStats,
        syncToCloud,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export function useTournamentContext() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error(
      "useTournamentContext must be used within a TournamentProvider"
    );
  }
  return context;
}
