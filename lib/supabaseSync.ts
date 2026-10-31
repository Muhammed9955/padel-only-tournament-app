import { supabase, isSupabaseConfigured } from "./supabase";
import {
  TournamentState,
  TournamentStyle,
  PlayerCareerStats,
} from "@/types/tournament";

export interface SyncStatus {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Upsert an active or completed tournament to Supabase
 */
export async function syncTournamentToCloud(
  tour: TournamentState
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("tournaments").upsert(
      {
        id: tour.id,
        name: tour.name,
        style: tour.style,
        court_count: tour.courtCount,
        current_round_id: tour.currentRoundId,
        is_completed: tour.isCompleted,
        players: tour.players,
        rounds: tour.rounds,
        completed_at: tour.completedAt || null,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase tournament upsert error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("Supabase network error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Sync entire career leaderboard to Supabase
 */
export async function syncCareerLeaderboardToCloud(
  leaderboard: PlayerCareerStats[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || leaderboard.length === 0) {
    return { success: false, error: "No records to sync" };
  }

  try {
    const rows = leaderboard.map((p) => ({
      name: p.name.trim(),
      normalized_name: p.name.trim().toLowerCase(),
      tours_played: p.toursPlayed,
      arabiano_tours: p.styleBreakdown.arabiano || 0,
      mexicano_tours: p.styleBreakdown.mexicano || 0,
      total_points: p.totalPoints,
      arabiano_points: p.pointsBreakdown.arabiano || 0,
      mexicano_points: p.pointsBreakdown.mexicano || 0,
      matches_won: p.matchesWon,
      matches_lost: p.matchesLost,
      matches_played: p.matchesPlayed,
      championships: p.championships,
      top4_finishes: p.top4Finishes,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("player_career_stats")
      .upsert(rows, { onConflict: "normalized_name" });

    if (error) {
      console.warn("Supabase leaderboard upsert error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("Supabase network error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Record individual tournament finishes to Supabase
 */
export async function recordTourFinishesToCloud(
  finishes: {
    tourId: string;
    style: TournamentStyle;
    playerName: string;
    rank: number;
    totalPlayers: number;
    points: number;
    matchesWon: number;
    matchesLost: number;
    matchesPlayed: number;
    completedAt: string;
  }[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || finishes.length === 0) {
    return { success: false };
  }

  try {
    const rows = finishes.map((f) => ({
      tour_id: f.tourId,
      player_name: f.playerName,
      style: f.style,
      rank: f.rank,
      total_players: f.totalPlayers,
      points: f.points,
      matches_won: f.matchesWon,
      matches_lost: f.matchesLost,
      matches_played: f.matchesPlayed,
      completed_at: f.completedAt,
    }));

    const { error } = await supabase.from("tour_finishes").insert(rows);
    if (error) {
      console.warn("Supabase tour_finishes error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("Supabase network error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Sequential atomic-like sync ensuring tournaments table row exists before tour_finishes are inserted
 */
export async function syncCompletedTourWithAllStats(
  completedTour: TournamentState,
  updatedLeaderboard: PlayerCareerStats[],
  finishRecords: {
    tourId: string;
    style: TournamentStyle;
    playerName: string;
    rank: number;
    totalPlayers: number;
    points: number;
    matchesWon: number;
    matchesLost: number;
    matchesPlayed: number;
    completedAt: string;
  }[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // 1. FIRST upsert tournament to satisfy foreign key in tour_finishes
    const tourResult = await syncTournamentToCloud(completedTour);
    if (!tourResult.success) {
      console.warn("Tournaments table sync error:", tourResult.error);
    }

    // 2. Clear any existing finishes for this tour to avoid duplicate entries on re-save
    await supabase.from("tour_finishes").delete().eq("tour_id", completedTour.id);

    // 3. Insert finishes
    if (finishRecords.length > 0) {
      const finishResult = await recordTourFinishesToCloud(finishRecords);
      if (!finishResult.success) {
        console.warn("Tour finishes sync notice:", finishResult.error);
      }
    }

    // 4. Upsert career leaderboard stats
    if (updatedLeaderboard.length > 0) {
      const lbResult = await syncCareerLeaderboardToCloud(updatedLeaderboard);
      if (!lbResult.success) {
        console.warn("Leaderboard sync notice:", lbResult.error);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    console.warn("Completed tour sync error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Fetch career leaderboard from cloud
 */
export async function fetchCloudLeaderboard(): Promise<PlayerCareerStats[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("player_career_stats")
      .select("*")
      .order("total_points", { ascending: false });

    if (error || !data) return null;

    // Fetch individual tour finishes to populate player history details
    const { data: finishes } = await supabase
      .from("tour_finishes")
      .select("*")
      .order("completed_at", { ascending: false });

    return data.map((row) => {
      const playerFinishes = (finishes || [])
        .filter((f) => f.player_name.trim().toLowerCase() === row.normalized_name)
        .map((f) => ({
          tourId: f.tour_id,
          tourName:
            f.tour_id.includes("10-10")
              ? "Arabiano Tour - Saturday, 10 Oct 2026"
              : f.tour_id.includes("10-17")
              ? "Arabiano Tour - Saturday, 17 Oct 2026"
              : f.tour_id.includes("10-24")
              ? "Arabiano Tour - Saturday, 24 Oct 2026"
              : f.style === "mexicano"
              ? "Mexicano Open Tour"
              : "Arabiano Tour",
          style: f.style,
          date: f.completed_at,
          rank: f.rank,
          totalPlayers: f.total_players,
          points: f.points,
          matchesWon: f.matches_won,
          matchesLost: f.matches_lost,
          matchesPlayed: f.matches_played,
        }));

      return {
        name: row.name,
        toursPlayed: row.tours_played,
        styleBreakdown: {
          arabiano: row.arabiano_tours || 0,
          mexicano: row.mexicano_tours || 0,
        },
        totalPoints: row.total_points,
        pointsBreakdown: {
          arabiano: row.arabiano_points || 0,
          mexicano: row.mexicano_points || 0,
        },
        matchesWon: row.matches_won,
        matchesLost: row.matches_lost,
        matchesPlayed: row.matches_played,
        championships: row.championships,
        top4Finishes: row.top4_finishes,
        tourHistory: playerFinishes,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Fetch completed tournament history from cloud
 */
export async function fetchCloudTournamentHistory(): Promise<TournamentState[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("is_completed", true)
      .order("completed_at", { ascending: false });

    if (error || !data) return null;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      style: row.style,
      courtCount: row.court_count,
      currentRoundId: row.current_round_id,
      isCompleted: row.is_completed,
      players: row.players,
      rounds: row.rounds,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  } catch {
    return null;
  }
}
