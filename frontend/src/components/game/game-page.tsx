import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { SessionStatus } from '../../types/game-types';
import { useGameState } from '../../hooks/use-game-state';
import CaroBoard from './caro-board';
import ChessBoard from './chess-board';
import BattleshipBoard from './battleship-board';
import JungleBoard from './jungle-board';
import MoveHistory from './move-history';
import GameControls from './game-controls';

interface GamePageProps {
  socket: Socket | null;
  gameId: string;
  onBack: () => void;
  onGameStatusChange?: (status: SessionStatus) => void;
}

export default function GamePage({ socket, gameId, onBack, onGameStatusChange }: GamePageProps) {
  const { game, pause, resume, nextStep, reset } = useGameState(socket, gameId);

  useEffect(() => {
    onGameStatusChange?.(game.status);
  }, [game.status, onGameStatusChange]);
  const [stepByStep, setStepByStep] = useState(false);
  const [delayMs, setDelayMs] = useState(1000);
  const [started, setStarted] = useState(false);

  const startGame = () => {
    socket?.emit('game:start', { gameId });
    setStarted(true);
  };

  const playerNames: [string, string] = game.players
    ? [game.players[0].displayName, game.players[1].displayName]
    : ['Player 1', 'Player 2'];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          &larr; Back
        </button>
        <h2 className="text-xl font-bold">
          {game.state?.gameType?.toUpperCase() ?? 'Game'} — {playerNames[0]} vs {playerNames[1]}
        </h2>
        <div className="text-sm text-gray-400">
          Turn {(game.state?.turn ?? 0) + 1} | Status: {game.status}
        </div>
      </div>

      {!started && game.status === 'waiting' && (
        <div className="text-center py-8">
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition-colors"
          >
            Start Battle
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-4 h-[calc(100vh-120px)]">
        <div className="space-y-4 overflow-y-auto">
          <div className="flex justify-center relative">
            {game.state?.board && game.state.gameType === 'battleship' ? (
              <BattleshipBoard
                board={game.state.board as { phase: 'placement' | 'battle'; boards: [{ own: number[][]; tracking: number[][] }, { own: number[][]; tracking: number[][] }] }}
                playerNames={playerNames}
              />
            ) : game.state?.board && game.state.gameType === 'chess' ? (
              <ChessBoard
                fen={game.state.board as string}
                lastMove={game.state.lastMove as string | undefined}
              />
            ) : game.state?.board && game.state.gameType === 'jungle' ? (
              <JungleBoard
                board={game.state.board as number[][]}
                lastMove={game.state.lastMove as string | undefined}
              />
            ) : game.state?.board ? (
              <CaroBoard
                board={game.state.board as number[][]}
                lastMove={game.state.lastMove as string | undefined}
              />
            ) : null}
          </div>

          <GameControls
            status={game.status}
            onPause={pause}
            onResume={resume}
            onNextStep={nextStep}
            onReset={reset}
            stepByStep={stepByStep}
            onToggleStepByStep={setStepByStep}
            delayMs={delayMs}
            onDelayChange={setDelayMs}
          />

          {game.status === 'finished' && (
            <div className="text-center py-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold mb-2">
                {game.state?.winner !== null && game.state?.winner !== undefined
                  ? `${playerNames[game.state.winner]} wins!`
                  : 'Draw!'}
              </div>
              {game.error && <div className="text-red-400 text-sm">{game.error}</div>}
              <div className="text-gray-400 text-sm mt-2">
                {game.moves.length} moves | {game.moves.reduce((s, m) => s + m.tokensUsed, 0)} total tokens
              </div>
            </div>
          )}
        </div>

        <MoveHistory moves={game.moves} playerNames={playerNames} thinkingPlayer={game.thinkingPlayer} />
      </div>

      {game.error && game.status !== 'finished' && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          {game.error}
        </div>
      )}
    </div>
  );
}
