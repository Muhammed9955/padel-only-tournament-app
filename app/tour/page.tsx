"use client";
// pages/index.tsx
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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("padelTournament");
    if (savedData) {
      const data = JSON.parse(savedData);
      setTournamentName(data.tournamentName || "");
      setPlayers(data.players || []);
      setRounds(data.rounds || []);
      setCurrentRound(data.currentRound || 0);
      if (data.players.length > 0) {
        setActiveTab("games");
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
    };
    localStorage.setItem("padelTournament", JSON.stringify(data));
  }, [tournamentName, players, rounds, currentRound]);

  const addPlayers = () => {
    const names = playerNames.split("\n").filter((name) => name.trim() !== "");
    if (names.length !== 24) {
      alert("Please enter exactly 24 players");
      return;
    }

    const newPlayers: Player[] = names.map((name, index) => ({
      id: index + 1,
      name: name.trim(),
      points: 0,
    }));

    setPlayers(newPlayers);
    generateFirstRound(newPlayers);
    setActiveTab("games");
  };

  const generateFirstRound = (playersList: Player[]) => {
    // Simple shuffle function
    const shuffled = [...playersList].sort(() => 0.5 - Math.random());

    const games: Game[] = [];
    for (let i = 0; i < 4; i++) {
      const startIdx = i * 6;
      const team1: Team = {
        id: i * 2 + 1,
        players: [shuffled[startIdx], shuffled[startIdx + 1]],
      };
      const team2: Team = {
        id: i * 2 + 2,
        players: [shuffled[startIdx + 2], shuffled[startIdx + 3]],
      };
      const team3: Team = {
        id: i * 2 + 3,
        players: [shuffled[startIdx + 4], shuffled[startIdx + 5]],
      };

      // Create two games per court with the 6 players assigned to that court
      games.push({
        id: i * 2 + 1,
        court: i + 1,
        team1,
        team2,
        score: null,
      });
    }

    setRounds([{ id: 1, games }]);
    setCurrentRound(1);
  };

  const updateScore = (
    roundId: number,
    gameId: number,
    score: [number, number]
  ) => {
    // Validate score (must be 4-0, 3-1, or 2-2)
    const validScores = [
      [4, 0],
      [0, 4],
      [3, 1],
      [1, 3],
      [2, 2],
    ];

    const isValid = validScores.some(
      ([a, b]) => a === score[0] && b === score[1]
    );

    if (!isValid) {
      alert("Invalid score. Must be 4-0, 3-1, or 2-2");
      return;
    }

    const updatedRounds = rounds.map((round) => {
      if (round.id === roundId) {
        const updatedGames = round.games.map((game) => {
          if (game.id === gameId) {
            return { ...game, score };
          }
          return game;
        });
        return { ...round, games: updatedGames };
      }
      return round;
    });

    setRounds(updatedRounds);
    updatePlayerPoints(updatedRounds);
  };

  const updatePlayerPoints = (updatedRounds: Round[]) => {
    const playerPoints: { [key: number]: number } = {};
    players.forEach((player) => {
      playerPoints[player.id] = 0;
    });

    updatedRounds.forEach((round) => {
      round.games.forEach((game) => {
        if (game.score) {
          // Team 1 players get points equal to their score
          playerPoints[game.team1.players[0].id] += game.score[0];
          playerPoints[game.team1.players[1].id] += game.score[0];

          // Team 2 players get points equal to their score
          playerPoints[game.team2.players[0].id] += game.score[1];
          playerPoints[game.team2.players[1].id] += game.score[1];
        }
      });
    });

    const updatedPlayers = players.map((player) => ({
      ...player,
      points: playerPoints[player.id],
    }));

    setPlayers(updatedPlayers);
  };

  const generateNextRound = () => {
    // Simple rotation algorithm
    const nextRoundId = rounds.length + 1;

    // Rotate players to create new teams
    const rotatedPlayers = [...players];
    const first = rotatedPlayers.shift();
    if (first) rotatedPlayers.push(first);

    const newGames: Game[] = [];
    for (let i = 0; i < 4; i++) {
      const startIdx = i * 6;
      const team1: Team = {
        id: i * 2 + 1 + (nextRoundId - 1) * 8,
        players: [rotatedPlayers[startIdx], rotatedPlayers[startIdx + 1]],
      };
      const team2: Team = {
        id: i * 2 + 2 + (nextRoundId - 1) * 8,
        players: [rotatedPlayers[startIdx + 2], rotatedPlayers[startIdx + 3]],
      };

      newGames.push({
        id: i + 1 + (nextRoundId - 1) * 4,
        court: i + 1,
        team1,
        team2,
        score: null,
      });
    }

    setRounds([...rounds, { id: nextRoundId, games: newGames }]);
    setCurrentRound(nextRoundId);
  };

  const resetTournament = () => {
    setTournamentName("");
    setPlayers([]);
    setPlayerNames("");
    setRounds([]);
    setCurrentRound(0);
    setActiveTab("setup");
    localStorage.removeItem("padelTournament");
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
            }`}
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
            }`}
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
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tournament name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Names (24 players, one per line)
                </label>
                <textarea
                  value={playerNames}
                  onChange={(e) => setPlayerNames(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48"
                  placeholder="Enter 24 player names, one per line"
                />
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
                <h2 className="text-md md:text-2xl font-bold text-gray-800 mb-5 md:mb-0">
                  {tournamentName} - Round {currentRound}
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={generateNextRound}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors  md:text-lg"
                  >
                    Next Round
                  </button>
                  <button
                    onClick={resetTournament}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors  md:text-lg"
                  >
                    Reset Tournament
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rounds
                  .find((round) => round.id === currentRound)
                  ?.games.map((game) => (
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
                            {game.team1.players[0].name} /{" "}
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
                            {game.team2.players[0].name} /{" "}
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
                                max="4"
                                placeholder="0"
                                className="w-16 p-2 border border-gray-300 rounded text-center"
                                id={`team1-score-${game.id}`}
                              />
                              <span className="font-bold text-gray-700">-</span>
                              <input
                                type="number"
                                min="0"
                                max="4"
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

                              updateScore(currentRound, game.id, [
                                team1Score,
                                team2Score,
                              ]);
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
                          <td className="py-4 px-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {player.points}{" "}
                              <span className="hidden md:block">pts</span>
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
