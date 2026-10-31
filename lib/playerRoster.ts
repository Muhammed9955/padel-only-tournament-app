import { getCareerLeaderboard } from "./storage";

export const DEFAULT_MASTER_PLAYERS: string[] = [
  "Muhamed Khaled",
  "Ahmed Kadry",
  "Mohamed Osama",
  "Mohamed Waheed",
  "Moataz Tarek",
  "Habiba",
  "Aya Magdy",
  "Sara",
  "Esraa",
  "Omnia",
  "Mohamed Doks",
  "Charles",
  "Ibrahim",
  "Mahmoud Alyan",
  "Louai",
  "Kholoud",
  "Osama Ali",
  "Fahmy",
  "Mazen",
  "Samir",
  "Fahd",
];

const REGISTERED_PLAYERS_KEY = "arabiano_registered_players_v2";

/**
 * Normalizes player name for display: Title-cased with single spaces
 * e.g. "mohamed   osama" -> "Mohamed Osama"
 */
export function cleanPlayerName(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Normalizes player key for exact deduplication / matching
 * e.g. "Mohamed Osama " -> "mohamed osama"
 */
export function normalizePlayerKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Fetch all unique registered players
 */
export function getRegisteredPlayers(): string[] {
  if (typeof window === "undefined") return DEFAULT_MASTER_PLAYERS;

  try {
    const raw = localStorage.getItem(REGISTERED_PLAYERS_KEY);
    let list: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    // Merge with any players from career leaderboard
    const career = getCareerLeaderboard();
    const careerNames = career.map((p) => p.name);

    // Merge default master players + career names + stored list
    const combined = [...list, ...careerNames, ...DEFAULT_MASTER_PLAYERS];
    const uniqueMap = new Map<string, string>();

    combined.forEach((name) => {
      const cleaned = cleanPlayerName(name);
      if (cleaned.length >= 2) {
        const key = normalizePlayerKey(cleaned);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, cleaned);
        }
      }
    });

    const result = Array.from(uniqueMap.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    // Cache if list was empty or newly initialized
    if (!raw || list.length < result.length) {
      localStorage.setItem(REGISTERED_PLAYERS_KEY, JSON.stringify(result));
    }

    return result;
  } catch (err) {
    console.warn("Failed to get registered players:", err);
    return DEFAULT_MASTER_PLAYERS;
  }
}

/**
 * Save updated list of unique players
 */
export function saveRegisteredPlayers(players: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const uniqueMap = new Map<string, string>();
    players.forEach((p) => {
      const clean = cleanPlayerName(p);
      if (clean.length >= 2) {
        const key = normalizePlayerKey(clean);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, clean);
        }
      }
    });

    const uniqueList = Array.from(uniqueMap.values()).sort((a, b) =>
      a.localeCompare(b)
    );
    localStorage.setItem(REGISTERED_PLAYERS_KEY, JSON.stringify(uniqueList));
  } catch (err) {
    console.error("Failed to save registered players:", err);
  }
}

/**
 * Register a single new player with duplicate validation
 */
export function registerNewPlayer(name: string): {
  success: boolean;
  name: string;
  message: string;
  existingName?: string;
} {
  const clean = cleanPlayerName(name);
  if (!clean || clean.length < 2) {
    return {
      success: false,
      name: clean,
      message: "Player name must be at least 2 characters.",
    };
  }

  const current = getRegisteredPlayers();
  const key = normalizePlayerKey(clean);
  const existing = current.find((p) => normalizePlayerKey(p) === key);

  if (existing) {
    return {
      success: false,
      name: existing,
      message: `"${existing}" is already in the registered roster!`,
      existingName: existing,
    };
  }

  const updated = [...current, clean];
  saveRegisteredPlayers(updated);
  return {
    success: true,
    name: clean,
    message: `"${clean}" successfully added to the roster!`,
  };
}

/**
 * Detect duplicates and validate player lineup for a tournament
 */
export function validateTournamentLineup(names: string[]): {
  isValid: boolean;
  uniqueCount: number;
  uniqueNames: string[];
  duplicates: string[];
  error: string | null;
} {
  const seen = new Map<string, string>();
  const duplicatesSet = new Set<string>();
  const uniqueNames: string[] = [];

  names.forEach((raw) => {
    const clean = cleanPlayerName(raw);
    if (!clean) return;
    const key = normalizePlayerKey(clean);

    if (seen.has(key)) {
      duplicatesSet.add(clean);
    } else {
      seen.set(key, clean);
      uniqueNames.push(clean);
    }
  });

  const duplicates = Array.from(duplicatesSet);
  const isValid = duplicates.length === 0;

  let error: string | null = null;
  if (duplicates.length > 0) {
    error = `Duplicate player detected: ${duplicates.map((d) => `"${d}"`).join(", ")}. Each player in a tournament must be unique!`;
  }

  return {
    isValid,
    uniqueCount: uniqueNames.length,
    uniqueNames,
    duplicates,
    error,
  };
}
