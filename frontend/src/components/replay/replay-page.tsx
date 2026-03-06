import { useState, useEffect } from 'react';
import type { GameType, RecordedMove } from '../../types/game-types';
import { useReplay } from '../../hooks/use-replay';
import CaroBoard from '../game/caro-board';
import ChessBoard from '../game/chess-board';

interface GameRecord {
  id: string;
  gameType: GameType;
  players: [{ modelId: string; displayName: string }, { modelId: string; displayName: string }];
  moves: RecordedMove[];
  winner?: number | null;
  startTime: number;
}

interface ReplayPageProps {
  gameId: string;
  onBack: () => void;
}

export default function ReplayPage({ gameId, onBack }: ReplayPageProps) {
  const [record, setRecord] = useState<GameRecord | null>(null);

  useEffect(() => {
    fetch(`/api/replays/${gameId}`)
      .then((r) => r.json())
      .then(setRecord)
      .catch(() => {});
  }, [gameId]);

  if (!record) {
    return <div className="text-center py-12 text-gray-400">Loading replay...</div>;
  }

  return <ReplayViewer record={record} onBack={onBack} />;
}

function ReplayViewer({ record, onBack }: { record: GameRecord; onBack: () => void }) {
  const {
    board, currentTurn, currentMove, isPlaying, speed, totalMoves,
    stepForward, stepBack, seekTo, play, pause, setSpeed,
  } = useReplay(record.moves, record.gameType);

  const playerNames: [string, string] = [
    record.players[0].displayName,
    record.players[1].displayName,
  ];

  const lastMove = currentTurn >= 0 && currentTurn < record.moves.length
    ? (record.moves[currentTurn].move as string)
    : undefined;

  const exportReplay = () => {
    window.open(`/api/replays/${record.id}/export`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">&larr; Back</button>
        <h2 className="text-xl font-bold">{playerNames[0]} vs {playerNames[1]}</h2>
        <button onClick={exportReplay} className="text-sm text-blue-400 hover:text-blue-300">
          Export JSON
        </button>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Board */}
        <div className="space-y-4">
          <div className="flex justify-center">
            {record.gameType === 'chess' ? (
              <ChessBoard fen={board as string} lastMove={lastMove} />
            ) : (
              <CaroBoard board={board as number[][]} lastMove={lastMove} />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 bg-gray-800 rounded-lg border border-gray-700 p-3">
            <button onClick={stepBack} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">&larr;</button>
            {isPlaying ? (
              <button onClick={pause} className="px-4 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm">Pause</button>
            ) : (
              <button onClick={play} className="px-4 py-1 bg-green-600 hover:bg-green-500 rounded text-sm">Play</button>
            )}
            <button onClick={stepForward} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">&rarr;</button>

            <div className="w-px h-6 bg-gray-600" />

            {/* Seek slider */}
            <input
              type="range"
              min={-1}
              max={totalMoves - 1}
              value={currentTurn}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-xs text-gray-400 font-mono w-16">
              {currentTurn + 1}/{totalMoves}
            </span>

            {/* Speed */}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          {/* Result */}
          <div className="text-center text-sm text-gray-400">
            {record.winner !== null && record.winner !== undefined
              ? `Winner: ${playerNames[record.winner]}`
              : 'Draw'}
          </div>
        </div>

        {/* Move info sidebar */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
          <h3 className="font-medium text-sm">Move Details</h3>
          {currentMove ? (
            <>
              <div className="text-sm space-y-1">
                <div>Turn: <span className="font-mono">{currentMove.turn + 1}</span></div>
                <div>Player: <span className={currentMove.player === 0 ? 'text-blue-400' : 'text-red-400'}>{playerNames[currentMove.player]}</span></div>
                <div>Move: <span className="font-mono">{currentMove.move as string}</span></div>
                <div>Time: {(currentMove.thinkingTimeMs / 1000).toFixed(1)}s</div>
                <div>Tokens: {currentMove.tokensUsed}</div>
                {currentMove.wasInvalid && (
                  <div className="text-yellow-500">Invalid attempts: {currentMove.invalidAttempts}</div>
                )}
              </div>
              {currentMove.thinkingLog && (
                <div>
                  <h4 className="text-xs text-gray-400 mb-1">AI Reasoning</h4>
                  <pre className="text-xs text-gray-300 bg-gray-900 rounded p-2 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {currentMove.thinkingLog}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">Select a move to see details</p>
          )}
        </div>
      </div>
    </div>
  );
}
