/**
 * Jungle Chess (Co Thu) board renderer.
 * 9x7 grid with terrain visuals, piece emojis, and last-move highlight.
 */

interface JungleBoardProps {
  board: number[][]; // 9x7, positive=Red(P0), negative=Blue(P1), abs=rank
  lastMove?: string; // "a1-a2" format
}

const COLS_LABEL = 'abcdefg'.split('');
const ROWS_DISPLAY = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // top-to-bottom

/** Terrain constants (must match backend) */
const k = (r: number, c: number) => `${r},${c}`;
const WATER_CELLS = new Set([
  k(3, 1), k(3, 2), k(4, 1), k(4, 2), k(5, 1), k(5, 2),
  k(3, 4), k(3, 5), k(4, 4), k(4, 5), k(5, 4), k(5, 5),
]);
const TRAP_CELLS = new Set([k(0, 2), k(0, 4), k(1, 3), k(8, 2), k(8, 4), k(7, 3)]);
const DEN_CELLS = new Set([k(0, 3), k(8, 3)]);

const PIECE_EMOJI: Record<number, string> = {
  1: '\u{1F400}', 2: '\u{1F431}', 3: '\u{1F43A}', 4: '\u{1F415}',
  5: '\u{1F406}', 6: '\u{1F42F}', 7: '\u{1F981}', 8: '\u{1F418}',
};

const PIECE_NAMES: Record<number, string> = {
  1: 'Chuot', 2: 'Meo', 3: 'Soi', 4: 'Cho',
  5: 'Bao', 6: 'Ho', 7: 'Su Tu', 8: 'Voi',
};

function parseLastMove(move: string): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
  const m = move.match(/^([a-g])([1-9])-([a-g])([1-9])$/);
  if (!m) return null;
  return {
    fromCol: m[1].charCodeAt(0) - 97, fromRow: parseInt(m[2]) - 1,
    toCol: m[3].charCodeAt(0) - 97, toRow: parseInt(m[4]) - 1,
  };
}

function getCellClasses(row: number, col: number, isHighlighted: boolean): string {
  const key = `${row},${col}`;
  if (isHighlighted) return 'bg-yellow-600/40 ring-2 ring-inset ring-yellow-400';
  if (WATER_CELLS.has(key)) return 'bg-blue-600/30';
  if (DEN_CELLS.has(key)) return 'bg-amber-700/30';
  if (TRAP_CELLS.has(key)) return 'bg-red-900/20';
  return 'bg-gray-800';
}

export default function JungleBoard({ board, lastMove }: JungleBoardProps) {
  const highlight = lastMove ? parseLastMove(lastMove) : null;

  return (
    <div className="inline-block">
      {/* Column labels */}
      <div className="flex ml-8">
        {COLS_LABEL.map((c) => (
          <div key={c} className="w-11 h-6 flex items-center justify-center text-xs text-gray-500 font-mono">{c}</div>
        ))}
      </div>

      {/* Rows: display row 9 (index 8) at top down to row 1 (index 0) */}
      {ROWS_DISPLAY.map((displayRow) => {
        const rowIdx = displayRow - 1;
        return (
          <div key={displayRow} className="flex">
            <div className="w-8 h-11 flex items-center justify-center text-xs text-gray-500 font-mono">
              {displayRow}
            </div>
            {(board[rowIdx] || []).map((cell, colIdx) => {
              const isFrom = highlight?.fromRow === rowIdx && highlight?.fromCol === colIdx;
              const isTo = highlight?.toRow === rowIdx && highlight?.toCol === colIdx;
              const cellKey = `${rowIdx},${colIdx}`;
              const bg = getCellClasses(rowIdx, colIdx, isFrom || isTo);

              return (
                <div
                  key={colIdx}
                  className={`w-11 h-11 border border-gray-700 flex items-center justify-center relative ${bg}`}
                  title={cell !== 0 ? `${PIECE_NAMES[Math.abs(cell)]} (${Math.abs(cell)})` : undefined}
                >
                  {cell !== 0 ? (
                    <div className={`text-center leading-none ${cell > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      <span className="text-lg">{PIECE_EMOJI[Math.abs(cell)] || '?'}</span>
                      <span className="text-[9px] font-mono block -mt-1">{Math.abs(cell)}</span>
                    </div>
                  ) : (
                    <>
                      {DEN_CELLS.has(cellKey) && <span className="text-[10px] text-amber-600">&#9733;</span>}
                      {TRAP_CELLS.has(cellKey) && <span className="text-[10px] text-red-800">&#9888;</span>}
                      {WATER_CELLS.has(cellKey) && <span className="text-sm text-blue-400/60">~</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-gray-500 mt-2">
        <span><span className="inline-block w-3 h-3 bg-blue-600/30 rounded-sm align-middle mr-1" />Water</span>
        <span><span className="inline-block w-3 h-3 bg-amber-700/30 rounded-sm align-middle mr-1" />Den</span>
        <span><span className="inline-block w-3 h-3 bg-red-900/20 rounded-sm align-middle mr-1" />Trap</span>
      </div>

      {/* Last move */}
      {lastMove && (
        <div className="text-center text-xs text-gray-400 mt-1">
          Last move: <span className="text-yellow-400 font-mono">{lastMove}</span>
        </div>
      )}
    </div>
  );
}
