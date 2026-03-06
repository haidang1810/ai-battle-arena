import type { Server } from 'socket.io';
import type { PlayerIndex } from '../types/game-types.js';
import { GameSession } from '../engine/game-session.js';
import { providerRegistry } from './providers/provider-registry.js';
import { AIPlayerContext } from './ai-player.js';
import { saveGame } from '../storage/game-storage.js';
import { invalidateStatsCache } from './stats-service.js';
import pino from 'pino';

const logger = pino({ name: 'game-loop' });

/**
 * Run the game loop for a session.
 * Each player has a persistent AIPlayerContext that maintains conversation history.
 */
export async function runGameLoop(
  session: GameSession,
  io: Server,
): Promise<void> {
  // Create persistent AI contexts per player (conversation persists across turns)
  const aiContexts: [AIPlayerContext, AIPlayerContext] = [
    new AIPlayerContext(
      providerRegistry.create(session.players[0].providerId, session.players[0].apiKey ?? ''),
      session.players[0].modelId,
      session.engine,
      0,
    ),
    new AIPlayerContext(
      providerRegistry.create(session.players[1].providerId, session.players[1].apiKey ?? ''),
      session.players[1].modelId,
      session.engine,
      1,
    ),
  ];

  const room = `game:${session.id}`;

  io.to(room).emit('game:started', {
    id: session.id,
    players: session.players.map((p) => ({ providerId: p.providerId, modelId: p.modelId, displayName: p.displayName })),
    state: session.engine.getPublicState(),
  });

  while (!session.engine.isFinished() && session.status === 'playing') {
    const playerIndex = session.engine.getCurrentPlayer();
    const player = session.players[playerIndex];
    const aiContext = aiContexts[playerIndex];

    io.to(room).emit('game:turnStart', {
      player: playerIndex,
      turn: session.turn,
      modelId: player.modelId,
      providerId: player.providerId,
    });

    // Wait if paused
    while (session.status as string === 'paused') {
      await new Promise((r) => setTimeout(r, 500));
    }
    if (session.status as string !== 'playing') break;

    await session.waitForStep();

    try {
      const result = await aiContext.requestMove(
        session.engine,
        session.settings.maxInvalidMoves,
      );

      if (!result.moveResult.valid) {
        const winner = (playerIndex === 0 ? 1 : 0) as PlayerIndex;
        io.to(room).emit('game:forfeit', {
          player: playerIndex,
          reason: result.moveResult.reason,
          winner,
        });
        session.setStatus('finished');
        break;
      }

      const recorded = session.recordMove(
        playerIndex,
        result.move,
        result.thinkingTimeMs,
        result.tokensUsed,
        result.costEstimate,
        result.thinkingLog,
        result.invalidAttempts > 0,
        result.invalidAttempts,
      );

      io.to(room).emit('game:moveExecuted', {
        move: recorded,
        state: session.engine.getPublicState(),
      });

      if (result.moveResult.gameOver) {
        session.setStatus('finished');
        io.to(room).emit('game:ended', {
          winner: result.moveResult.winner,
          moves: session.moves,
          state: session.engine.getPublicState(),
        });
        break;
      }

      if (session.settings.delayBetweenTurnsMs > 0) {
        await new Promise((r) => setTimeout(r, session.settings.delayBetweenTurnsMs));
      }
    } catch (error) {
      logger.error({ error, sessionId: session.id }, 'Error during AI turn');
      io.to(room).emit('game:error', { player: playerIndex, error: String(error) });
      session.setStatus('finished');
      break;
    }
  }

  try {
    await saveGame(session.toGameRecord());
    invalidateStatsCache();
    logger.info({ sessionId: session.id }, 'Game record saved');
  } catch (error) {
    logger.error({ error, sessionId: session.id }, 'Failed to save game record');
  }
}
