interface CaroBoardProps {
  board: number[][];
  lastMove?: string;
}

/** Parse position like "H8" to {row, col} for highlighting */
function parsePos(pos: string): { row: number; col: number } | null {
  const match = pos.toUpperCase().match(/^([A-O])(\d{1,2})$/);
  if (!match) return null;
  return { row: parseInt(match[2], 10) - 1, col: match[1].charCodeAt(0) - 65 };
}

export default function CaroBoard({ board, lastMove }: CaroBoardProps) {
  const lastPos = lastMove ? parsePos(lastMove) : null;
  const cols = 'ABCDEFGHIJKLMNO'.split('');

  return (
    <div className="inline-block">
      {/* Column labels */}
      <div className="flex ml-8">
        {cols.map((c) => (
          <div key={c} className="w-8 h-6 flex items-center justify-center text-xs text-gray-500 font-mono">
            {c}
          </div>
        ))}
      </div>

      {/* Board grid */}
      {board.map((row, r) => (
        <div key={r} className="flex">
          {/* Row label */}
          <div className="w-8 h-8 flex items-center justify-center text-xs text-gray-500 font-mono">
            {r + 1}
          </div>
          {row.map((cell, c) => {
            const isLast = lastPos?.row === r && lastPos?.col === c;
            return (
              <div
                key={c}
                className={`w-8 h-8 border border-gray-700 flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${isLast ? 'ring-2 ring-yellow-400 bg-gray-700' : 'bg-gray-800'}
                  ${cell === 0 ? '' : cell === 1 ? 'text-blue-400' : 'text-red-400'}`}
              >
                {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
