import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import type { GameEngine } from './game-engine-interface.js';
import type {
  GameSettings,
  PlayerConfig,
  PlayerIndex,
  RecordedMove,
  GameRecord,
  DEFAULT_GAME_SETTINGS,
} from '../types/game-types.js';

export type SessionStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface SessionEvents {
  turnStart: (player: PlayerIndex, turn: number) => void;
  moveExecuted: (move: RecordedMove) => void;
  invalidMove: (player: PlayerIndex, reason: string, attempt: number) => void;
  gameEnd: (winner: PlayerIndex | null) => void;
  statusChange: (status: SessionStatus) => void;
  error: (error: Error) => void;
}

/**
 * Manages one game's lifecycle: turn loop, controls, move recording.
 * Emits events for WebSocket layer to pick up.
 */
export class GameSession extends EventEmitter {
  readonly id: string;
  status: SessionStatus = 'waiting';
  moves: RecordedMove[] = [];
  turn = 0;

  private abortController: AbortController | null = null;
  private stepResolve: (() => void) | null = null;

  constructor(
    readonly engine: GameEngine,
    readonly players: [PlayerConfig, PlayerConfig],
    readonly settings: GameSettings,
  ) {
    super();
    this.id = randomUUID();
  }

  /**
   * Record a move result into the session history.
   */
  recordMove(
    player: PlayerIndex,
    move: unknown,
    thinkingTimeMs: number,
    tokensUsed: number,
    costEstimate: number,
    thinkingLog: string,
    wasInvalid: boolean,
    invalidAttempts: number,
  ): RecordedMove {
    const recorded: RecordedMove = {
      turn: this.turn,
      player,
      move,
      timestamp: Date.now(),
      thinkingTimeMs,
      tokensUsed,
      costEstimate,
      thinkingLog,
      wasInvalid,
      invalidAttempts,
    };
    this.moves.push(recorded);
    this.turn++;
    return recorded;
  }

  setStatus(status: SessionStatus) {
    this.status = status;
    this.emit('statusChange', status);
  }

  pause() {
    if (this.status === 'playing') {
      this.setStatus('paused');
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.setStatus('playing');
    }
  }

  /**
   * For step-by-step mode: resolve the step promise to advance.
   */
  nextStep() {
    if (this.stepResolve) {
      this.stepResolve();
      this.stepResolve = null;
    }
  }

  /**
   * Wait for user to click "next" in step-by-step mode.
   */
  async waitForStep(): Promise<void> {
    if (!this.settings.stepByStep) return;
    return new Promise<void>((resolve) => {
      this.stepResolve = resolve;
    });
  }

  stop() {
    this.abortController?.abort();
    this.setStatus('finished');
  }

  resetGame() {
    this.stop();
    this.engine.reset();
    this.moves = [];
    this.turn = 0;
    this.setStatus('waiting');
  }

  toGameRecord(): GameRecord {
    return {
      id: this.id,
      gameType: this.engine.gameType,
      players: this.players,
      moves: this.moves,
      startTime: this.moves[0]?.timestamp ?? Date.now(),
      endTime: this.moves[this.moves.length - 1]?.timestamp,
      winner: this.engine.getWinner(),
      settings: this.settings,
    };
  }
}
