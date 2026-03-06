import { useState, useEffect } from 'react';
import type { GameType } from '../../types/game-types';

interface GameSummary {
  id: string;
  gameType: GameType;
  players: [{ modelId: string; displayName: string }, { modelId: string; displayName: string }];
  winner: number | null;
  startTime: number;
  endTime?: number;
  totalMoves: number;
}

interface HistoryPageProps {
  onSelectReplay: (id: string) => void;
  onBack: () => void;
}

export default function HistoryPage({ onSelectReplay, onBack }: HistoryPageProps) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const params = filter ? `?gameType=${filter}` : '';
    fetch(`/api/replays${params}`)
      .then((r) => r.json())
      .then((data) => setGames(data.records))
      .catch(() => {});
  }, [filter]);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white">&larr; Back</button>
        <h2 className="text-2xl font-bold">Match History</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
        >
          <option value="">All games</option>
          <option value="caro">Caro</option>
          <option value="chess">Chess</option>
          <option value="battleship">Battleship</option>
        </select>
      </div>

      {games.length === 0 && (
        <p className="text-gray-500 text-center py-12">No games played yet</p>
      )}

      <div className="space-y-3">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelectReplay(g.id)}
            className="w-full text-left bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg p-4 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {g.players[0].displayName} vs {g.players[1].displayName}
              </span>
              <span className="text-xs text-gray-400 uppercase">{g.gameType}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
              <span>
                {g.winner !== null && g.winner !== undefined
                  ? `Winner: ${g.players[g.winner].displayName}`
                  : 'Draw'}
              </span>
              <span>{g.totalMoves} moves | {new Date(g.startTime).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
