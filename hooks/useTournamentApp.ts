"use client";

import { useEffect, useState } from "react";
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

export function useTournamentApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("arabiano");
  const [activeTournaments, setActiveTournaments] = useState<{
    arabiano: TournamentState | null;
    mexicano: TournamentState | null;
  }>({ arabiano: null, mexicano: null });
  const [careerLeaderboard, setCareerLeaderboard] = useState<PlayerCareerStats[]>(
    []
  );
  const [tourHistory, setTourHistory] = useState<TournamentState[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    migrateOldStorageIfPresent();
    const tours = getActiveTournaments();
    const leaderboard = getCareerLeaderboard();
    const history = getTournamentHistory();

    setActiveTournaments(tours);
    setCareerLeaderboard(leaderboard);
    setTourHistory(history);

    if (tours.mexicano && !tours.arabiano) {
      setActiveTab("mexicano");
    } else if (tours.arabiano) {
      setActiveTab("arabiano");
    }

    // Hydrate from cloud if available
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

    setIsLoaded(true);
  }, []);

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
        tourHistory: [
          {
            tourId: "sample-3",
            tourName: "Mexicano Open #1",
            style: "mexicano",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            rank: 1,
            totalPlayers: 8,
            points: 12,
            matchesWon: 5,
            matchesLost: 1,
            matchesPlayed: 6,
          },
          {
            tourId: "sample-2",
            tourName: "Arabiano Tour Autumn",
            style: "arabiano",
            date: new Date(Date.now() - 86400000 * 7).toISOString(),
            rank: 2,
            totalPlayers: 12,
            points: 11,
            matchesWon: 5,
            matchesLost: 2,
            matchesPlayed: 7,
          },
          {
            tourId: "sample-1",
            tourName: "Arabiano Tour Season Opener",
            style: "arabiano",
            date: new Date(Date.now() - 86400000 * 14).toISOString(),
            rank: 3,
            totalPlayers: 8,
            points: 11,
            matchesWon: 5,
            matchesLost: 2,
            matchesPlayed: 7,
          },
        ],
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
        tourHistory: [
          {
            tourId: "sample-3",
            tourName: "Mexicano Open #1",
            style: "mexicano",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            rank: 2,
            totalPlayers: 8,
            points: 11,
            matchesWon: 4,
            matchesLost: 2,
            matchesPlayed: 6,
          },
          {
            tourId: "sample-1",
            tourName: "Arabiano Tour Season Opener",
            style: "arabiano",
            date: new Date(Date.now() - 86400000 * 14).toISOString(),
            rank: 1,
            totalPlayers: 8,
            points: 13,
            matchesWon: 6,
            matchesLost: 1,
            matchesPlayed: 7,
          },
        ],
      },
      {
        name: "Omar Nour",
        toursPlayed: 2,
        styleBreakdown: { arabiano: 1, mexicano: 1 },
        totalPoints: 24,
        pointsBreakdown: { arabiano: 14, mexicano: 10 },
        matchesWon: 11,
        matchesLost: 5,
        matchesPlayed: 16,
        championships: 0,
        top4Finishes: 2,
        tourHistory: [],
      },
      {
        name: "Youssef Ali",
        toursPlayed: 2,
        styleBreakdown: { arabiano: 2, mexicano: 0 },
        totalPoints: 19,
        pointsBreakdown: { arabiano: 19, mexicano: 0 },
        matchesWon: 8,
        matchesLost: 6,
        matchesPlayed: 14,
        championships: 0,
        top4Finishes: 1,
        tourHistory: [],
      },
    ];

    saveCareerLeaderboard(samplePlayers);
    setCareerLeaderboard(samplePlayers);
  };

  const syncToCloud = async () => {
    if (!isSupabaseConfigured) return { success: false, message: "Supabase not configured" };
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

  return {
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
  };
}
