import { useRef, useEffect, useState } from 'react';
import type { RecordedMove, PlayerIndex } from '../../types/game-types';

interface MoveHistoryProps {
  moves: RecordedMove[];
  playerNames: [string, string];
  thinkingPlayer: PlayerIndex | null;
}

export default function MoveHistory({ moves, playerNames, thinkingPlayer }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);

  // Auto-scroll when new move or thinking starts
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [moves.length, thinkingPlayer]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[calc(100vh-350px)]">
      <div className="p-3 border-b border-gray-700 font-medium text-sm">
        Move History ({moves.length})
      </div>
      <div ref={scrollRef} className="overflow-y-auto flex-1 p-2 space-y-1">
        {moves.length === 0 && thinkingPlayer === null && (
          <p className="text-gray-500 text-sm text-center py-4">No moves yet</p>
        )}
        {moves.map((m) => (
          <div key={m.turn} className="text-sm rounded p-2 hover:bg-gray-700/50 transition-colors">
            <div
              className="flex justify-between items-center cursor-pointer select-none"
              onClick={() => setExpandedTurn(expandedTurn === m.turn ? null : m.turn)}
            >
              <span>
                <span className="text-gray-400 font-mono">#{m.turn + 1}</span>{' '}
                <span className={m.player === 0 ? 'text-blue-400' : 'text-red-400'}>
                  {playerNames[m.player]}
                </span>{' '}
                <span className="font-mono">{m.move as string}</span>
                {expandedTurn === m.turn ? ' ▾' : ' ▸'}
              </span>
              <span className="text-gray-500 text-xs">
                {(m.thinkingTimeMs / 1000).toFixed(1)}s | {m.tokensUsed}t
              </span>
            </div>
            {m.wasInvalid && (
              <span className="text-yellow-500 text-xs ml-6">
                ({m.invalidAttempts} invalid attempts)
              </span>
            )}
            {expandedTurn === m.turn && m.thinkingLog && (
              <pre className="mt-2 text-xs text-gray-400 bg-gray-900 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto select-text cursor-text">
                {m.thinkingLog}
              </pre>
            )}
          </div>
        ))}

        {/* Thinking placeholder */}
        {thinkingPlayer !== null && (
          <div className="text-sm rounded p-2 bg-gray-700/30 border border-gray-600/50 animate-pulse">
            <div className="flex justify-between items-center">
              <span>
                <span className="text-gray-400 font-mono">#{moves.length + 1}</span>{' '}
                <span className={thinkingPlayer === 0 ? 'text-blue-400' : 'text-red-400'}>
                  {playerNames[thinkingPlayer]}
                </span>{' '}
                <span className="text-yellow-400">thinking...</span>
              </span>
              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
