import { listGameRecords } from '../storage/game-storage.js';
import type { GameRecord, GameType } from '../types/game-types.js';

export interface ModelStats {
  modelId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  forfeits: number;
  avgThinkingTimeMs: number;
  totalTokens: number;
  totalCost: number;
  totalInvalidMoves: number;
  gameTypes: Record<string, number>; // count per game type
}

/** Cache with TTL */
let cache: { stats: ModelStats[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

/** Aggregate stats from all game records, grouped by modelId */
export async function getModelStats(): Promise<ModelStats[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.stats;
  }

  const records = await listGameRecords();
  const statsMap = new Map<string, ModelStats>();

  const getOrCreate = (modelId: string): ModelStats => {
    let s = statsMap.get(modelId);
    if (!s) {
      s = {
        modelId,
        gamesPlayed: 0, wins: 0, losses: 0, draws: 0, forfeits: 0,
        avgThinkingTimeMs: 0, totalTokens: 0, totalCost: 0, totalInvalidMoves: 0,
        gameTypes: {},
      };
      statsMap.set(modelId, s);
    }
    return s;
  };

  for (const record of records) {
    for (const playerIdx of [0, 1] as const) {
      const player = record.players[playerIdx];
      const s = getOrCreate(player.modelId);
      s.gamesPlayed++;
      s.gameTypes[record.gameType] = (s.gameTypes[record.gameType] || 0) + 1;

      if (record.winner === playerIdx) s.wins++;
      else if (record.winner === null || record.winner === undefined) s.draws++;
      else s.losses++;

      // Aggregate move stats for this player
      const playerMoves = record.moves.filter((m) => m.player === playerIdx);
      for (const m of playerMoves) {
        s.totalTokens += m.tokensUsed;
        s.totalCost += m.costEstimate;
        s.avgThinkingTimeMs += m.thinkingTimeMs;
        if (m.wasInvalid) s.totalInvalidMoves += m.invalidAttempts;
      }
    }
  }

  // Finalize averages
  for (const s of statsMap.values()) {
    if (s.gamesPlayed > 0) {
      s.avgThinkingTimeMs = Math.round(s.avgThinkingTimeMs / s.gamesPlayed);
    }
  }

  const stats = Array.from(statsMap.values()).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  cache = { stats, timestamp: Date.now() };
  return stats;
}

/** Invalidate cache (call after saving a new game) */
export function invalidateStatsCache() {
  cache = null;
}
