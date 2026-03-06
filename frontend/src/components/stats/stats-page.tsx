import { useState, useEffect } from 'react';

interface ModelStats {
  modelId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  avgThinkingTimeMs: number;
  totalTokens: number;
  totalInvalidMoves: number;
  gameTypes: Record<string, number>;
}

interface StatsPageProps {
  onBack: () => void;
}

export default function StatsPage({ onBack }: StatsPageProps) {
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => { setStats(data.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const winRate = (s: ModelStats) =>
    s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white">&larr; Back</button>
        <h2 className="text-xl font-bold">Model Stats</h2>
        <div />
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Loading stats...</p>}

      {!loading && stats.length === 0 && (
        <p className="text-center text-gray-500 py-8">No games played yet</p>
      )}

      {!loading && stats.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3 text-center">Games</th>
                <th className="py-2 px-3 text-center">W/L/D</th>
                <th className="py-2 px-3 text-center">Win %</th>
                <th className="py-2 px-3 text-center">Avg Think</th>
                <th className="py-2 px-3 text-center">Tokens</th>
                <th className="py-2 px-3 text-center">Invalid</th>
                <th className="py-2 px-3">Games</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.modelId} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-2 px-3 font-mono text-xs max-w-48 truncate" title={s.modelId}>
                    {s.modelId.split('/').pop() || s.modelId}
                  </td>
                  <td className="py-2 px-3 text-center">{s.gamesPlayed}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-green-400">{s.wins}</span>/
                    <span className="text-red-400">{s.losses}</span>/
                    <span className="text-gray-400">{s.draws}</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${winRate(s)}%` }}
                        />
                      </div>
                      <span className="text-xs">{winRate(s)}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center text-xs">
                    {(s.avgThinkingTimeMs / 1000).toFixed(1)}s
                  </td>
                  <td className="py-2 px-3 text-center text-xs font-mono">
                    {s.totalTokens.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {s.totalInvalidMoves > 0 ? (
                      <span className="text-yellow-500">{s.totalInvalidMoves}</span>
                    ) : (
                      <span className="text-gray-600">0</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">
                    {Object.entries(s.gameTypes).map(([type, count]) => `${type}(${count})`).join(' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
