import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { PublicGameState, RecordedMove, PlayerConfig, PlayerIndex, SessionStatus } from '../types/game-types.js';

export interface GameState {
  id: string;
  status: SessionStatus;
  state: PublicGameState | null;
  moves: RecordedMove[];
  players: [PlayerConfig, PlayerConfig] | null;
  thinkingPlayer: PlayerIndex | null;
  error: string | null;
}

const INITIAL_STATE: GameState = {
  id: '',
  status: 'waiting',
  state: null,
  moves: [],
  players: null,
  thinkingPlayer: null,
  error: null,
};

/**
 * Manages game state from WebSocket events.
 */
export function useGameState(socket: Socket | null, gameId: string) {
  const [game, setGame] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.emit('game:join', gameId);

    const handlers = {
      'game:state': (data: { id: string; status: SessionStatus; state: PublicGameState; moves: RecordedMove[]; players: [PlayerConfig, PlayerConfig] }) => {
        setGame({ ...INITIAL_STATE, ...data, thinkingPlayer: null, error: null });
      },
      'game:started': (data: { id: string; players: [PlayerConfig, PlayerConfig]; state: PublicGameState }) => {
        setGame((prev) => ({ ...prev, id: data.id, players: data.players, state: data.state, status: 'playing' }));
      },
      'game:turnStart': (data: { player: PlayerIndex }) => {
        setGame((prev) => ({ ...prev, thinkingPlayer: data.player }));
      },
      'game:moveExecuted': (data: { move: RecordedMove; state: PublicGameState }) => {
        setGame((prev) => ({
          ...prev,
          state: data.state,
          moves: [...prev.moves, data.move],
          thinkingPlayer: null,
        }));
      },
      'game:ended': (data: { winner: PlayerIndex | null; moves: RecordedMove[]; state: PublicGameState }) => {
        setGame((prev) => ({ ...prev, state: data.state, moves: data.moves, status: 'finished', thinkingPlayer: null }));
      },
      'game:forfeit': (data: { player: PlayerIndex; reason: string }) => {
        setGame((prev) => ({ ...prev, status: 'finished', thinkingPlayer: null, error: `Player ${data.player + 1} forfeited: ${data.reason}` }));
      },
      'game:error': (data: { error: string }) => {
        setGame((prev) => ({ ...prev, error: data.error, thinkingPlayer: null }));
      },
    };

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler as (...args: unknown[]) => void);
    }

    return () => {
      for (const event of Object.keys(handlers)) {
        socket.off(event);
      }
    };
  }, [socket, gameId]);

  const pause = useCallback(() => socket?.emit('game:pause', gameId), [socket, gameId]);
  const resume = useCallback(() => socket?.emit('game:resume', gameId), [socket, gameId]);
  const nextStep = useCallback(() => socket?.emit('game:nextStep', gameId), [socket, gameId]);
  const reset = useCallback(() => {
    socket?.emit('game:reset', gameId);
    setGame(INITIAL_STATE);
  }, [socket, gameId]);

  return { game, pause, resume, nextStep, reset };
}
