import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import apiKeyRouter from './routes/api-key.js';
import modelsRouter from './routes/models.js';
import gamesRouter, { setGameManager } from './routes/games.js';
import replaysRouter from './routes/replays.js';
import statsRouter from './routes/stats.js';
import { GameManager } from './engine/game-manager.js';
import { runGameLoop } from './services/game-loop.js';

const logger = pino({
  transport: config.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const gameManager = new GameManager();
setGameManager(gameManager);

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', apiKeyRouter);
app.use('/api', modelsRouter);
app.use('/api', gamesRouter);
app.use('/api', replaysRouter);
app.use('/api', statsRouter);

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('game:join', (gameId: string) => {
    socket.join(`game:${gameId}`);
    const session = gameManager.getGame(gameId);
    if (session) {
      socket.emit('game:state', {
        id: session.id,
        status: session.status,
        state: session.engine.getPublicState(),
        moves: session.moves,
        players: session.players.map((p) => ({
          providerId: p.providerId, modelId: p.modelId, displayName: p.displayName,
        })),
      });
    }
  });

  /** Start game — each player already has providerId + apiKey in their config */
  socket.on('game:start', async (data: { gameId: string }) => {
    const session = gameManager.getGame(data.gameId);
    if (!session) {
      socket.emit('game:error', { error: 'Game not found' });
      return;
    }
    if (session.status !== 'waiting') {
      socket.emit('game:error', { error: 'Game already started' });
      return;
    }

    // Verify both players have API keys
    for (const p of session.players) {
      if (!p.apiKey) {
        socket.emit('game:error', { error: `Missing API key for ${p.displayName}` });
        return;
      }
    }

    session.setStatus('playing');
    runGameLoop(session, io).catch((error) => {
      logger.error({ error, gameId: data.gameId }, 'Game loop failed');
    });
  });

  socket.on('game:pause', (gameId: string) => {
    const session = gameManager.getGame(gameId);
    if (session) {
      session.pause();
      io.to(`game:${gameId}`).emit('game:statusChange', { status: session.status });
    }
  });

  socket.on('game:resume', (gameId: string) => {
    const session = gameManager.getGame(gameId);
    if (session) {
      session.resume();
      io.to(`game:${gameId}`).emit('game:statusChange', { status: session.status });
    }
  });

  socket.on('game:nextStep', (gameId: string) => {
    gameManager.getGame(gameId)?.nextStep();
  });

  socket.on('game:reset', (gameId: string) => {
    gameManager.getGame(gameId)?.resetGame();
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

httpServer.listen(config.PORT, () => {
  logger.info(`AI Battle Arena server running on port ${config.PORT}`);
});

export { app, io, httpServer };
