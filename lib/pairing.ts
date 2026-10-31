import { Player, Team, Game, Round } from "@/types/tournament";

export function getValidCourts(playersCount: number): number[] {
  const options: number[] = [];
  if (playersCount < 4 || playersCount > 24) return options;

  for (let courts = 1; courts <= Math.ceil(playersCount / 4); courts++) {
    const waiting = playersCount - courts * 4;
    if (waiting >= 0 && waiting <= courts * 2) {
      options.push(courts);
    }
  }
  return options;
}

export function calculateTournamentDuration(
  playersCount: number,
  courtCount: number,
  currentRound: number = 1,
  minutesPerRound: number = 15
): {
  totalRounds: number;
  roundsLeft: number;
  totalDurationMinutes: number;
  remainingDurationMinutes: number;
  formattedTotalDuration: string;
  formattedRemainingDuration: string;
  hasWaitingPlayers: boolean;
  waitingCount: number;
} {
  const playersPerCourt = 4;
  const activePerRound = courtCount * playersPerCourt;
  const waitingCount = Math.max(0, playersCount - activePerRound);
  const hasWaitingPlayers = waitingCount > 0;

  // For Americano: everyone plays with everyone else
  // Total pairs among N players = N * (N - 1) / 2
  // Pairs per round across courts = 2 * courtCount
  // Total rounds = ceil( (N * (N - 1)) / (4 * courtCount) )
  const totalRounds = Math.max(
    1,
    Math.ceil((playersCount * (playersCount - 1)) / (4 * courtCount))
  );

  const roundsLeft = Math.max(0, totalRounds - currentRound + 1);
  const totalDurationMinutes = totalRounds * minutesPerRound;
  const remainingDurationMinutes = roundsLeft * minutesPerRound;

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m}m`;
    if (m === 0) return `${hours}h`;
    return `${hours}h ${m}m`;
  };

  return {
    totalRounds,
    roundsLeft,
    totalDurationMinutes,
    remainingDurationMinutes,
    formattedTotalDuration: formatDuration(totalDurationMinutes),
    formattedRemainingDuration: formatDuration(remainingDurationMinutes),
    hasWaitingPlayers,
    waitingCount,
  };
}

export function calculatePlayerPoints(
  players: Player[],
  rounds: Round[]
): Map<number, { points: number; matchesWon: number; matchesLost: number; matchesPlayed: number }> {
  const stats = new Map<
    number,
    { points: number; matchesWon: number; matchesLost: number; matchesPlayed: number }
  >();

  for (const p of players) {
    stats.set(p.id, { points: 0, matchesWon: 0, matchesLost: 0, matchesPlayed: 0 });
  }

  for (const r of rounds) {
    for (const g of r.games) {
      if (!g.score) continue;
      const [s1, s2] = g.score;

      // Team 1 players
      for (const pl of g.team1.players) {
        const cur = stats.get(pl.id);
        if (cur) {
          cur.points += s1;
          cur.matchesPlayed += 1;
          if (s1 > s2) cur.matchesWon += 1;
          else if (s2 > s1) cur.matchesLost += 1;
        }
      }

      // Team 2 players
      for (const pl of g.team2.players) {
        const cur = stats.get(pl.id);
        if (cur) {
          cur.points += s2;
          cur.matchesPlayed += 1;
          if (s2 > s1) cur.matchesWon += 1;
          else if (s1 > s2) cur.matchesLost += 1;
        }
      }
    }
  }

  return stats;
}

export function getGamesPlayed(pid: number, rounds: Round[]): number {
  return rounds.reduce(
    (count, r) =>
      count +
      r.games.filter(
        (g) =>
          g.score !== null &&
          (g.team1.players.some((p) => p.id === pid) ||
            g.team2.players.some((p) => p.id === pid))
      ).length,
    0
  );
}

/**
 * Fisher-Yates shuffle
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Americano deterministic pairing
 */
function generateAmericanoPairs(
  players: Player[],
  roundNumber: number
): [number, number][] {
  const ids = players.map((p) => p.id);
  const n = ids.length;
  const pairs: [number, number][] = [];

  if (n < 2) return pairs;

  if (n >= 4) {
    const groupsOf4 = Math.floor(n / 4);
    const remainderStart = groupsOf4 * 4;

    for (let g = 0; g < groupsOf4; g++) {
      const base = g * 4;
      const p1 = ids[base];
      const p2 = ids[base + 1];
      const p3 = ids[base + 2];
      const p4 = ids[base + 3];

      const rotation = (roundNumber - 1) % 3;
      if (rotation === 0) {
        pairs.push([p1, p2], [p3, p4]);
      } else if (rotation === 1) {
        pairs.push([p1, p3], [p2, p4]);
      } else {
        pairs.push([p1, p4], [p2, p3]);
      }
    }

    const rem = ids.slice(remainderStart);
    for (let i = 0; i + 1 < rem.length; i += 2) {
      pairs.push([rem[i], rem[i + 1]]);
    }

    return pairs;
  }

  for (let i = 0; i + 1 < n; i += 2) {
    pairs.push([ids[i], ids[i + 1]]);
  }
  return pairs;
}

/**
 * Select active players with fair rotation for waiting players
 */
export function selectActivePlayers(
  players: Player[],
  courtCount: number,
  rounds: Round[]
): { activePlayers: Player[]; waitingPlayers: Player[] } {
  const needed = courtCount * 4;
  if (players.length <= needed) {
    return { activePlayers: [...players], waitingPlayers: [] };
  }

  // Count matches played per player to balance court time
  const playCounts = new Map<number, number>();
  for (const p of players) {
    playCounts.set(p.id, 0);
  }

  for (const r of rounds) {
    for (const g of r.games) {
      for (const pl of [...g.team1.players, ...g.team2.players]) {
        playCounts.set(pl.id, (playCounts.get(pl.id) || 0) + 1);
      }
    }
  }

  // Who played in the previous round?
  const playedLastRound = new Set<number>();
  if (rounds.length > 0) {
    const lastRound = rounds[rounds.length - 1];
    for (const g of lastRound.games) {
      for (const pl of [...g.team1.players, ...g.team2.players]) {
        playedLastRound.add(pl.id);
      }
    }
  }

  // Sort players to prioritize those who waited last round (or have played fewer games)
  const sorted = [...players].sort((a, b) => {
    const gamesA = playCounts.get(a.id) || 0;
    const gamesB = playCounts.get(b.id) || 0;
    if (gamesA !== gamesB) return gamesA - gamesB; // fewer games played get priority to play

    const aPlayedLast = playedLastRound.has(a.id) ? 1 : 0;
    const bPlayedLast = playedLastRound.has(b.id) ? 1 : 0;
    return aPlayedLast - bPlayedLast; // if a didn't play last round, prioritize a
  });

  const activePlayers = sorted.slice(0, needed);
  const waitingPlayers = sorted.slice(needed);

  return { activePlayers, waitingPlayers };
}

/**
 * Generate Round for Arabiano (Americano format)
 */
export function generateArabianoRound(
  players: Player[],
  courtCount: number,
  roundNumber: number
): Game[] {
  const playersPerCourt = 4;
  const maxPlayersThisRound = courtCount * playersPerCourt;

  let usePlayers: Player[];
  if (players.length <= maxPlayersThisRound) {
    usePlayers = [...players];
  } else {
    // Rotating window for Americano
    const rotated = [...players];
    const offset = ((roundNumber - 1) * maxPlayersThisRound) % players.length;
    usePlayers = rotated.slice(offset, offset + maxPlayersThisRound);
    if (usePlayers.length < maxPlayersThisRound) {
      usePlayers = usePlayers.concat(
        rotated.slice(0, maxPlayersThisRound - usePlayers.length)
      );
    }
  }

  const playersById = new Map(players.map((p) => [p.id, p]));
  const pairs = generateAmericanoPairs(usePlayers, roundNumber);

  const teams: Team[] = pairs.map((pair, idx) => ({
    id: idx + 1,
    players: [playersById.get(pair[0])!, playersById.get(pair[1])!],
  }));

  const games: Game[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      games.push({
        id: roundNumber * 1000 + i,
        court: (Math.floor(i / 2) % courtCount) + 1,
        team1: teams[i],
        team2: teams[i + 1],
        score: null,
      });
    }
  }
  return games;
}

/**
 * Generate Round for Mexicano Style
 * Round 1: Random pairing
 * Round 2+: Ordered by leaderboard rank:
 * Court 1: #1 & #4 vs #2 & #3
 * Court 2: #5 & #8 vs #6 & #7
 * Court 3: #9 & #12 vs #10 & #11
 * ... and so on!
 */
function partnershipKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildPartnershipMap(rounds: Round[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rounds) {
    for (const g of r.games) {
      const p1 = g.team1.players;
      const p2 = g.team2.players;
      const key1 = partnershipKey(p1[0].id, p1[1].id);
      const key2 = partnershipKey(p2[0].id, p2[1].id);
      map.set(key1, (map.get(key1) || 0) + 1);
      map.set(key2, (map.get(key2) || 0) + 1);
    }
  }
  return map;
}

/**
 * Generate Round for Mexicano Style (No waiting players - all players play every round)
 * - Round 1: Random pairing
 * - Round 2+: Ordered by leaderboard rank (Court 1: 1-4, Court 2: 5-8, Court 3: 9-12...)
 * - Within each court: 1 & 4 vs 2 & 3, ensuring players get a new teammate each round
 */
export function generateMexicanoRound(
  players: Player[],
  courtCount: number,
  roundNumber: number,
  existingRounds: Round[]
): Game[] {
  // In Mexicano style there are no waiting players: all players play every round
  const maxPlayers = courtCount * 4;
  const activePlayers = players.slice(0, maxPlayers);
  const partnerMap = buildPartnershipMap(existingRounds);

  let courtOrderedPlayers: Player[];

  if (roundNumber === 1 || existingRounds.length === 0) {
    // Round 1 is random
    courtOrderedPlayers = shuffle(activePlayers);
  } else {
    // Round 2+: Sort players by current leaderboard points descending
    const stats = calculatePlayerPoints(activePlayers, existingRounds);
    courtOrderedPlayers = [...activePlayers].sort((a, b) => {
      const pA = stats.get(a.id)?.points ?? 0;
      const pB = stats.get(b.id)?.points ?? 0;
      if (pB !== pA) return pB - pA; // highest points first
      // Tie-breakers: matches won, then ID
      const wA = stats.get(a.id)?.matchesWon ?? 0;
      const wB = stats.get(b.id)?.matchesWon ?? 0;
      if (wB !== wA) return wB - wA;
      return a.id - b.id;
    });
  }

  const games: Game[] = [];
  const courtsToFill = Math.min(
    courtCount,
    Math.floor(courtOrderedPlayers.length / 4)
  );

  for (let c = 0; c < courtsToFill; c++) {
    const base = c * 4;
    const p1 = courtOrderedPlayers[base];     // 1st of court (e.g. #1, #5, #9)
    const p2 = courtOrderedPlayers[base + 1]; // 2nd of court (e.g. #2, #6, #10)
    const p3 = courtOrderedPlayers[base + 2]; // 3rd of court (e.g. #3, #7, #11)
    const p4 = courtOrderedPlayers[base + 3]; // 4th of court (e.g. #4, #8, #12)

    // Standard Mexicano is 1 & 4 vs 2 & 3.
    // If they have already partnered in a previous round, rotate pairings
    // within the court (e.g. 1 & 3 vs 2 & 4) to ensure a NEW teammate each round!
    const candidatePairings: {
      t1: [Player, Player];
      t2: [Player, Player];
      penalty: number;
      priority: number;
    }[] = [
      {
        t1: [p1, p4],
        t2: [p2, p3],
        penalty:
          (partnerMap.get(partnershipKey(p1.id, p4.id)) || 0) +
          (partnerMap.get(partnershipKey(p2.id, p3.id)) || 0),
        priority: 1, // Standard 1&4 vs 2&3 is 1st priority
      },
      {
        t1: [p1, p3],
        t2: [p2, p4],
        penalty:
          (partnerMap.get(partnershipKey(p1.id, p3.id)) || 0) +
          (partnerMap.get(partnershipKey(p2.id, p4.id)) || 0),
        priority: 2,
      },
      {
        t1: [p1, p2],
        t2: [p3, p4],
        penalty:
          (partnerMap.get(partnershipKey(p1.id, p2.id)) || 0) +
          (partnerMap.get(partnershipKey(p3.id, p4.id)) || 0),
        priority: 3,
      },
    ];

    // Pick pairing that minimizes previous partnerships, defaulting to standard 1&4 vs 2&3
    candidatePairings.sort(
      (a, b) => a.penalty - b.penalty || a.priority - b.priority
    );

    const chosen = candidatePairings[0];

    const team1: Team = {
      id: c * 2 + 1,
      players: chosen.t1,
    };

    const team2: Team = {
      id: c * 2 + 2,
      players: chosen.t2,
    };

    games.push({
      id: roundNumber * 1000 + c * 2,
      court: c + 1,
      team1,
      team2,
      score: null,
    });
  }

  return games;
}
