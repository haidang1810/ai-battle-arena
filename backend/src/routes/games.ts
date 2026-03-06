import { Router } from 'express';
import type { GameType, PlayerConfig, GameSettings } from '../types/game-types.js';
import { DEFAULT_GAME_SETTINGS } from '../types/game-types.js';
import { GameManager } from '../engine/game-manager.js';
import { listGameRecords, loadGame } from '../storage/game-storage.js';

const router = Router();

// Shared game manager instance — set from index.ts
let gameManager: GameManager;
export function setGameManager(gm: GameManager) {
  gameManager = gm;
}

/** Create a new game session — each player can use a different provider */
router.post('/games', (req, res) => {
  const { gameType, players, settings } = req.body as {
    gameType: GameType;
    players: [PlayerConfig, PlayerConfig];
    settings?: Partial<GameSettings>;
  };

  if (!gameType || !players || players.length !== 2) {
    res.status(400).json({ error: 'gameType and 2 players required' });
    return;
  }

  // Validate each player has providerId, modelId, apiKey
  for (const p of players) {
    if (!p.providerId || !p.modelId || !p.apiKey) {
      res.status(400).json({ error: 'Each player needs providerId, modelId, and apiKey' });
      return;
    }
  }

  const mergedSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...settings };
  const session = gameManager.createGame(gameType, players, mergedSettings);
  res.json({
    id: session.id,
    gameType,
    players: session.players.map((p) => ({
      providerId: p.providerId, modelId: p.modelId, displayName: p.displayName,
    })),
    status: session.status,
  });
});

/** List active game sessions */
router.get('/games', (_req, res) => {
  res.json({ games: gameManager.listGames() });
});

/** Get a specific game session state */
router.get('/games/:id', (req, res) => {
  const session = gameManager.getGame(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json({
    id: session.id,
    gameType: session.engine.gameType,
    players: session.players,
    status: session.status,
    state: session.engine.getPublicState(),
    moves: session.moves,
  });
});

/** List saved game records */
router.get('/records', async (_req, res) => {
  const records = await listGameRecords();
  res.json({ records });
});

/** Get a saved game record for replay */
router.get('/records/:id', async (req, res) => {
  const record = await loadGame(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json(record);
});

export default router;
