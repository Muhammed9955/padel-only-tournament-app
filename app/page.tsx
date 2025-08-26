"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  name: string;
  points: number;
}

interface Team {
  id: number;
  players: [Player, Player];
}

interface Game {
  id: number;
  court: number;
  team1: Team;
  team2: Team;
  score: [number, number] | null;
}

interface Round {
  id: number;
  games: Game[];
}

export default function PadelTournament() {
  const [tournamentName, setTournamentName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNames, setPlayerNames] = useState<string>("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"setup" | "games" | "standings">(
    "setup"
  );
  const [titleError, setTitleError] = useState<string>("");
  const [courtCount, setCourtCount] = useState<number>(4);
  const [groups, setGroups] = useState<Player[][]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("padelTournament");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setTournamentName(data.tournamentName || "");
        setPlayers(data.players || []);
        setRounds(data.rounds || []);
        setCurrentRound(data.currentRound || 0);
        setCourtCount(data.courtCount || 4);
        setGroups(data.groups || []);
        if (data.players && data.players.length > 0) {
          setActiveTab("games");
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
        localStorage.removeItem("padelTournament");
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const data = {
      tournamentName,
      players,
      rounds,
      currentRound,
      courtCount,
      groups,
    };
    localStorage.setItem("padelTournament", JSON.stringify(data));
  }, [tournamentName, players, rounds, currentRound, courtCount, groups]);

  const getMinCourts = () => {
    return 1;
  };

  const getMaxCourts = () => {
    return Math.max(1, Math.floor(players.length / 4));
  };

  const getCurrentRoundGames = (): Game[] => {
    if (rounds.length === 0) return [];
    const round = rounds.find((r) => r.id === currentRound);
    return round ? round.games : [];
  };

  const generateRoundRobinRound = (
    playersList: Player[],
    roundNumber: number
  ): Game[] => {
    // Shuffle players for random pairing
    const shuffledPlayers = [...playersList].sort(() => Math.random() - 0.5);

    // Create teams
    const teams: Team[] = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        teams.push({
          id: teams.length + 1,
          players: [shuffledPlayers[i], shuffledPlayers[i + 1]],
        });
      }
    }

    // Create games
    const games: Game[] = [];
    const maxCourts = Math.min(courtCount, Math.floor(teams.length / 2));

    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        games.push({
          id: roundNumber * 100 + i,
          court: (games.length % maxCourts) + 1,
          team1: teams[i],
          team2: teams[i + 1],
          score: null,
        });
      }
    }

    return games;
  };

  const generateGroupBasedRound = (
    roundNumber: number,
    groups: Player[][]
  ): Game[] => {
    const groupIndex = (roundNumber - 1) % 3;
    let groupIndices: [number, number];

    if (groupIndex === 0) {
      groupIndices = [0, 1]; // Groups A and B
    } else if (groupIndex === 1) {
      groupIndices = [0, 2]; // Groups A and C
    } else {
      groupIndices = [1, 2]; // Groups B and C
    }

    const playersInRound = [
      ...groups[groupIndices[0]],
      ...groups[groupIndices[1]],
    ];

    // Shuffle players for random pairing
    const shuffledPlayers = [...playersInRound].sort(() => Math.random() - 0.5);

    // Create teams from player pairs
    const teams: Team[] = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        teams.push({
          id: teams.length + 1,
          players: [shuffledPlayers[i], shuffledPlayers[i + 1]],
        });
      }
    }

    // Create games from team pairs
    const games: Game[] = [];
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        games.push({
          id: roundNumber * 100 + i,
          court: (games.length % courtCount) + 1,
          team1: teams[i],
          team2: teams[i + 1],
          score: null,
        });
      }
    }

    return games;
  };

  const updateScore = (
    roundId: number,
    gameId: number,
    score: [number, number]
  ) => {
    // Update the game score
    setRounds((prevRounds) => {
      return prevRounds.map((round) => {
        if (round.id === roundId) {
          const updatedGames = round.games.map((game) => {
            if (game.id === gameId) {
              // Update player points based on the score
              const [score1, score2] = score;
              const updatedTeam1Players = game.team1.players.map((player) => {
                const pointsToAdd =
                  score1 > score2 ? 2 : score1 === score2 ? 1 : 0;
                return {
                  ...player,
                  points: player.points + pointsToAdd,
                };
              });

              const updatedTeam2Players = game.team2.players.map((player) => {
                const pointsToAdd =
                  score2 > score1 ? 2 : score1 === score2 ? 1 : 0;
                return {
                  ...player,
                  points: player.points + pointsToAdd,
                };
              });

              // Update the players state
              setPlayers((prevPlayers) => {
                return prevPlayers.map((player) => {
                  const team1Player = updatedTeam1Players.find(
                    (p) => p.id === player.id
                  );
                  if (team1Player) return team1Player;

                  const team2Player = updatedTeam2Players.find(
                    (p) => p.id === player.id
                  );
                  if (team2Player) return team2Player;

                  return player;
                });
              });

              return {
                ...game,
                score,
                team1: {
                  ...game.team1,
                  players: updatedTeam1Players as [Player, Player],
                },
                team2: {
                  ...game.team2,
                  players: updatedTeam2Players as [Player, Player],
                },
              };
            }
            return game;
          });

          return {
            ...round,
            games: updatedGames,
          };
        }
        return round;
      });
    });
  };

  const goToPreviousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1);
    }
  };

  const resetTournament = () => {
    setTournamentName("");
    setPlayers([]);
    setPlayerNames("");
    setRounds([]);
    setCurrentRound(0);
    setActiveTab("setup");
    setCourtCount(4);
    setGroups([]);
    localStorage.removeItem("padelTournament");
  };

  const generateFirstRound = (playersList: Player[]) => {
    const games = generateRoundRobinRound(playersList, 1);
    setRounds([{ id: 1, games }]);
    setCurrentRound(1);
  };

  const generateFirstRoundWithGroups = (groups: Player[][]) => {
    const games = generateGroupBasedRound(1, groups);
    setRounds([{ id: 1, games }]);
    setCurrentRound(1);
  };

  const addPlayers = () => {
    if (!tournamentName.trim()) {
      setTitleError("Tournament name is required");
      return;
    }
    setTitleError("");

    const names = playerNames.split("\n").filter((name) => name.trim() !== "");
    if (names.length < 4 || names.length > 24) {
      alert("Please enter between 4 and 24 players");
      return;
    }

    const newPlayers: Player[] = names.map((name, index) => ({
      id: index + 1,
      name: name.trim(),
      points: 0,
    }));

    setPlayers(newPlayers);

    if (newPlayers.length === 24) {
      setCourtCount(4);
      // Create three random groups of 8 players
      const shuffledPlayers = [...newPlayers].sort(() => Math.random() - 0.5);
      const groupSize = 8;
      const newGroups = [
        shuffledPlayers.slice(0, groupSize),
        shuffledPlayers.slice(groupSize, groupSize * 2),
        shuffledPlayers.slice(groupSize * 2),
      ];
      setGroups(newGroups);
      generateFirstRoundWithGroups(newGroups);
    } else {
      generateFirstRound(newPlayers);
    }
    setActiveTab("games");
  };

  const generateNextRound = () => {
    const nextRoundId = currentRound + 1;
    const existingRound = rounds.find((round) => round.id === nextRoundId);
    if (existingRound) {
      setCurrentRound(nextRoundId);
      return;
    }

    let newGames: Game[];
    if (players.length === 24) {
      newGames = generateGroupBasedRound(nextRoundId, groups);
    } else {
      newGames = generateRoundRobinRound(players, nextRoundId);
    }

    setRounds([...rounds, { id: nextRoundId, games: newGames }]);
    setCurrentRound(nextRoundId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">
            Padel Tournament Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Organize and track your padel tournament with ease
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "setup"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("setup")}
          >
            Tournament Setup
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "games"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            } ${players.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => players.length > 0 && setActiveTab("games")}
            disabled={players.length === 0}
          >
            Games
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === "standings"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            } ${players.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => players.length > 0 && setActiveTab("standings")}
            disabled={players.length === 0}
          >
            Standings
          </button>
        </div>

        <div className="p-6">
          {activeTab === "setup" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => {
                    setTournamentName(e.target.value);
                    if (titleError && e.target.value.trim()) {
                      setTitleError("");
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    titleError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter tournament name"
                />
                {titleError && (
                  <p className="text-red-500 text-sm mt-1">{titleError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Names (4-24 players, one per line)
                </label>
                <textarea
                  value={playerNames}
                  onChange={(e) => setPlayerNames(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48"
                  placeholder="Enter 4-24 player names, one per line"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {
                    playerNames.split("\n").filter((name) => name.trim() !== "")
                      .length
                  }{" "}
                  players entered
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Courts
                </label>
                <select
                  value={courtCount}
                  onChange={(e) => setCourtCount(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={players.length === 24}
                >
                  {Array.from(
                    { length: getMaxCourts() - getMinCourts() + 1 },
                    (_, i) => {
                      const courtNum = getMinCourts() + i;
                      return (
                        <option key={courtNum} value={courtNum}>
                          {courtNum} court{courtNum > 1 ? "s" : ""}
                        </option>
                      );
                    }
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {players.length === 24
                    ? "Court count is fixed to 4 for 24 players"
                    : `Minimum: ${getMinCourts()} court${
                        getMinCourts() > 1 ? "s" : ""
                      }, Maximum: ${getMaxCourts()} court${
                        getMaxCourts() > 1 ? "s" : ""
                      }`}
                </p>
              </div>

              <button
                onClick={addPlayers}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Create Tournament
              </button>
            </div>
          )}

          {activeTab === "games" && players.length > 0 && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-5 md:mb-0">
                  {tournamentName} - Round {currentRound}
                </h2>
                <div className="flex space-x-3">
                  {currentRound > 1 && (
                    <button
                      onClick={goToPreviousRound}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Previous
                      {/* Round */}
                    </button>
                  )}
                  <button
                    onClick={generateNextRound}
                    disabled={getCurrentRoundGames().some(
                      (game) => !game.score
                    )}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Next
                    {/* Round */}
                  </button>
                  <button
                    onClick={resetTournament}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Reset
                    {/* Tournament */}
                  </button>
                </div>
              </div>

              {getCurrentRoundGames().length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No games scheduled for this round.
                  </p>
                  <p className="text-gray-500 mt-2">
                    You need at least 4 players to create a game.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getCurrentRoundGames().map((game) => (
                    <div
                      key={game.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Court {game.court}
                        </h3>
                        {game.score && (
                          <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700">
                            {game.team1.players[0].name} &{" "}
                            {game.team1.players[1].name}
                          </span>
                          {game.score && (
                            <span className="text-lg font-bold text-gray-900">
                              {game.score[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            {game.team2.players[0].name} &{" "}
                            {game.team2.players[1].name}
                          </span>
                          {game.score && (
                            <span className="text-lg font-bold text-gray-900">
                              {game.score[1]}
                            </span>
                          )}
                        </div>

                        <div className="text-center text-xs text-gray-500 mt-3">
                          VS
                        </div>
                      </div>

                      {!game.score && (
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-700">
                              Set Score:
                            </span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="6"
                                placeholder="0"
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                                id={`team1-score-${game.id}`}
                              />
                              <span className="font-bold text-gray-700">-</span>
                              <input
                                type="number"
                                min="0"
                                max="6"
                                placeholder="0"
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                                id={`team2-score-${game.id}`}
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const team1Input = document.getElementById(
                                `team1-score-${game.id}`
                              ) as HTMLInputElement;
                              const team2Input = document.getElementById(
                                `team2-score-${game.id}`
                              ) as HTMLInputElement;

                              const team1Score = parseInt(team1Input.value);
                              const team2Score = parseInt(team2Input.value);

                              if (isNaN(team1Score) || isNaN(team2Score)) {
                                alert("Please enter valid scores");
                                return;
                              }

                              if (team1Score === team2Score) {
                                alert("Scores cannot be equal");
                                return;
                              }

                              if (team1Score > 6 || team2Score > 6) {
                                alert("Scores cannot exceed 6");
                                return;
                              }

                              updateScore(currentRound, game.id, [
                                team1Score,
                                team2Score,
                              ]);

                              // Clear the input fields
                              team1Input.value = "";
                              team2Input.value = "";
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                          >
                            Save Score
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "standings" && players.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Player Standings
              </h2>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {players
                      .sort((a, b) => b.points - a.points)
                      .map((player, index) => (
                        <tr
                          key={player.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="py-4 px-4 font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="font-medium text-blue-800">
                                  {player.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">
                                  {player.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {player.points}
                              {/* pts */}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setActiveTab("games")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Back to Games
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
