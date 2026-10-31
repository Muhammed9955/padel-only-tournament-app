"use client";

import React, { useState, useMemo } from "react";
import {
  TournamentState,
  TournamentStyle,
  Player,
} from "@/types/tournament";
import {
  generateArabianoRound,
  generateMexicanoRound,
  getValidCourts,
  calculatePlayerPoints,
  calculateTournamentDuration,
} from "@/lib/pairing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  CheckCircle2,
  Info,
  Sparkles,
  Clock,
  Swords,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Wand2,
  Search,
  X,
  Check,
} from "lucide-react";
import {
  getRegisteredPlayers,
  registerNewPlayer,
  validateTournamentLineup,
  cleanPlayerName,
  normalizePlayerKey,
} from "@/lib/playerRoster";

interface TournamentViewProps {
  style: TournamentStyle;
  tournament: TournamentState | null;
  onSaveTournament: (tour: TournamentState) => void;
  onClearTournament: () => void;
  onCompleteTournament: (tour: TournamentState) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  style,
  tournament,
  onSaveTournament,
  onClearTournament,
  onCompleteTournament,
}) => {
  const isMexicano = style === "mexicano";
  const defaultTitle = isMexicano ? "Mexicano Open Tour" : "Arabiano Tour Championship";

  // Setup form states
  const [tourName, setTourName] = useState<string>(defaultTitle);
  const [playerNamesText, setPlayerNamesText] = useState<string>("");
  const [courtCount, setCourtCount] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"games" | "standings" | "rules">("games");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<boolean>(false);
  const [showMissingScoresAlert, setShowMissingScoresAlert] = useState<boolean>(false);

  // Master Registered Players Roster
  const [registeredRoster, setRegisteredRoster] = useState<string[]>([]);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [newPlayerInput, setNewPlayerInput] = useState<string>("");
  const [newPlayerFeedback, setNewPlayerFeedback] = useState<{
    success: boolean;
    message: string;
    existingName?: string;
  } | null>(null);

  // Load roster on mount
  React.useEffect(() => {
    const list = getRegisteredPlayers();
    setRegisteredRoster(list);
  }, []);

  const parsedPlayerNames = useMemo(() => {
    return playerNamesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [playerNamesText]);

  // Validation of player lineup (detect duplicates, ensure uniqueness)
  const lineupValidation = useMemo(() => {
    return validateTournamentLineup(parsedPlayerNames);
  }, [parsedPlayerNames]);

  const playerCount = parsedPlayerNames.length;
  const validCourts = useMemo(() => getValidCourts(playerCount), [playerCount]);

  const setupDuration = useMemo(() => {
    if (isMexicano || playerCount < 4 || !courtCount) return null;
    return calculateTournamentDuration(playerCount, courtCount, 1, 15);
  }, [playerCount, courtCount, isMexicano]);

  // Toggle player selection from master roster
  const toggleRosterPlayer = (playerName: string) => {
    const key = normalizePlayerKey(playerName);
    const isCurrentlySelected = parsedPlayerNames.some(
      (p) => normalizePlayerKey(p) === key
    );

    if (isCurrentlySelected) {
      // Remove
      const remaining = parsedPlayerNames.filter(
        (p) => normalizePlayerKey(p) !== key
      );
      setPlayerNamesText(remaining.join("\n"));
    } else {
      // Add
      const updated = [...parsedPlayerNames, playerName];
      setPlayerNamesText(updated.join("\n"));
    }
  };

  // Add brand new player to roster
  const handleAddNewPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPlayerInput.trim()) return;

    const res = registerNewPlayer(newPlayerInput);
    setNewPlayerFeedback(res);

    if (res.success) {
      setRegisteredRoster(getRegisteredPlayers());
      const key = normalizePlayerKey(res.name);
      if (!parsedPlayerNames.some((p) => normalizePlayerKey(p) === key)) {
        setPlayerNamesText((prev) =>
          prev.trim() ? `${prev.trim()}\n${res.name}` : res.name
        );
      }
      setNewPlayerInput("");
    } else if (res.existingName) {
      const existing = res.existingName;
      const key = normalizePlayerKey(existing);
      if (!parsedPlayerNames.some((p) => normalizePlayerKey(p) === key)) {
        setPlayerNamesText((prev) =>
          prev.trim() ? `${prev.trim()}\n${existing}` : existing
        );
      }
      setNewPlayerInput("");
    }

    setTimeout(() => setNewPlayerFeedback(null), 3500);
  };

  // Clean and format all names (title-case, strip extra spaces)
  const handleAutoFormatNames = () => {
    const cleaned = parsedPlayerNames.map(cleanPlayerName).filter(Boolean);
    setPlayerNamesText(cleaned.join("\n"));
  };

  // 1-Click Deduplicate names
  const handleRemoveDuplicates = () => {
    const { uniqueNames } = validateTournamentLineup(parsedPlayerNames);
    setPlayerNamesText(uniqueNames.join("\n"));
  };

  // Quick preset: top N registered players
  const handleSelectTopRegistered = (count: number) => {
    const top = registeredRoster.slice(0, count);
    setPlayerNamesText(top.join("\n"));
  };

  // Adjust default court count if needed
  React.useEffect(() => {
    if (isMexicano) {
      if (playerCount >= 4 && playerCount % 4 === 0) {
        setCourtCount(playerCount / 4);
      }
    } else {
      if (validCourts.length > 0 && !validCourts.includes(courtCount)) {
        setCourtCount(validCourts[0]);
      }
    }
  }, [validCourts, courtCount, isMexicano, playerCount]);

  // Handle starting a new tournament
  const handleStartTournament = () => {
    if (!lineupValidation.isValid) return; // Prevent duplicate players from entering tournament!
    if (playerCount < 4 || playerCount > 24) return;
    if (isMexicano && playerCount % 4 !== 0) return;
    const effectiveCourts = isMexicano ? Math.floor(playerCount / 4) : courtCount;
    if (!effectiveCourts || effectiveCourts < 1) return;

    // Auto-register any new names in master roster
    const currentRoster = getRegisteredPlayers();
    parsedPlayerNames.forEach((name) => {
      const clean = cleanPlayerName(name);
      if (
        clean &&
        !currentRoster.some((r) => normalizePlayerKey(r) === normalizePlayerKey(clean))
      ) {
        registerNewPlayer(clean);
      }
    });

    const initialPlayers: Player[] = parsedPlayerNames.map((name, idx) => ({
      id: idx + 1,
      name: cleanPlayerName(name),
      points: 0,
    }));

    // Generate round 1
    const round1Games = isMexicano
      ? generateMexicanoRound(initialPlayers, effectiveCourts, 1, [])
      : generateArabianoRound(initialPlayers, effectiveCourts, 1);

    const newTournament: TournamentState = {
      id: "tour-" + Date.now(),
      name: tourName.trim() || defaultTitle,
      style,
      players: initialPlayers,
      rounds: [{ id: 1, games: round1Games }],
      currentRoundId: 1,
      courtCount: effectiveCourts,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    onSaveTournament(newTournament);
    setActiveTab("games");
  };

  // Add next round
  const handleAddRound = () => {
    if (!tournament) return;

    // Must have all scores entered before adding a new round (especially critical for Mexicano)
    if (hasUnscoredGames) {
      setShowMissingScoresAlert(true);
      return;
    }

    setShowMissingScoresAlert(false);

    const nextRoundId = tournament.rounds.length + 1;

    // Check if next round already exists
    if (tournament.rounds.some((r) => r.id === nextRoundId)) {
      onSaveTournament({
        ...tournament,
        currentRoundId: nextRoundId,
      });
      return;
    }

    const newGames = isMexicano
      ? generateMexicanoRound(
          tournament.players,
          tournament.courtCount,
          nextRoundId,
          tournament.rounds
        )
      : generateArabianoRound(
          tournament.players,
          tournament.courtCount,
          nextRoundId
        );

    const updatedRounds = [
      ...tournament.rounds,
      { id: nextRoundId, games: newGames },
    ];

    onSaveTournament({
      ...tournament,
      rounds: updatedRounds,
      currentRoundId: nextRoundId,
    });
  };

  // Score update with immediate point sync
  const handleUpdateScore = (
    roundId: number,
    gameId: number,
    score: [number, number]
  ) => {
    if (!tournament) return;

    const updatedRounds = tournament.rounds.map((r) => {
      if (r.id !== roundId) return r;
      return {
        ...r,
        games: r.games.map((g) => (g.id === gameId ? { ...g, score } : g)),
      };
    });

    // Recompute player points
    const statsMap = calculatePlayerPoints(tournament.players, updatedRounds);
    const updatedPlayers = tournament.players.map((p) => ({
      ...p,
      points: statsMap.get(p.id)?.points ?? 0,
    }));

    // If all games now have scores, clear the alert
    const stillHasUnscored = updatedRounds.some((r) =>
      r.games.some((g) => g.score === null)
    );
    if (!stillHasUnscored) {
      setShowMissingScoresAlert(false);
    }

    onSaveTournament({
      ...tournament,
      rounds: updatedRounds,
      players: updatedPlayers,
    });
  };

  // Current round
  const currentRound = tournament?.rounds.find(
    (r) => r.id === tournament.currentRoundId
  );

  // Tournament live stats map
  const liveStats = useMemo(() => {
    if (!tournament) return new Map();
    return calculatePlayerPoints(tournament.players, tournament.rounds);
  }, [tournament]);

  const liveDuration = useMemo(() => {
    if (!tournament || isMexicano) return null;
    return calculateTournamentDuration(
      tournament.players.length,
      tournament.courtCount,
      tournament.currentRoundId,
      15
    );
  }, [tournament, isMexicano]);

  // Ranked tournament players
  const rankedPlayers = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.players].sort((a, b) => {
      const pA = liveStats.get(a.id)?.points ?? 0;
      const pB = liveStats.get(b.id)?.points ?? 0;
      if (pB !== pA) return pB - pA;
      const wA = liveStats.get(a.id)?.matchesWon ?? 0;
      const wB = liveStats.get(b.id)?.matchesWon ?? 0;
      return wB - wA;
    });
  }, [tournament, liveStats]);

  // Check if any games in any round are missing scores
  const unscoredGames = useMemo(() => {
    if (!tournament) return [];
    const list: { roundId: number; gameId: number; court: number }[] = [];
    tournament.rounds.forEach((r) => {
      r.games.forEach((g) => {
        if (g.score === null) {
          list.push({ roundId: r.id, gameId: g.id, court: g.court });
        }
      });
    });
    return list;
  }, [tournament]);

  const hasUnscoredGames = unscoredGames.length > 0;

  // Waiting players in current round
  const waitingPlayersInCurrentRound = useMemo(() => {
    if (!tournament || !currentRound) return [];
    const playingIds = new Set<number>();
    currentRound.games.forEach((g) => {
      g.team1.players.forEach((p) => playingIds.add(p.id));
      g.team2.players.forEach((p) => playingIds.add(p.id));
    });
    return tournament.players.filter((p) => !playingIds.has(p.id));
  }, [tournament, currentRound]);

  const handleClearScore = (roundId: number, gameId: number) => {
    if (!tournament) return;
    const updatedRounds = tournament.rounds.map((r) => {
      if (r.id !== roundId) return r;
      return {
        ...r,
        games: r.games.map((g) => (g.id === gameId ? { ...g, score: null } : g)),
      };
    });

    const statsMap = calculatePlayerPoints(tournament.players, updatedRounds);
    const updatedPlayers = tournament.players.map((p) => ({
      ...p,
      points: statsMap.get(p.id)?.points ?? 0,
    }));

    onSaveTournament({
      ...tournament,
      rounds: updatedRounds,
      players: updatedPlayers,
    });
  };

  // Quick preset scores requested: [4-0, 3-1, 3-2]
  const QUICK_SCORES_T1: [number, number][] = [
    [4, 0],
    [3, 1],
    [3, 2],
  ];
  const QUICK_SCORES_T2: [number, number][] = [
    [2, 3],
    [1, 3],
    [0, 4],
  ];

  /* ---------------------------------------------------- */
  /*  RENDER SETUP FORM (IF NO ACTIVE TOURNAMENT)        */
  /* ---------------------------------------------------- */
  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Style Banner */}
        <div
          className={`p-6 rounded-3xl border shadow-xl backdrop-blur-md ${
            isMexicano
              ? "bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-slate-900 border-amber-500/30 shadow-amber-500/10"
              : "bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-slate-900 border-emerald-500/30 shadow-emerald-500/10"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                    isMexicano
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isMexicano ? "🇲🇽 Mexicano Style" : "🎾 Arabiano Tour (Americano)"}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isMexicano ? "Ladder Dynamic Pairing" : "Rotational Partnership"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Setup {isMexicano ? "Mexicano Style" : "Arabiano Tour"}
              </h2>
              <div className="text-sm text-slate-300 max-w-2xl leading-relaxed space-y-1.5">
                {isMexicano ? (
                  <p>
                    In Mexicano, Round 1 is random. Subsequent rounds match players based on the leaderboard: 1 & 4 vs 2 & 3, 5 & 8 vs 6 & 7. Optimized for even matches with players of the same level!
                  </p>
                ) : (
                  <div>
                    <p className="font-medium text-slate-200">
                      Americano is a social padel format where partners rotate every round, giving everyone a chance to play with and against everyone else.
                    </p>
                    <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 pt-1">
                      <li>Each player plays with every other player</li>
                      <li>Points are tracked individually</li>
                      <li>Matches are automatically scheduled</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 text-4xl shadow-inner">
              {isMexicano ? "🇲🇽" : "🎾"}
            </div>
          </div>
        </div>

        {/* Setup Card */}
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Tournament Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Tournament Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Tournament Title
              </label>
              <Input
                placeholder="Tournament Name"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white focus:ring-emerald-500"
              />
            </div>

            {/* Master Registered Players Roster Selector */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      Registered Players Master Roster
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {registeredRoster.length} Available
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tap any player to add or remove them without typing errors.
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectTopRegistered(8)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800/80 transition-all hover:scale-105 active:scale-95"
                  >
                    Top 8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTopRegistered(10)}
                    className="text-xs text-teal-400 hover:text-teal-300 font-bold px-2.5 py-1 rounded-lg bg-teal-950/70 border border-teal-800/80 transition-all hover:scale-105 active:scale-95"
                  >
                    Top 10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTopRegistered(12)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/80 transition-all hover:scale-105 active:scale-95"
                  >
                    Top 12
                  </button>
                  {parsedPlayerNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlayerNamesText("")}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-950/50 border border-rose-900/60"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filter roster (e.g. Kadry, Habiba, Osama)..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-8 pr-8 py-1.5 h-8 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
                />
                {rosterSearch && (
                  <button
                    type="button"
                    onClick={() => setRosterSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Interactive Player Chips Grid */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                {registeredRoster
                  .filter((name) =>
                    name.toLowerCase().includes(rosterSearch.toLowerCase().trim())
                  )
                  .map((player) => {
                    const isSelected = parsedPlayerNames.some(
                      (p) => normalizePlayerKey(p) === normalizePlayerKey(player)
                    );
                    return (
                      <button
                        key={player}
                        type="button"
                        onClick={() => toggleRosterPlayer(player)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-emerald-500/10 scale-102"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{player}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Add Brand New Player to Roster Inline */}
              <div className="pt-3 border-t border-slate-800/80">
                <form
                  onSubmit={handleAddNewPlayer}
                  className="flex flex-col sm:flex-row sm:items-center gap-2"
                >
                  <div className="relative flex-1">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Add brand new player (e.g. Youssef ElGammal)..."
                      value={newPlayerInput}
                      onChange={(e) => setNewPlayerInput(e.target.value)}
                      className="pl-8 py-1.5 h-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-emerald-600/20 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add & Select Player
                  </Button>
                </form>

                {newPlayerFeedback && (
                  <p
                    className={`text-xs font-semibold mt-2 ${
                      newPlayerFeedback.success
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {newPlayerFeedback.success ? "✓" : "ℹ️"} {newPlayerFeedback.message}
                  </p>
                )}
              </div>
            </div>

            {/* Players Textarea & Manual Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span>Selected Tournament Lineup</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                    {playerCount} Players
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFormatNames}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                    title="Properly capitalize each name and trim extra whitespace"
                  >
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    Auto-Format
                  </button>

                  {!lineupValidation.isValid && (
                    <button
                      type="button"
                      onClick={handleRemoveDuplicates}
                      className="text-xs text-rose-300 hover:text-white flex items-center gap-1 font-bold px-2 py-1 rounded bg-rose-950/80 border border-rose-800/80 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Fix Duplicates
                    </button>
                  )}
                </div>
              </div>

              <Textarea
                placeholder="Ahmed Kadry&#10;Muhamed Khaled&#10;Mohamed Osama&#10;..."
                value={playerNamesText}
                onChange={(e) => setPlayerNamesText(e.target.value)}
                rows={6}
                className="bg-slate-950 border-slate-700 text-white font-mono text-sm focus:ring-emerald-500"
              />

              {/* Duplicate Warning Box */}
              {!lineupValidation.isValid && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        Duplicate player detected:{" "}
                        <strong className="underline text-white">
                          {lineupValidation.duplicates.join(", ")}
                        </strong>
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRemoveDuplicates}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black h-7 px-3 rounded-lg shadow-sm"
                    >
                      Remove Duplicates Now
                    </Button>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-tight">
                    Every player must have a unique name so their match statistics and pairing stay completely accurate.
                  </p>
                </div>
              )}

              {/* Status message */}
              <div className="text-xs font-semibold">
                {playerCount === 0 && (
                  <span className="text-slate-500">
                    No players selected yet. Tap players from the roster above or type names.
                  </span>
                )}
                {playerCount > 0 && playerCount < 4 && (
                  <span className="text-rose-400">
                    ⚠️ {playerCount} player(s) selected. Need at least 4 players.
                  </span>
                )}
                {playerCount > 24 && (
                  <span className="text-rose-400">
                    ⚠️ {playerCount} players selected. Maximum is 24 players.
                  </span>
                )}
                {isMexicano && playerCount >= 4 && playerCount <= 24 && playerCount % 4 !== 0 && (
                  <span className="text-amber-400">
                    ⚠️ Mexicano requires players in multiples of 4 (4, 8, 12, 16, 20, 24) so there are no waiting players! Currently {playerCount} players (add {4 - (playerCount % 4)} more to reach {playerCount + (4 - (playerCount % 4))}).
                  </span>
                )}
                {lineupValidation.isValid &&
                  ((!isMexicano && playerCount >= 4 && playerCount <= 24) ||
                    (isMexicano && playerCount >= 4 && playerCount <= 24 && playerCount % 4 === 0)) && (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {playerCount} unique players ready! {isMexicano ? `(${playerCount / 4} courts • No waiting players)` : ""}
                    </span>
                  )}
              </div>
            </div>

            {/* Mexicano Courts Direct Assignment (No Waiting) */}
            {isMexicano && playerCount >= 4 && playerCount % 4 === 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-300">
                    Mexicano Court Setup (No Waiting Players)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    0 Waiting Players
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  All <strong>{playerCount} players</strong> will play simultaneously across <strong>{playerCount / 4} courts</strong> every round. Teams pair based on the leaderboard (1&4 vs 2&3, 5&8 vs 6&7...).
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-semibold">
                  <span>♾️</span>
                  <span>No time limit: play as many rounds as you like!</span>
                </div>
              </div>
            )}

            {/* Arabiano Courts Selection (With Waiting Rule) */}
            {!isMexicano && playerCount >= 4 && playerCount <= 24 && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <label className="text-sm font-semibold text-slate-200 block">
                  Select Courts:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {validCourts.map((c) => {
                    const activeOnCourts = c * 4;
                    const waiting = playerCount - activeOnCourts;
                    const isSelected = courtCount === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCourtCount(c)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? isMexicano
                              ? "bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-500/40"
                              : "bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-500/40"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-base font-bold">
                          {c} Court{c > 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {activeOnCourts} playing
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            waiting > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {waiting > 0 ? `${waiting} waiting` : "0 waiting"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Duration & Rounds Estimation Preview */}
                {setupDuration && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        Estimated Schedule (~15m/round)
                      </span>
                      <span className="text-slate-400">
                        {setupDuration.totalRounds} Rounds Total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Est. Duration</span>
                        <span className="font-extrabold text-white text-sm">
                          {setupDuration.formattedTotalDuration}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Courts Active</span>
                        <span className="font-extrabold text-cyan-400 text-sm">
                          {courtCount * 4} Players
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block">Waiting Rotation</span>
                        <span className={`font-extrabold text-sm ${setupDuration.hasWaitingPlayers ? "text-amber-400" : "text-emerald-400"}`}>
                          {setupDuration.hasWaitingPlayers ? `${setupDuration.waitingCount} Players/round` : "0 Waiting"}
                        </span>
                      </div>
                    </div>

                    {setupDuration.hasWaitingPlayers && (
                      <p className="text-[11px] text-amber-300/90 leading-tight">
                        ⏳ {setupDuration.waitingCount} players sit out each round. The rotation algorithm automatically cycles players so everyone plays an equal number of games!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStartTournament}
              disabled={
                !lineupValidation.isValid ||
                playerCount < 4 ||
                playerCount > 24 ||
                (isMexicano ? playerCount % 4 !== 0 : !courtCount)
              }
              className={`w-full py-6 text-base font-bold rounded-2xl transition-all shadow-xl ${
                !lineupValidation.isValid
                  ? "bg-rose-950/80 text-rose-300 border border-rose-800 cursor-not-allowed"
                  : isMexicano
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-600/30"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-600/30"
              }`}
            >
              {!lineupValidation.isValid ? (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2 text-rose-400" />
                  Fix Duplicate Players to Start
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start {isMexicano ? "Mexicano Style" : "Arabiano Tour"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------- */
  /*  RENDER ACTIVE TOURNAMENT VIEW                      */
  /* ---------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Tournament Top Control Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                isMexicano
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isMexicano ? "🇲🇽 Mexicano Style" : "🎾 Arabiano Tour"}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {tournament.players.length} Players • {tournament.courtCount} Courts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {tournament.name}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Reset current tournament? Unsaved progress will be lost.")) {
                onClearTournament();
              }
            }}
            className="border-rose-900/50 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>

          <Button
            onClick={() => setShowCompleteConfirm(true)}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/30 text-xs"
          >
            <Trophy className="w-4 h-4 mr-1.5" />
            Finish & Save to Leaderboard
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Games / Standings / Rules */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("games")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "games"
              ? isMexicano
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Swords className="w-4 h-4" />
          Live Matches
        </button>

        <button
          onClick={() => setActiveTab("standings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "standings"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Tour Standings ({rankedPlayers.length})
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "rules"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Info className="w-4 h-4" />
          How it Works
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: LIVE GAMES                                     */}
      {/* ---------------------------------------------------- */}
      {activeTab === "games" && currentRound && (
        <div className="space-y-6">
          {/* Round Header & Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-lg border border-emerald-500/30">
                {currentRound.id}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    {isMexicano
                      ? `Round ${currentRound.id}`
                      : `Round ${currentRound.id} of ${tournament.rounds.length}`}
                  </h2>
                  {isMexicano ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      No time limit • Play as many rounds as you like
                    </span>
                  ) : liveDuration ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {liveDuration.roundsLeft > 0 ? `${liveDuration.roundsLeft} rounds left` : "Final rounds"}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>
                    {isMexicano && currentRound.id > 1
                      ? "Teams paired based on current leaderboard rank"
                      : isMexicano
                      ? "Round 1: Random pairings"
                      : "Rotational pairing"}
                  </span>
                  {!isMexicano && liveDuration && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        Est. remaining: ~{liveDuration.formattedRemainingDuration}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Next / Previous / Add Round buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onSaveTournament({
                    ...tournament,
                    currentRoundId: Math.max(1, tournament.currentRoundId - 1),
                  })
                }
                disabled={tournament.currentRoundId <= 1}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onSaveTournament({
                    ...tournament,
                    currentRoundId: Math.min(
                      tournament.rounds.length,
                      tournament.currentRoundId + 1
                    ),
                  })
                }
                disabled={
                  tournament.currentRoundId >= tournament.rounds.length
                }
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                size="sm"
                onClick={handleAddRound}
                title="Add Next Round"
                className={`font-bold shadow-lg transition-all ${
                  isMexicano
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-600/30"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-600/30"
                }`}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Round
              </Button>
            </div>
          </div>

          {/* Alert if user clicked Add Round while match scores are missing */}
          {showMissingScoresAlert && hasUnscoredGames && (
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="text-base shrink-0">⚠️</span>
                <span>
                  <strong>Scores required:</strong> {unscoredGames.length} match{unscoredGames.length > 1 ? "es" : ""} missing scores before generating Round {tournament.rounds.length + 1}
                  {isMexicano ? " (required to compute Mexicano ladder rankings)" : ""}.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {unscoredGames[0]?.roundId !== tournament.currentRoundId && (
                  <button
                    type="button"
                    onClick={() =>
                      onSaveTournament({
                        ...tournament,
                        currentRoundId: unscoredGames[0].roundId,
                      })
                    }
                    className="text-amber-400 underline font-bold hover:text-amber-300 whitespace-nowrap"
                  >
                    Jump to Round {unscoredGames[0].roundId} →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMissingScoresAlert(false)}
                  className="px-2 py-0.5 rounded text-amber-400/80 hover:text-amber-200 hover:bg-amber-900/40 text-xs font-bold"
                  title="Dismiss warning"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Schedule & Summary Bar */}
          {isMexicano ? (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-base">🇲🇽</span>
                <span>
                  <strong className="text-white">All {tournament.players.length} players active</strong> on {tournament.courtCount} courts • No time limit, play as many rounds as you like
                </span>
              </div>
              <span className="text-amber-400 font-bold">
                Ladder Pairing: 1&4 vs 2&3, 5&8 vs 6&7...
              </span>
            </div>
          ) : liveDuration ? (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white">{liveDuration.totalRounds} Rounds</strong> planned to rotate all players •{" "}
                  <strong className="text-emerald-400">{liveDuration.roundsLeft} rounds left</strong> (~{liveDuration.formattedRemainingDuration})
                </span>
              </div>

              {liveDuration.hasWaitingPlayers ? (
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{liveDuration.waitingCount} players sit out per round</span>
                </div>
              ) : (
                <div className="text-emerald-400 font-medium">
                  All players active (0 waiting)
                </div>
              )}
            </div>
          ) : null}

          {/* Waiting players notice (only for Arabiano if players exceed court slots) */}
          {!isMexicano && waitingPlayersInCurrentRound.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-sm">
                <span className="font-bold text-amber-300">
                  Sitting out this round ({waitingPlayersInCurrentRound.length}):
                </span>{" "}
                <span className="text-slate-300">
                  {waitingPlayersInCurrentRound.map((p) => p.name).join(" • ")}
                </span>
                <span className="text-xs text-amber-400/80 block mt-0.5">
                  (Players rotate back into matches automatically in next round)
                </span>
              </div>
            </div>
          )}

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRound.games.map((game) => {
              const [t1p1, t1p2] = game.team1.players;
              const [t2p1, t2p2] = game.team2.players;
              const s1 = game.score ? game.score[0] : null;
              const s2 = game.score ? game.score[1] : null;
              const isT1Winner = s1 !== null && s2 !== null && s1 > s2;
              const isT2Winner = s1 !== null && s2 !== null && s2 > s1;

              return (
                <Card
                  key={game.id}
                  className="bg-slate-900/90 border border-slate-800 shadow-xl rounded-2xl overflow-hidden hover:border-slate-700 transition-all"
                >
                  <CardHeader className="bg-slate-950/60 border-b border-slate-800/80 py-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <CardTitle className="text-sm font-bold text-white tracking-wide">
                        Court {game.court}
                      </CardTitle>
                    </div>
                    {game.score ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Score Entered
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                        Waiting for Score
                      </span>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Team 1 Card */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        isT1Winner
                          ? "bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                          : "bg-slate-950/60 border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Team 1
                          </span>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {t1p1.name} & {t1p2.name}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-400">
                          {s1 !== null ? s1 : "–"}
                        </div>
                      </div>
                    </div>

                    {/* Team 2 Card */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        isT2Winner
                          ? "bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                          : "bg-slate-950/60 border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Team 2
                          </span>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {t2p1.name} & {t2p2.name}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-400">
                          {s2 !== null ? s2 : "–"}
                        </div>
                      </div>
                    </div>

                    {/* Score Inputs & Quick presets */}
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Team 1 Score
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={4}
                            placeholder="0-4"
                            value={s1 !== null ? s1 : ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              handleUpdateScore(currentRound.id, game.id, [
                                val,
                                s2 !== null ? s2 : 0,
                              ]);
                            }}
                            className="bg-slate-950 border-slate-700 text-center font-bold text-white text-base focus:ring-emerald-500"
                          />
                        </div>

                        <div className="text-slate-600 font-black text-xl pt-4">:</div>

                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Team 2 Score
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={4}
                            placeholder="0-4"
                            value={s2 !== null ? s2 : ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              handleUpdateScore(currentRound.id, game.id, [
                                s1 !== null ? s1 : 0,
                                val,
                              ]);
                            }}
                            className="bg-slate-950 border-slate-700 text-center font-bold text-white text-base focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Quick 1-tap score selector [4-0, 3-1, 3-2] */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span>Quick Scores:</span>
                          {game.score && (
                            <button
                              type="button"
                              onClick={() => handleClearScore(currentRound.id, game.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                            >
                              ✕ Clear
                            </button>
                          )}
                        </div>

                        {/* Team 1 win options */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 w-14 shrink-0">
                            Team 1:
                          </span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {QUICK_SCORES_T1.map(([q1, q2]) => (
                              <button
                                key={`t1-${q1}-${q2}`}
                                type="button"
                                onClick={() =>
                                  handleUpdateScore(currentRound.id, game.id, [q1, q2])
                                }
                                className={`text-xs font-black px-3 py-1 rounded-lg transition-all ${
                                  s1 === q1 && s2 === q2
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300"
                                    : "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60"
                                }`}
                              >
                                {q1} - {q2}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Team 2 win options */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-teal-400 w-14 shrink-0">
                            Team 2:
                          </span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {QUICK_SCORES_T2.map(([q1, q2]) => (
                              <button
                                key={`t2-${q1}-${q2}`}
                                type="button"
                                onClick={() =>
                                  handleUpdateScore(currentRound.id, game.id, [q1, q2])
                                }
                                className={`text-xs font-black px-3 py-1 rounded-lg transition-all ${
                                  s1 === q1 && s2 === q2
                                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-300"
                                    : "bg-teal-950/50 text-teal-300 border border-teal-800/60 hover:bg-teal-900/60"
                                }`}
                              >
                                {q1} - {q2}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: LIVE STANDINGS                                 */}
      {/* ---------------------------------------------------- */}
      {activeTab === "standings" && (
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Live Tour Standings
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Ranked by total points won (halfs won) in this tournament
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                {tournament.rounds.length} Round{tournament.rounds.length > 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">Points (Halfs Won)</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center">W - L</th>
                  <th className="py-3 px-4 text-center">Win %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {rankedPlayers.map((player, idx) => {
                  const stat = liveStats.get(player.id) || {
                    points: 0,
                    matchesWon: 0,
                    matchesLost: 0,
                    matchesPlayed: 0,
                  };
                  const winRate =
                    stat.matchesPlayed > 0
                      ? Math.round((stat.matchesWon / stat.matchesPlayed) * 100)
                      : 0;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        idx === 0
                          ? "bg-amber-500/5 font-semibold"
                          : idx === 1
                          ? "bg-slate-300/5 font-semibold"
                          : idx === 2
                          ? "bg-amber-700/5 font-semibold"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {idx === 0 && <span className="text-base">🥇</span>}
                          {idx === 1 && <span className="text-base">🥈</span>}
                          {idx === 2 && <span className="text-base">🥉</span>}
                          <span
                            className={`font-black ${
                              idx < 3 ? "text-amber-400" : "text-slate-400"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        {player.name}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 font-black border border-emerald-800/50">
                          {stat.points}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-300 font-medium">
                        {stat.matchesPlayed}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-400 font-bold">
                          {stat.matchesWon}
                        </span>
                        <span className="text-slate-500 mx-1">-</span>
                        <span className="text-rose-400 font-bold">
                          {stat.matchesLost}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                            winRate >= 60
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : winRate >= 40
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-900 text-slate-500"
                          }`}
                        >
                          {winRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: HOW IT WORKS                                   */}
      {/* ---------------------------------------------------- */}
      {activeTab === "rules" && (
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-400" />
              Tournament Format & Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
            {isMexicano ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <h3 className="text-lg font-bold text-amber-300 mb-2">
                    🇲🇽 How to play padel mexicano?
                  </h3>
                  <p>
                    In mexicano you are paired with a new teammate in each round.
                    However, you are not guaranteed to team up with every player
                    and you are not guaranteed to play against every player.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        1
                      </span>
                      Round 1: Random Pairing
                    </h4>
                    <p className="text-slate-400 text-xs">
                      The very first round is completely random, letting everyone warm
                      up and establish their initial leaderboard standing.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        2
                      </span>
                      Round 2+: Leaderboard Teams
                    </h4>
                    <p className="text-slate-400 text-xs">
                      Teams are based strictly on the leaderboard:
                      <br />• <strong>Court 1:</strong> #1 & #4 vs #2 & #3
                      <br />• <strong>Court 2:</strong> #5 & #8 vs #6 & #7
                      <br />• <strong>Court 3:</strong> #9 & #12 vs #10 & #11
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        3
                      </span>
                      Even Matches & Continuous Play
                    </h4>
                    <p className="text-slate-400 text-xs">
                      Mexicano is optimized for balanced matches with players of the
                      same level playing together. You can keep adding rounds as long
                      as you like!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        4
                      </span>
                      Determining the Winner
                    </h4>
                    <p className="text-slate-400 text-xs">
                      The winner is the player with the most total points (halfs won)
                      after the last round is concluded!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <h3 className="text-lg font-bold text-emerald-300 mb-2">
                    🎾 How to play Arabiano Tour (Americano)?
                  </h3>
                  <p className="text-slate-200">
                    Americano is a social padel format where partners rotate every round, giving everyone a chance to play with and against everyone else.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        1
                      </span>
                      Play with Everyone
                    </h4>
                    <p className="text-slate-400 text-xs">
                      Each player plays with every other player across rotating court pairings.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        2
                      </span>
                      Individual Points
                    </h4>
                    <p className="text-slate-400 text-xs">
                      Points are tracked individually. Both partners collect the points scored in the match.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        3
                      </span>
                      Automatic Scheduling
                    </h4>
                    <p className="text-slate-400 text-xs">
                      Matches and rotations are automatically scheduled with fair waiting player handling.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* COMPLETE TOURNAMENT CONFIRMATION MODAL                */}
      {/* ---------------------------------------------------- */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">
                Complete Tournament?
              </h3>
              <p className="text-sm text-slate-400">
                This will finalize standings, award championships & podiums, and
                record all player points and match records into the Global Career
                Leaderboard!
              </p>
            </div>

            {/* Podium Preview */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-xs uppercase font-bold text-slate-400 block text-center">
                Tournament Champions
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {rankedPlayers.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border ${
                      i === 0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : i === 1
                        ? "bg-slate-300/10 border-slate-300/30 text-slate-200"
                        : "bg-amber-700/10 border-amber-700/30 text-amber-400"
                    }`}
                  >
                    <div className="text-lg">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </div>
                    <div className="text-xs font-bold truncate mt-1">{p.name}</div>
                    <div className="text-[11px] font-black mt-0.5">
                      {liveStats.get(p.id)?.points ?? 0} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCompleteConfirm(false)}
                className="border-slate-700 text-slate-300"
              >
                Continue Playing
              </Button>
              <Button
                onClick={() => {
                  setShowCompleteConfirm(false);
                  onCompleteTournament(tournament);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
              >
                Confirm & Record Stats
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
