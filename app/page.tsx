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
  const [scoreInputs, setScoreInputs] = useState<{
    [key: number]: [string, string];
  }>({});
  const [editingGame, setEditingGame] = useState<number | null>(null);

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

  // Auto-update court count when player names change (only during setup)
  useEffect(() => {
    if (activeTab === "setup" && players.length === 0) {
      const playerCount = playerNames
        .split("\n")
        .filter((name) => name.trim() !== "").length;
      if (playerCount >= 4 && playerCount <= 24) {
        const minCourts = getMinCourts();
        const maxCourts = getMaxCourts();

        // Only auto-update if current court count is outside the valid range
        if (courtCount < minCourts || courtCount > maxCourts) {
          if (playerCount === 24) {
            // For 24 players, default to 4 courts but allow user to change
            setCourtCount(4);
          } else {
            // Choose the court count that minimizes waiting players
            const courtOptions = getCourtOptionsWithInfo();
            const optimalOption =
              courtOptions.find((option) => option.waiting === 0) ||
              courtOptions[0];
            setCourtCount(optimalOption.courts);
          }
        }
      }
    }
  }, [playerNames, activeTab, players.length]);

  const getMinCourts = () => {
    const playerCount =
      players.length ||
      playerNames.split("\n").filter((name) => name.trim() !== "").length;
    if (playerCount <= 4) return 1;
    if (playerCount <= 8) return 2;
    if (playerCount <= 12) return 3;
    if (playerCount <= 16) return 4;
    if (playerCount <= 20) return 4;
    if (playerCount <= 24) return 4;
    return Math.ceil(playerCount / 4);
  };

  const getMaxCourts = () => {
    const playerCount =
      players.length ||
      playerNames.split("\n").filter((name) => name.trim() !== "").length;
    if (playerCount <= 4) return 1;
    if (playerCount <= 8) return 2;
    if (playerCount <= 12) return 3;
    if (playerCount <= 16) return 4;
    if (playerCount <= 20) return 5;
    if (playerCount <= 24) return 6;
    return Math.min(8, Math.ceil(playerCount / 2));
  };

  // Helper function to calculate waiting players for a given court count
  const calculateWaitingPlayers = (playerCount: number, courtCount: number) => {
    const playersPerCourt = 4;
    const totalCapacity = courtCount * playersPerCourt;
    return Math.max(0, playerCount - totalCapacity);
  };

  // Helper function to get optimal court options with waiting player info
  const getCourtOptionsWithInfo = () => {
    const playerCount =
      players.length ||
      playerNames.split("\n").filter((name) => name.trim() !== "").length;
    const min = getMinCourts();
    const max = getMaxCourts();
    const options = [];

    for (let i = min; i <= max; i++) {
      const waiting = calculateWaitingPlayers(playerCount, i);
      options.push({
        courts: i,
        waiting: waiting,
        games: Math.floor(playerCount / 4),
      });
    }

    return options;
  };

  const getCourtOptions = () => {
    const min = getMinCourts();
    const max = getMaxCourts();
    const options = [];

    for (let i = min; i <= max; i++) {
      options.push(i);
    }

    return options;
  };

  const getCurrentRoundGames = (): Game[] => {
    if (rounds.length === 0) return [];
    const round = rounds.find((r) => r.id === currentRound);
    return round ? round.games : [];
  };

  const generateRoundRobinRound = (
    playersList: Player[],
    roundNumber: number,
    courtCountToUse?: number
  ): Game[] => {
    // Shuffle players for random pairing
    const shuffledPlayers = [...playersList].sort(() => Math.random() - 0.5);

    // Calculate how many players can actually play based on court count
    const playersPerCourt = 4;
    const currentCourtCount = courtCountToUse || courtCount;
    const maxPlayersForCourts = currentCourtCount * playersPerCourt;
    const playersToUse = Math.min(shuffledPlayers.length, maxPlayersForCourts);

    // Only use the players that can actually play
    const playingPlayers = shuffledPlayers.slice(0, playersToUse);

    // Create teams from the players that will actually play
    const teams: Team[] = [];
    for (let i = 0; i < playingPlayers.length; i += 2) {
      if (i + 1 < playingPlayers.length) {
        teams.push({
          id: teams.length + 1,
          players: [playingPlayers[i], playingPlayers[i + 1]],
        });
      }
    }

    // Create games with proper court assignment
    const games: Game[] = [];
    // Use the actual court count chosen by the user
    const availableCourts = currentCourtCount;

    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        games.push({
          id: roundNumber * 100 + i,
          court: (Math.floor(i / 2) % availableCourts) + 1,
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
    groups: Player[][],
    courtCountToUse?: number
  ): Game[] => {
    const currentCourtCount = courtCountToUse || courtCount;
    const playersPerCourt = 4;
    const maxPlayersForCourts = currentCourtCount * playersPerCourt;

    // For 24 players with more than 4 courts, use all players instead of groups
    if (currentCourtCount > 4) {
      // Use all 24 players for larger court counts
      const allPlayers = groups.flat();
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      const playersToUse = Math.min(
        shuffledPlayers.length,
        maxPlayersForCourts
      );
      const playingPlayers = shuffledPlayers.slice(0, playersToUse);

      // Create teams from the players that will actually play
      const teams: Team[] = [];
      for (let i = 0; i < playingPlayers.length; i += 2) {
        if (i + 1 < playingPlayers.length) {
          teams.push({
            id: teams.length + 1,
            players: [playingPlayers[i], playingPlayers[i + 1]],
          });
        }
      }

      // Create games with proper court assignment
      const games: Game[] = [];
      const availableCourts = currentCourtCount;

      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          games.push({
            id: roundNumber * 100 + i,
            court: (Math.floor(i / 2) % availableCourts) + 1,
            team1: teams[i],
            team2: teams[i + 1],
            score: null,
          });
        }
      }

      return games;
    }

    // Original group-based logic for 4 courts or fewer
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

    // Calculate how many players can actually play based on court count
    const playersToUse = Math.min(shuffledPlayers.length, maxPlayersForCourts);

    // Only use the players that can actually play
    const playingPlayers = shuffledPlayers.slice(0, playersToUse);

    // Create teams from the players that will actually play
    const teams: Team[] = [];
    for (let i = 0; i < playingPlayers.length; i += 2) {
      if (i + 1 < playingPlayers.length) {
        teams.push({
          id: teams.length + 1,
          players: [playingPlayers[i], playingPlayers[i + 1]],
        });
      }
    }

    // Create games with proper court assignment
    const games: Game[] = [];
    // Use the actual court count chosen by the user
    const availableCourts = currentCourtCount;

    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        games.push({
          id: roundNumber * 100 + i,
          court: (Math.floor(i / 2) % availableCourts) + 1,
          team1: teams[i],
          team2: teams[i + 1],
          score: null,
        });
      }
    }

    return games;
  };

  // Add this function to handle court count changes
  const handleCourtCountChange = (newCourtCount: number) => {
    setCourtCount(newCourtCount);

    // For 24 players, regenerate all rounds with new court count
    if (players.length === 24 && rounds.length > 0) {
      const updatedRounds = rounds.map((round) => {
        const newGames = generateGroupBasedRound(
          round.id,
          groups,
          newCourtCount
        );
        return { ...round, games: newGames };
      });
      setRounds(updatedRounds);
    } else if (rounds.length > 0) {
      // For other player counts, just update court assignments
      const updatedRounds = rounds.map((round) => {
        const updatedGames = round.games.map((game, index) => ({
          ...game,
          court: (index % newCourtCount) + 1,
        }));
        return { ...round, games: updatedGames };
      });
      setRounds(updatedRounds);
    }
  };

  const updateScore = (
    roundId: number,
    gameId: number,
    score: [number, number],
    isEditing: boolean = false
  ) => {
    const [score1, score2] = score;

    // Validate scores (0-6 range)
    if (score1 < 0 || score1 > 6 || score2 < 0 || score2 > 6) {
      alert("Scores must be between 0 and 6");
      return;
    }

    if (score1 === score2) {
      alert("Scores cannot be equal");
      return;
    }

    // Determine points based on games won (Padelution style)
    // Each player gets points equal to the number of games their team won
    const team1Points = score1;
    const team2Points = score2;

    // Update the game score and player points
    setRounds((prevRounds) => {
      return prevRounds.map((round) => {
        if (round.id === roundId) {
          const updatedGames = round.games.map((game) => {
            if (game.id === gameId) {
              // If editing, subtract the old points first
              let updatedPlayers = [...players];

              if (isEditing && game.score) {
                const [oldScore1, oldScore2] = game.score;

                // Subtract old points
                updatedPlayers = updatedPlayers.map((player) => {
                  // Check if player was in team1
                  if (game.team1.players.some((p) => p.id === player.id)) {
                    return {
                      ...player,
                      points: player.points - oldScore1,
                    };
                  }

                  // Check if player was in team2
                  if (game.team2.players.some((p) => p.id === player.id)) {
                    return {
                      ...player,
                      points: player.points - oldScore2,
                    };
                  }

                  return player;
                });
              }

              // Add new points
              updatedPlayers = updatedPlayers.map((player) => {
                // Check if player is in team1
                if (game.team1.players.some((p) => p.id === player.id)) {
                  return {
                    ...player,
                    points: player.points + team1Points,
                  };
                }

                // Check if player is in team2
                if (game.team2.players.some((p) => p.id === player.id)) {
                  return {
                    ...player,
                    points: player.points + team2Points,
                  };
                }

                return player;
              });

              // Update the players state
              setPlayers(updatedPlayers);

              // Update the team players with the new points
              const updatedTeam1Players = game.team1.players.map((player) => {
                const updatedPlayer = updatedPlayers.find(
                  (p) => p.id === player.id
                );
                return updatedPlayer || player;
              }) as [Player, Player];

              const updatedTeam2Players = game.team2.players.map((player) => {
                const updatedPlayer = updatedPlayers.find(
                  (p) => p.id === player.id
                );
                return updatedPlayer || player;
              }) as [Player, Player];

              return {
                ...game,
                score,
                team1: {
                  ...game.team1,
                  players: updatedTeam1Players,
                },
                team2: {
                  ...game.team2,
                  players: updatedTeam2Players,
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

    // Clear the score inputs for this game and exit edit mode
    setScoreInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[gameId];
      return newInputs;
    });

    setEditingGame(null);
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
    setScoreInputs({});
    setEditingGame(null);
    localStorage.removeItem("padelTournament");
  };

  const generateFirstRound = (
    playersList: Player[],
    courtCountToUse?: number
  ) => {
    const games = generateRoundRobinRound(playersList, 1, courtCountToUse);
    setRounds([{ id: 1, games }]);
    setCurrentRound(1);
  };

  const generateFirstRoundWithGroups = (
    groups: Player[][],
    courtCountToUse?: number
  ) => {
    const games = generateGroupBasedRound(1, groups, courtCountToUse);
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

    // Use the court count that the user has already selected
    let courtCountToUse: number;
    if (newPlayers.length === 24) {
      // For 24 players, use the user's selected court count (4, 5, or 6)
      courtCountToUse = courtCount;
      // Don't override the user's selection
    } else {
      // For other player counts, set to minimum courts required
      const minCourts = getMinCourts();
      courtCountToUse = minCourts;
      setCourtCount(minCourts);
    }

    if (newPlayers.length === 24) {
      // Create three random groups of 8 players
      const shuffledPlayers = [...newPlayers].sort(() => Math.random() - 0.5);
      const groupSize = 8;
      const newGroups = [
        shuffledPlayers.slice(0, groupSize),
        shuffledPlayers.slice(groupSize, groupSize * 2),
        shuffledPlayers.slice(groupSize * 2),
      ];
      setGroups(newGroups);
      generateFirstRoundWithGroups(newGroups, courtCountToUse);
    } else {
      generateFirstRound(newPlayers, courtCountToUse);
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
      newGames = generateGroupBasedRound(nextRoundId, groups, courtCount);
    } else {
      newGames = generateRoundRobinRound(players, nextRoundId, courtCount);
    }

    setRounds([...rounds, { id: nextRoundId, games: newGames }]);
    setCurrentRound(nextRoundId);
  };

  const handleScoreInputChange = (
    gameId: number,
    teamIndex: number,
    value: string
  ) => {
    // Only allow numbers and empty string
    if (value !== "" && !/^\d+$/.test(value)) return;

    // Don't allow values greater than 6
    if (value !== "" && parseInt(value) > 6) return;

    setScoreInputs((prev) => {
      const currentScores = prev[gameId] || ["", ""];
      const newScores = [...currentScores] as [string, string];
      newScores[teamIndex] = value;

      return {
        ...prev,
        [gameId]: newScores,
      };
    });
  };

  const startEditingScore = (gameId: number) => {
    const game = getCurrentRoundGames().find((g) => g.id === gameId);
    if (game && game.score) {
      setScoreInputs((prev) => ({
        ...prev,
        [gameId]: [String(game.score![0]), String(game.score![1])],
      }));
      setEditingGame(gameId);
    }
  };

  const cancelEditing = () => {
    setEditingGame(null);
    setScoreInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[editingGame!];
      return newInputs;
    });
  };

  // Calculate total games played by a player
  const getGamesPlayed = (playerId: number) => {
    let count = 0;
    rounds.forEach((round) => {
      round.games.forEach((game) => {
        if (game.score) {
          if (
            game.team1.players.some((p) => p.id === playerId) ||
            game.team2.players.some((p) => p.id === playerId)
          ) {
            count++;
          }
        }
      });
    });
    return count;
  };

  // Calculate waiting players for current round
  const getCurrentRoundWaitingPlayers = () => {
    const games = getCurrentRoundGames();
    const playingPlayers = new Set<number>();

    games.forEach((game) => {
      game.team1.players.forEach((player) => playingPlayers.add(player.id));
      game.team2.players.forEach((player) => playingPlayers.add(player.id));
    });

    return players.filter((player) => !playingPlayers.has(player.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Padel Tournament Manager
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Organize and track your padel tournament with ease
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`py-3 px-4 sm:py-4 sm:px-6 font-medium text-sm sm:text-base ${
              activeTab === "setup"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("setup")}
          >
            Tournament Setup
          </button>
          <button
            className={`py-3 px-4 sm:py-4 sm:px-6 font-medium text-sm sm:text-base ${
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
            className={`py-3 px-4 sm:py-4 sm:px-6 font-medium text-sm sm:text-base ${
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

        <div className="p-4 sm:p-6">
          {activeTab === "setup" && (
            <div className="space-y-4 sm:space-y-6">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 sm:h-48"
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
                  onChange={(e) =>
                    handleCourtCountChange(parseInt(e.target.value))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {getCourtOptionsWithInfo().map((option) => (
                    <option key={option.courts} value={option.courts}>
                      {option.courts} court{option.courts > 1 ? "s" : ""}
                      {option.waiting > 0
                        ? ` (${option.waiting} waiting)`
                        : " (0 waiting)"}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {players.length === 24
                    ? "Court count can be 4, 5, or 6 for 24 players"
                    : `Minimum: ${getMinCourts()} court${
                        getMinCourts() > 1 ? "s" : ""
                      }, Maximum: ${getMaxCourts()} court${
                        getMaxCourts() > 1 ? "s" : ""
                      }`}
                </p>
                {playerNames.split("\n").filter((name) => name.trim() !== "")
                  .length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    {(() => {
                      const playerCount = playerNames
                        .split("\n")
                        .filter((name) => name.trim() !== "").length;
                      const waitingPlayers = calculateWaitingPlayers(
                        playerCount,
                        courtCount
                      );
                      const gamesPerRound = Math.floor(playerCount / 4);

                      if (playerCount < 4) {
                        return `Need at least 4 players to start a tournament`;
                      } else if (waitingPlayers > 0) {
                        return `${waitingPlayers} player${
                          waitingPlayers > 1 ? "s" : ""
                        } will wait each round (${gamesPerRound} games per round)`;
                      } else {
                        return `Perfect! All ${playerCount} players will play each round (${gamesPerRound} games per round)`;
                      }
                    })()}
                  </p>
                )}
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
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {tournamentName} - Round {currentRound}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {currentRound > 1 && (
                    <button
                      onClick={goToPreviousRound}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Previous Round
                    </button>
                  )}
                  <button
                    onClick={generateNextRound}
                    disabled={getCurrentRoundGames().some(
                      (game) => !game.score
                    )}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Next Round
                  </button>
                  <button
                    onClick={resetTournament}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Reset Tournament
                  </button>
                </div>
              </div>

              {getCurrentRoundWaitingPlayers().length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800">
                    Waiting Players
                  </h3>
                  <p className="text-yellow-700">
                    {getCurrentRoundWaitingPlayers()
                      .map((p) => p.name)
                      .join(", ")}
                  </p>
                </div>
              )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {getCurrentRoundGames().map((game) => {
                    const currentScores =
                      scoreInputs[game.id] ||
                      (game.score
                        ? [String(game.score[0]), String(game.score[1])]
                        : ["", ""]);
                    const isEditing = editingGame === game.id;

                    return (
                      <div
                        key={game.id}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                            Court {game.court}
                          </h3>
                          {game.score && !isEditing && (
                            <div className="flex items-center space-x-2">
                              <span className="bg-blue-100 text-blue-800 py-1 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-medium">
                                Completed
                              </span>
                              <button
                                onClick={() => startEditingScore(game.id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-medium"
                              >
                                Edit Score
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <span className="font-medium text-gray-700 text-sm sm:text-base">
                              {game.team1.players[0].name} &{" "}
                              {game.team1.players[1].name}
                            </span>
                            {game.score && !isEditing && (
                              <span className="text-base sm:text-lg font-bold text-gray-900">
                                {game.score[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-sm sm:text-base">
                              {game.team2.players[0].name} &{" "}
                              {game.team2.players[1].name}
                            </span>
                            {game.score && !isEditing && (
                              <span className="text-base sm:text-lg font-bold text-gray-900">
                                {game.score[1]}
                              </span>
                            )}
                          </div>

                          <div className="text-center text-xs text-gray-500 mt-2 sm:mt-3">
                            VS
                          </div>
                        </div>

                        {(!game.score || isEditing) && (
                          <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-gray-700 text-sm sm:text-base">
                                Set Score (0-6):
                              </span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="6"
                                  placeholder="0"
                                  className="w-14 sm:w-16 p-2 border border-gray-300 rounded text-center text-sm sm:text-base"
                                  value={currentScores[0]}
                                  onChange={(e) =>
                                    handleScoreInputChange(
                                      game.id,
                                      0,
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="font-bold text-gray-700">
                                  -
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="6"
                                  placeholder="0"
                                  className="w-14 sm:w-16 p-2 border border-gray-300 rounded text-center text-sm sm:text-base"
                                  value={currentScores[1]}
                                  onChange={(e) =>
                                    handleScoreInputChange(
                                      game.id,
                                      1,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="mb-3 text-xs sm:text-sm text-gray-600">
                              <p>
                                Points are awarded based on games won and
                                accumulate across all rounds:
                              </p>
                              <p>
                                • Each player gets points equal to games their
                                team won
                              </p>
                              <p>
                                • Example: 3-1 score → Winners get 3 pts each,
                                Losers get 1 pt each
                              </p>
                              <p>• These points accumulate across all rounds</p>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const score1 = parseInt(currentScores[0]);
                                  const score2 = parseInt(currentScores[1]);

                                  if (isNaN(score1) || isNaN(score2)) {
                                    alert("Please enter valid scores");
                                    return;
                                  }

                                  updateScore(
                                    currentRound,
                                    game.id,
                                    [score1, score2],
                                    isEditing
                                  );
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                              >
                                {isEditing ? "Update Score" : "Save Score"}
                              </button>

                              {isEditing && (
                                <button
                                  onClick={cancelEditing}
                                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "standings" && players.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Player Standings
              </h2>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] sm:min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Rank
                        </th>
                        <th className="py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
                          Player
                        </th>
                        <th className="py-3 px-2  text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24 ">
                          Games
                        </th>
                        <th className="py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ">
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
                            <td className="py-3 px-5 font-medium text-gray-900 whitespace-nowrap w-20">
                              {index + 1}
                            </td>
                            <td className="py-3  whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-2 sm:ml-4">
                                  <div className="font-medium text-gray-900 text-sm sm:text-base">
                                    {player.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                              <span className="text-sm sm:text-base">
                                {getGamesPlayed(player.id)}
                              </span>
                            </td>
                            <td className="py-3 px-2 sm:px-4 whitespace-nowrap ">
                              <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                                {player.points} pts
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center mt-4 sm:mt-6">
                <button
                  onClick={() => setActiveTab("games")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm sm:text-base"
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
