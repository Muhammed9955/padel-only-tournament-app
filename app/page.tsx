"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Player = { id: number; name: string; points: number };
type Team = { id: number; players: [Player, Player] };
type Game = {
  id: number;
  court: number;
  team1: Team;
  team2: Team;
  score: [number, number] | null;
};
type Round = { id: number; games: Game[] };

const partnershipKey = (a: number, b: number) =>
  a < b ? `${a}-${b}` : `${b}-${a}`;

function buildPartnershipMap(rounds: Round[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rounds) {
    for (const g of r.games) {
      const pairs: [number, number][] = [
        [g.team1.players[0].id, g.team1.players[1].id],
        [g.team2.players[0].id, g.team2.players[1].id],
      ];
      for (const [x, y] of pairs) {
        const key = partnershipKey(x, y);
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
  }
  return map;
}

function generatePairs(
  players: Player[],
  existing: Map<string, number>
): [number, number][] {
  const ids = players.map((p) => p.id);
  const used = new Set<number>();
  const result: [number, number][] = [];

  function backtrack(): boolean {
    if (used.size === ids.length) return true;
    const available = ids.filter((id) => !used.has(id));
    if (available.length < 2) return false;

    const p1 = available[0];
    for (let i = 1; i < available.length; i++) {
      const p2 = available[i];
      if (existing.get(partnershipKey(p1, p2))) continue;
      used.add(p1);
      used.add(p2);
      result.push([p1, p2]);
      if (backtrack()) return true;
      result.pop();
      used.delete(p1);
      used.delete(p2);
    }
    return false;
  }

  if (backtrack()) return result;

  // fallback simple pairing
  return ids.reduce<[number, number][]>((acc, id, i) => {
    if (i % 2 === 1) acc.push([ids[i - 1], id]);
    return acc;
  }, []);
}

function pairsToTeams(
  pairs: [number, number][],
  playersById: Map<number, Player>
): Team[] {
  return pairs.map((pair, idx) => ({
    id: idx + 1,
    players: [playersById.get(pair[0])!, playersById.get(pair[1])!] as [
      Player,
      Player
    ],
  }));
}

function getGamesPlayed(pid: number, rounds: Round[]): number {
  return rounds.reduce(
    (c, r) =>
      c +
      r.games.filter(
        (g) =>
          g.score &&
          (g.team1.players.some((p) => p.id === pid) ||
            g.team2.players.some((p) => p.id === pid))
      ).length,
    0
  );
}

// ✅ New function: valid court options with waiting players check (0–6)
function getValidCourts(playersCount: number): number[] {
  const options: number[] = [];
  if (playersCount < 4) return options;

  for (let courts = 1; courts <= Math.ceil(playersCount / 4); courts++) {
    const waiting = playersCount - courts * 4;
    if (waiting >= 0 && waiting <= 6) {
      options.push(courts);
    }
  }
  return options;
}

export default function ArabianoTournamentPage() {
  const [tournamentName, setTournamentName] = useState<string>("Arabiano");
  const [playerNamesText, setPlayerNamesText] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundId, setCurrentRoundId] = useState<number>(0);
  const [courtCount, setCourtCount] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<"setup" | "games" | "standings">(
    "setup"
  );

  // Load state
  useEffect(() => {
    const raw = localStorage.getItem("arabiano_ui_v1");
    if (raw) {
      try {
        const data = JSON.parse(raw) as {
          tournamentName?: string;
          players?: Player[];
          rounds?: Round[];
          currentRoundId?: number;
          courtCount?: number;
        };
        setTournamentName(data.tournamentName || "Arabiano");
        setPlayers(data.players || []);
        setRounds(data.rounds || []);
        setCurrentRoundId(data.currentRoundId || 0);
        setCourtCount(data.courtCount || 4);
        if (data.players && data.players.length) setActiveTab("games");
      } catch {
        console.error("Failed to parse saved tournament data");
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(
      "arabiano_ui_v1",
      JSON.stringify({
        tournamentName,
        players,
        rounds,
        currentRoundId,
        courtCount,
      })
    );
  }, [tournamentName, players, rounds, currentRoundId, courtCount]);

  const playersById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const generateRound = useCallback(
    (roundNumber: number): Game[] => {
      const playersPerCourt = 4;
      const maxPlayersThisRound = courtCount * playersPerCourt;

      let usePlayers: Player[];
      if (players.length <= maxPlayersThisRound) {
        usePlayers = [...players];
      } else {
        const rotated = [...players];
        const offset =
          ((roundNumber - 1) * maxPlayersThisRound) % players.length;
        usePlayers = rotated.slice(offset, offset + maxPlayersThisRound);
        if (usePlayers.length < maxPlayersThisRound) {
          usePlayers = usePlayers.concat(
            rotated.slice(0, maxPlayersThisRound - usePlayers.length)
          );
        }
      }

      const existing = buildPartnershipMap(rounds);
      const pairs = generatePairs(usePlayers, existing);
      const teams = pairsToTeams(pairs, playersById);

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
    },
    [players, courtCount, rounds, playersById]
  );

  const createFirstRound = () => {
    const first = generateRound(1);
    setRounds([{ id: 1, games: first }]);
    setCurrentRoundId(1);
  };

  const createNextRound = () => {
    const nextId = currentRoundId + 1;
    if (!rounds.some((r) => r.id === nextId)) {
      setRounds((r) => [...r, { id: nextId, games: generateRound(nextId) }]);
    }
    setCurrentRoundId(nextId);
  };

  const addPlayers = () => {
    const names = playerNamesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length < 4 || names.length > 24) return;
    setPlayers(names.map((n, i) => ({ id: i + 1, name: n, points: 0 })));
    setActiveTab("games");
    createFirstRound();
  };

  const resetTournament = () => {
    if (confirm("Are you sure you want to reset the tournament?")) {
      setTournamentName("Arabiano");
      setPlayers([]);
      setRounds([]);
      setCurrentRoundId(0);
      setPlayerNamesText("");
      setActiveTab("setup");
      localStorage.removeItem("arabiano_ui_v1");
    }
  };

  const updateScore = (
    roundId: number,
    gameId: number,
    score: [number, number]
  ) => {
    const [s1, s2] = score;
    if (s1 === s2) {
      alert("No ties allowed");
      return;
    }
    if (s1 < 0 || s1 > 7 || s2 < 0 || s2 > 7) {
      alert("Scores must be between 0 and 7");
      return;
    }

    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? {
              ...r,
              games: r.games.map((g) =>
                g.id === gameId ? { ...g, score } : g
              ),
            }
          : r
      )
    );

    // recalc points safely
    setPlayers((prev) => {
      const fresh = prev.map((p) => ({ ...p, points: 0 }));
      const map = new Map(fresh.map((p) => [p.id, p]));
      const allRounds = rounds.map((r) =>
        r.id === roundId
          ? {
              ...r,
              games: r.games.map((g) =>
                g.id === gameId ? { ...g, score } : g
              ),
            }
          : r
      );
      allRounds.forEach((r) =>
        r.games.forEach((g) => {
          if (!g.score) return;
          g.team1.players.forEach(
            (pl) => (map.get(pl.id)!.points += g.score![0])
          );
          g.team2.players.forEach(
            (pl) => (map.get(pl.id)!.points += g.score![1])
          );
        })
      );
      return Array.from(map.values());
    });
  };

  const currentRound: Round | null =
    rounds.find((r) => r.id === currentRoundId) || null;
  const playerCount = playerNamesText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean).length;

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Tabs header */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeTab === "setup" ? "default" : "outline"}
          onClick={() => setActiveTab("setup")}
        >
          Setup
        </Button>
        <Button
          variant={activeTab === "games" ? "default" : "outline"}
          onClick={() => players.length && setActiveTab("games")}
          disabled={!players.length}
        >
          Games
        </Button>
        <Button
          variant={activeTab === "standings" ? "default" : "outline"}
          onClick={() => players.length && setActiveTab("standings")}
          disabled={!players.length}
        >
          Standings
        </Button>
        <Button
          variant="destructive"
          className="ml-auto"
          onClick={resetTournament}
        >
          Reset
        </Button>
      </div>

      {/* SETUP */}
      {activeTab === "setup" && (
        <Card className="mb-6 shadow-xl border border-blue-100">
          <CardHeader>
            <CardTitle className="text-xl text-white font-bold">
              Setup Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Tournament name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
            <Textarea
              placeholder="One player per line (4–24)"
              value={playerNamesText}
              onChange={(e) => setPlayerNamesText(e.target.value)}
              className="h-40"
            />
            <div className="text-sm">
              {playerCount === 0 && (
                <span className="text-gray-500">No players yet</span>
              )}
              {playerCount > 0 && playerCount < 4 && (
                <span className="text-red-600">
                  {playerCount} players added (need at least 4)
                </span>
              )}
              {playerCount > 24 && (
                <span className="text-red-600">
                  {playerCount} players added (max 24 allowed)
                </span>
              )}
              {playerCount >= 4 && playerCount <= 24 && (
                <span className="text-green-600">
                  {playerCount} players added
                </span>
              )}
            </div>

            {/* ✅ Court selector with validation */}
            {playerCount >= 4 && (
              <div>
                <label className="block mb-2 font-medium">
                  Number of courts:
                </label>
                <select
                  value={courtCount}
                  onChange={(e) => setCourtCount(parseInt(e.target.value))}
                  className="border rounded p-2 w-full bg-black  "
                >
                  <option value="" className="text-white">
                    -- choose --
                  </option>
                  {getValidCourts(playerCount).map((c) => (
                    <option key={c} value={c} className="text-white">
                      {c} court{c > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                {courtCount > 0 && (
                  <p className="mt-2 text-sm text-white">
                    {playerCount} players → {courtCount * 4} on {courtCount}{" "}
                    courts, {` `}
                    <span className="text-yellow-500">
                      {playerCount - courtCount * 4} waiting
                    </span>
                  </p>
                )}
              </div>
            )}

            <Button
              className="bg-black hover:bg-black text-white"
              onClick={addPlayers}
              disabled={!courtCount}
            >
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      )}

      {/* GAMES */}
      {activeTab === "games" && currentRound && (
        <div className="space-y-4">
          {/* Tournament name */}
          {tournamentName && (
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
              {tournamentName}
            </h1>
          )}

          {/* Waiting players */}
          {(() => {
            const playingIds = new Set<number>();
            currentRound.games.forEach((g) => {
              g.team1.players.forEach((p) => playingIds.add(p.id));
              g.team2.players.forEach((p) => playingIds.add(p.id));
            });
            const waiting = players.filter((p) => !playingIds.has(p.id));
            return waiting.length > 0 ? (
              <div className="p-3 border bg-gray-800 border-gray-300 rounded-md text-sm font-medium">
                <span className="text-yellow-500">Waiting players:</span>{" "}
                <span className="">
                  {waiting.map((p) => p.name).join(" / ")}
                </span>
              </div>
            ) : null;
          })()}

          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-xl font-semibold text-white">
              Round {currentRoundId}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentRoundId((prev) => Math.max(1, prev - 1))
                }
                disabled={currentRoundId <= 1}
              >
                ← Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentRoundId((prev) =>
                    rounds.some((r) => r.id === prev + 1) ? prev + 1 : prev
                  )
                }
                disabled={!rounds.some((r) => r.id === currentRoundId + 1)}
              >
                Next →
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={createNextRound}
              >
                Add Round
              </Button>
            </div>
          </div>

          {/* Games grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRound.games.map((g) => (
              <Card
                key={g.id}
                className="shadow-md border border-gray-200 rounded-xl"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-gray-700">
                    Court {g.court}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-2 rounded bg-black ">
                    <strong>{g.team1.players[0].name}</strong> &{" "}
                    {g.team1.players[1].name}
                    <span className="float-right font-bold">
                      {g.score ? g.score[0] : "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black mt-2">
                    <strong>{g.team2.players[0].name}</strong> &{" "}
                    {g.team2.players[1].name}
                    <span className="float-right font-bold">
                      {g.score ? g.score[1] : "-"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Team1"
                      type="number"
                      min={0}
                      max={7}
                      value={g.score ? g.score[0] : ""}
                      className={`${
                        g.score &&
                        (g.score[0] < 0 ||
                          g.score[0] > 7 ||
                          g.score[0] === g.score[1])
                          ? "border-red-500"
                          : ""
                      }`}
                      onChange={(e) =>
                        updateScore(currentRound.id, g.id, [
                          parseInt(e.target.value || "0"),
                          g.score ? g.score[1] : 0,
                        ])
                      }
                    />
                    <Input
                      placeholder="Team2"
                      type="number"
                      min={0}
                      max={7}
                      value={g.score ? g.score[1] : ""}
                      className={`${
                        g.score &&
                        (g.score[1] < 0 ||
                          g.score[1] > 7 ||
                          g.score[0] === g.score[1])
                          ? "border-red-500"
                          : ""
                      }`}
                      onChange={(e) =>
                        updateScore(currentRound.id, g.id, [
                          g.score ? g.score[0] : 0,
                          parseInt(e.target.value || "0"),
                        ])
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STANDINGS */}
      {activeTab === "standings" && (
        <Card className="shadow-md border border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Standings</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Rank</th>
                  <th className="border p-2">Player</th>
                  <th className="border p-2">Points</th>
                  <th className="border p-2">Games</th>
                </tr>
              </thead>
              <tbody>
                {players
                  .slice()
                  .sort((a, b) => b.points - a.points)
                  .map((p, idx) => (
                    <tr key={p.id} className="text-center">
                      <td className="border p-2 font-bold">{idx + 1}</td>
                      <td className="border p-2">{p.name}</td>
                      <td className="border p-2">{p.points}</td>
                      <td className="border p-2">
                        {getGamesPlayed(p.id, rounds)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
