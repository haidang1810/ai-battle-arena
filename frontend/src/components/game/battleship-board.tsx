interface BattleshipBoardProps {
  board: {
    phase: 'placement' | 'battle';
    boards: [BoardView, BoardView];
  };
  playerNames: [string, string];
}

interface BoardView {
  own: number[][];     // 0=water, 1=ship, 2=hit, 3=miss
  tracking: number[][]; // 0=unknown, 1=hit, 2=miss, 3=sunk
}

const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/** Cell colors for own board */
const OWN_COLORS: Record<number, string> = {
  0: 'bg-blue-900',         // water
  1: 'bg-gray-500',         // ship
  2: 'bg-red-600',          // hit
  3: 'bg-blue-400',         // miss
};

/** Cell colors for tracking board */
const TRACK_COLORS: Record<number, string> = {
  0: 'bg-blue-900/50',      // unknown
  1: 'bg-red-600',          // hit
  2: 'bg-blue-400',         // miss
  3: 'bg-red-800',          // sunk
};

/** Cell symbols */
const OWN_SYMBOLS: Record<number, string> = { 0: '', 1: '', 2: 'X', 3: 'O' };
const TRACK_SYMBOLS: Record<number, string> = { 0: '', 1: 'X', 2: 'O', 3: '#' };

function MiniBoard({ grid, colors, symbols, label }: {
  grid: number[][];
  colors: Record<number, string>;
  symbols: Record<number, string>;
  label: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 text-center mb-1">{label}</div>
      {/* Column labels */}
      <div className="flex ml-5">
        {FILES.map((f) => (
          <div key={f} className="w-6 h-4 flex items-center justify-center text-[10px] text-gray-500 font-mono">
            {f}
          </div>
        ))}
      </div>
      {/* Grid */}
      {grid.map((row, r) => (
        <div key={r} className="flex">
          <div className="w-5 h-6 flex items-center justify-center text-[10px] text-gray-500 font-mono">
            {r + 1}
          </div>
          {row.map((cell, c) => (
            <div
              key={c}
              className={`w-6 h-6 border border-blue-950 flex items-center justify-center text-[10px] font-bold ${colors[cell] || 'bg-blue-900'}`}
            >
              <span className={cell === 2 || cell === 1 ? 'text-white' : 'text-blue-200'}>
                {symbols[cell] || ''}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function BattleshipBoard({ board, playerNames }: BattleshipBoardProps) {
  return (
    <div className="space-y-4">
      {/* Phase indicator */}
      <div className="text-center text-sm text-gray-400">
        Phase: <span className="text-yellow-400 font-medium">{board.phase === 'placement' ? 'Ship Placement' : 'Battle'}</span>
      </div>

      <div className="flex gap-8 justify-center">
        {/* Player 1 */}
        <div className="space-y-2">
          <div className="text-center text-sm font-medium text-blue-400">{playerNames[0]}</div>
          <MiniBoard grid={board.boards[0].own} colors={OWN_COLORS} symbols={OWN_SYMBOLS} label="Fleet" />
          {board.phase === 'battle' && (
            <MiniBoard grid={board.boards[0].tracking} colors={TRACK_COLORS} symbols={TRACK_SYMBOLS} label="Radar" />
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-700 self-stretch" />

        {/* Player 2 */}
        <div className="space-y-2">
          <div className="text-center text-sm font-medium text-red-400">{playerNames[1]}</div>
          <MiniBoard grid={board.boards[1].own} colors={OWN_COLORS} symbols={OWN_SYMBOLS} label="Fleet" />
          {board.phase === 'battle' && (
            <MiniBoard grid={board.boards[1].tracking} colors={TRACK_COLORS} symbols={TRACK_SYMBOLS} label="Radar" />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-gray-500">
        <span><span className="inline-block w-3 h-3 bg-gray-500 rounded-sm align-middle mr-1" />Ship</span>
        <span><span className="inline-block w-3 h-3 bg-red-600 rounded-sm align-middle mr-1" />Hit</span>
        <span><span className="inline-block w-3 h-3 bg-blue-400 rounded-sm align-middle mr-1" />Miss</span>
        <span><span className="inline-block w-3 h-3 bg-red-800 rounded-sm align-middle mr-1" />Sunk</span>
      </div>
    </div>
  );
}
