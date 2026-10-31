import {
  TournamentState,
  TournamentStyle,
  PlayerCareerStats,
  TourFinishRecord,
} from "@/types/tournament";
import { calculatePlayerPoints } from "./pairing";
import {
  syncTournamentToCloud,
  syncCareerLeaderboardToCloud,
  syncCompletedTourWithAllStats,
} from "./supabaseSync";

const ACTIVE_TOURNAMENTS_KEY = "arabiano_active_tournaments_v2";
const CAREER_LEADERBOARD_KEY = "arabiano_career_leaderboard_v2";
const TOURNAMENT_HISTORY_KEY = "arabiano_tournament_history_v2";

// Backwards compatibility migration from arabiano_ui_v1
export function migrateOldStorageIfPresent() {
  if (typeof window === "undefined") return;
  try {
    const oldRaw = localStorage.getItem("arabiano_ui_v1");
    const newRaw = localStorage.getItem(ACTIVE_TOURNAMENTS_KEY);
    if (oldRaw && !newRaw) {
      const parsed = JSON.parse(oldRaw);
      if (parsed && parsed.players && parsed.players.length > 0) {
        const migrated: Record<TournamentStyle, TournamentState | null> = {
          arabiano: {
            id: "tour-" + Date.now(),
            name: parsed.tournamentName || "Arabiano Tour",
            style: "arabiano",
            players: parsed.players || [],
            rounds: parsed.rounds || [],
            currentRoundId: parsed.currentRoundId || 1,
            courtCount: parsed.courtCount || 4,
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          mexicano: null,
        };
        localStorage.setItem(ACTIVE_TOURNAMENTS_KEY, JSON.stringify(migrated));
      }
    }
  } catch (err) {
    console.warn("Migration warning:", err);
  }
}

export function getActiveTournaments(): Record<TournamentStyle, TournamentState | null> {
  if (typeof window === "undefined") {
    return { arabiano: null, mexicano: null };
  }
  try {
    const raw = localStorage.getItem(ACTIVE_TOURNAMENTS_KEY);
    if (!raw) return { arabiano: null, mexicano: null };
    return JSON.parse(raw);
  } catch {
    return { arabiano: null, mexicano: null };
  }
}

export function saveActiveTournament(tour: TournamentState) {
  if (typeof window === "undefined") return;
  try {
    const current = getActiveTournaments();
    current[tour.style] = tour;
    localStorage.setItem(ACTIVE_TOURNAMENTS_KEY, JSON.stringify(current));
    // Asynchronous background cloud sync to Supabase
    syncTournamentToCloud(tour).catch((err) =>
      console.warn("Cloud auto-sync background notice:", err)
    );
  } catch (err) {
    console.error("Failed to save active tournament:", err);
  }
}

export function clearActiveTournament(style: TournamentStyle) {
  if (typeof window === "undefined") return;
  try {
    const current = getActiveTournaments();
    current[style] = null;
    localStorage.setItem(ACTIVE_TOURNAMENTS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("Failed to clear active tournament:", err);
  }
}

export function getCareerLeaderboard(): PlayerCareerStats[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CAREER_LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCareerLeaderboard(leaderboard: PlayerCareerStats[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAREER_LEADERBOARD_KEY, JSON.stringify(leaderboard));
    // Asynchronous background sync to Supabase
    syncCareerLeaderboardToCloud(leaderboard).catch((err) =>
      console.warn("Cloud leaderboard sync notice:", err)
    );
  } catch (err) {
    console.error("Failed to save career leaderboard:", err);
  }
}

export function getTournamentHistory(): TournamentState[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOURNAMENT_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTournamentHistory(history: TournamentState[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOURNAMENT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save tournament history:", err);
  }
}

/**
 * Complete tournament and commit stats to the persistent global career leaderboard!
 */
export function completeAndRecordTournament(tour: TournamentState): {
  updatedLeaderboard: PlayerCareerStats[];
  completedTour: TournamentState;
} {
  const statsMap = calculatePlayerPoints(tour.players, tour.rounds);

  // Compute final rank within this tournament
  const rankedPlayers = [...tour.players].sort((a, b) => {
    const pA = statsMap.get(a.id)?.points ?? 0;
    const pB = statsMap.get(b.id)?.points ?? 0;
    if (pB !== pA) return pB - pA;
    const wA = statsMap.get(a.id)?.matchesWon ?? 0;
    const wB = statsMap.get(b.id)?.matchesWon ?? 0;
    return wB - wA;
  });

  const completionDate = new Date().toISOString();
  const completedTour: TournamentState = {
    ...tour,
    isCompleted: true,
    completedAt: completionDate,
  };

  // Update history
  const history = getTournamentHistory();
  saveTournamentHistory([completedTour, ...history]);

  // Update career leaderboard
  const careerLeaderboard = getCareerLeaderboard();
  const playerMap = new Map<string, PlayerCareerStats>();

  careerLeaderboard.forEach((p) => {
    playerMap.set(p.name.trim().toLowerCase(), p);
  });

  rankedPlayers.forEach((player, index) => {
    const normName = player.name.trim().toLowerCase();
    const rank = index + 1;
    const pStats = statsMap.get(player.id) || {
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesPlayed: 0,
    };

    const record: TourFinishRecord = {
      tourId: tour.id,
      tourName: tour.name,
      style: tour.style,
      date: completionDate,
      rank,
      totalPlayers: tour.players.length,
      points: pStats.points,
      matchesWon: pStats.matchesWon,
      matchesLost: pStats.matchesLost,
      matchesPlayed: pStats.matchesPlayed,
    };

    const existing = playerMap.get(normName);
    if (existing) {
      existing.toursPlayed += 1;
      existing.styleBreakdown[tour.style] =
        (existing.styleBreakdown[tour.style] || 0) + 1;
      existing.totalPoints += pStats.points;
      existing.pointsBreakdown[tour.style] =
        (existing.pointsBreakdown[tour.style] || 0) + pStats.points;
      existing.matchesWon += pStats.matchesWon;
      existing.matchesLost += pStats.matchesLost;
      existing.matchesPlayed += pStats.matchesPlayed;
      if (rank === 1) existing.championships += 1;
      if (rank <= 4) existing.top4Finishes += 1;
      existing.tourHistory = [record, ...existing.tourHistory];
    } else {
      const newPlayerStat: PlayerCareerStats = {
        name: player.name.trim(),
        toursPlayed: 1,
        styleBreakdown: {
          arabiano: tour.style === "arabiano" ? 1 : 0,
          mexicano: tour.style === "mexicano" ? 1 : 0,
        },
        totalPoints: pStats.points,
        pointsBreakdown: {
          arabiano: tour.style === "arabiano" ? pStats.points : 0,
          mexicano: tour.style === "mexicano" ? pStats.points : 0,
        },
        matchesWon: pStats.matchesWon,
        matchesLost: pStats.matchesLost,
        matchesPlayed: pStats.matchesPlayed,
        championships: rank === 1 ? 1 : 0,
        top4Finishes: rank <= 4 ? 1 : 0,
        tourHistory: [record],
      };
      playerMap.set(normName, newPlayerStat);
    }
  });

  const updatedLeaderboard = Array.from(playerMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints || b.matchesWon - a.matchesWon
  );

  saveCareerLeaderboard(updatedLeaderboard);

  // Auto-save all players from this tournament into registered player roster
  try {
    const rawRoster = localStorage.getItem("arabiano_registered_players_v2");
    const existingList: string[] = rawRoster ? JSON.parse(rawRoster) : [];
    const rosterSet = new Set(existingList.map((n) => n.trim().toLowerCase()));
    const toAdd: string[] = [];
    tour.players.forEach((p) => {
      const clean = p.name.trim();
      if (clean && !rosterSet.has(clean.toLowerCase())) {
        rosterSet.add(clean.toLowerCase());
        toAdd.push(clean);
      }
    });
    if (toAdd.length > 0) {
      const combined = [...existingList, ...toAdd].sort((a, b) => a.localeCompare(b));
      localStorage.setItem("arabiano_registered_players_v2", JSON.stringify(combined));
    }
  } catch (err) {
    console.warn("Roster auto-save warning:", err);
  }

  // Clear current active tournament of this style since it's completed
  clearActiveTournament(tour.style);

  const finishRecords = rankedPlayers.map((player, index) => {
    const pStats = statsMap.get(player.id) || {
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesPlayed: 0,
    };
    return {
      tourId: tour.id,
      style: tour.style,
      playerName: player.name.trim(),
      rank: index + 1,
      totalPlayers: tour.players.length,
      points: pStats.points,
      matchesWon: pStats.matchesWon,
      matchesLost: pStats.matchesLost,
      matchesPlayed: pStats.matchesPlayed,
      completedAt: completionDate,
    };
  });

  // Guarantee sequential sync to Supabase: tournaments -> tour_finishes -> player_career_stats
  syncCompletedTourWithAllStats(completedTour, updatedLeaderboard, finishRecords).catch((err) => {
    console.warn("Supabase completion sync notice:", err);
  });

  return { updatedLeaderboard, completedTour };
}

export function clearCareerLeaderboard() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CAREER_LEADERBOARD_KEY);
  localStorage.removeItem(TOURNAMENT_HISTORY_KEY);
}
