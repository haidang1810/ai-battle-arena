import { GameSession } from './game-session.js';
import type { GameEngine } from './game-engine-interface.js';
import type { GameSettings, GameType, PlayerConfig, DEFAULT_GAME_SETTINGS } from '../types/game-types.js';
import { CaroEngine } from '../games/caro/caro-engine.js';
import { ChessEngine } from '../games/chess/chess-engine.js';
import { BattleshipEngine } from '../games/battleship/battleship-engine.js';
import { JungleEngine } from '../games/jungle/jungle-engine.js';

/** Factory to create game engines by type */
function createEngine(gameType: GameType): GameEngine {
  switch (gameType) {
    case 'caro':
      return new CaroEngine();
    case 'chess':
      return new ChessEngine();
    case 'battleship':
      return new BattleshipEngine();
    case 'jungle':
      return new JungleEngine();
    default:
      throw new Error(`Game type "${gameType}" not implemented yet`);
  }
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes after finish

/**
 * Manages all active game sessions.
 * Auto-cleans finished sessions after TTL.
 */
export class GameManager {
  private sessions = new Map<string, GameSession>();

  constructor() {
    // Cleanup timer every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.status === 'finished') {
        const lastMove = session.moves[session.moves.length - 1];
        if (lastMove && now - lastMove.timestamp > SESSION_TTL_MS) {
          this.sessions.delete(id);
        }
      }
    }
  }

  createGame(
    gameType: GameType,
    players: [PlayerConfig, PlayerConfig],
    settings: GameSettings,
  ): GameSession {
    const engine = createEngine(gameType);
    const session = new GameSession(engine, players, settings);
    this.sessions.set(session.id, session);
    return session;
  }

  getGame(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  listGames(): Array<{ id: string; gameType: GameType; status: string; players: [PlayerConfig, PlayerConfig] }> {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      gameType: s.engine.gameType,
      status: s.status,
      players: s.players,
    }));
  }

  removeGame(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.stop();
      this.sessions.delete(id);
    }
  }
}
