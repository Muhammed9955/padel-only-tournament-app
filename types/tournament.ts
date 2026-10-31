export type TournamentStyle = "arabiano" | "mexicano";

export interface Player {
  id: number;
  name: string;
  points: number;
}

export interface Team {
  id: number;
  players: [Player, Player];
}

export interface Game {
  id: number;
  court: number;
  team1: Team;
  team2: Team;
  score: [number, number] | null;
}

export interface Round {
  id: number;
  games: Game[];
}

export interface TournamentState {
  id: string;
  name: string;
  style: TournamentStyle;
  players: Player[];
  rounds: Round[];
  currentRoundId: number;
  courtCount: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TourFinishRecord {
  tourId: string;
  tourName: string;
  style: TournamentStyle;
  date: string;
  rank: number;
  totalPlayers: number;
  points: number;
  matchesWon: number;
  matchesLost: number;
  matchesPlayed: number;
}

export interface PlayerCareerStats {
  name: string;
  toursPlayed: number;
  styleBreakdown: {
    arabiano: number;
    mexicano: number;
  };
  totalPoints: number;
  pointsBreakdown: {
    arabiano: number;
    mexicano: number;
  };
  matchesWon: number;
  matchesLost: number;
  matchesPlayed: number;
  championships: number; // 1st place finishes
  top4Finishes: number;  // 1st, 2nd, 3rd, or 4th place
  tourHistory: TourFinishRecord[];
}
