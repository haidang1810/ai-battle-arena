import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { GameType, RecordedMove } from '../types/game-types';
import { CaroEngine } from './replay-engine';

/**
 * Manages replay state: step through recorded moves on a local engine.
 */
export function useReplay(moves: RecordedMove[], gameType: GameType) {
  const [currentTurn, setCurrentTurn] = useState(-1); // -1 = initial empty board
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reconstruct board state at a given turn by replaying moves
  const getBoardAtTurn = useCallback(
    (turn: number): number[][] | string => {
      if (gameType === 'chess') {
        const chess = new Chess();
        for (let i = 0; i <= turn && i < moves.length; i++) {
          chess.move(moves[i].move as string);
        }
        return chess.fen();
      }
      const engine = new CaroEngine();
      for (let i = 0; i <= turn && i < moves.length; i++) {
        engine.makeMove(moves[i].move as string);
      }
      return engine.getBoard();
    },
    [moves, gameType],
  );

  const board = currentTurn >= 0 ? getBoardAtTurn(currentTurn) : getBoardAtTurn(-1);
  const currentMove = currentTurn >= 0 && currentTurn < moves.length ? moves[currentTurn] : null;

  const stepForward = useCallback(() => {
    setCurrentTurn((t) => Math.min(t + 1, moves.length - 1));
  }, [moves.length]);

  const stepBack = useCallback(() => {
    setCurrentTurn((t) => Math.max(t - 1, -1));
  }, []);

  const seekTo = useCallback(
    (turn: number) => {
      setCurrentTurn(Math.max(-1, Math.min(turn, moves.length - 1)));
    },
    [moves.length],
  );

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTurn((t) => {
          if (t >= moves.length - 1) {
            setIsPlaying(false);
            return t;
          }
          return t + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, moves.length]);

  return {
    board,
    currentTurn,
    currentMove,
    isPlaying,
    speed,
    totalMoves: moves.length,
    stepForward,
    stepBack,
    seekTo,
    play,
    pause,
    setSpeed,
  };
}
