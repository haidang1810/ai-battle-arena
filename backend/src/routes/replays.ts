import { Router } from 'express';
import { listGameRecords, loadGame } from '../storage/game-storage.js';
import type { GameType } from '../types/game-types.js';

const router = Router();

/** List game records with optional filtering */
router.get('/replays', async (req, res) => {
  try {
    const gameType = req.query.gameType as GameType | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    let records = await listGameRecords();
    if (gameType) {
      records = records.filter((r) => r.gameType === gameType);
    }

    // Return summaries (without full move thinking logs for list view)
    const summaries = records.slice(offset, offset + limit).map((r) => ({
      id: r.id,
      gameType: r.gameType,
      players: r.players,
      winner: r.winner,
      startTime: r.startTime,
      endTime: r.endTime,
      totalMoves: r.moves.length,
    }));

    res.json({ records: summaries, total: records.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list records' });
  }
});

/** Get full game record for replay */
router.get('/replays/:id', async (req, res) => {
  const record = await loadGame(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json(record);
});

/** Export game record as downloadable JSON */
router.get('/replays/:id/export', async (req, res) => {
  const record = await loadGame(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.setHeader('Content-Disposition', `attachment; filename="game-${record.id}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(record, null, 2));
});

export default router;
