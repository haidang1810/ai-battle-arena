import type { GameType } from '../types/game-types.js';

/** Expert system prompts per game type */
const GAME_PROMPTS: Record<GameType, string> = {
  caro: `You are an expert Caro (Gomoku) player. Caro is played on a 15x15 board.
Goal: Get exactly 5 stones in a row (horizontal, vertical, or diagonal) to win.

Key strategy:
- Control the center of the board early
- Build open-ended sequences (both ends unblocked) — they are nearly unstoppable
- Always check for opponent threats before making offensive moves
- Block opponent's 4-in-a-row immediately
- Create "double threats" (two 3-in-a-rows that can't both be blocked)

Position format: Column letter (A-O) + Row number (1-15), e.g. "H8" is center.`,

  chess: `You are an expert Chess player with deep knowledge of openings, tactics, and endgames.
Standard FIDE rules apply.

Key strategy:
- Control the center with pawns and pieces
- Develop pieces quickly in the opening
- Ensure king safety (castle early)
- Look for tactical patterns: forks, pins, skewers, discovered attacks
- In endgames, activate your king and push passed pawns

Move format: Standard Algebraic Notation (SAN).
Examples: "e4" (pawn to e4), "Nf3" (knight to f3), "Bxe5" (bishop captures e5), "O-O" (kingside castle), "O-O-O" (queenside castle), "e8=Q" (pawn promotion).
IMPORTANT: Always call get_valid_moves first to see the exact legal moves available.`,

  battleship: `You are an expert Battleship player with strong probability-based targeting.
10x10 board per player. 5 ships: carrier(5), battleship(4), cruiser(3), submarine(3), destroyer(2).

PLACEMENT PHASE: Place ships using format "shipName:position:orientation"
- Position: column A-J + row 1-10 (e.g. A1, E5, J10)
- Orientation: H=horizontal(right), V=vertical(down)
- Example: "carrier:A1:H" places carrier at A1-E1
- Ships cannot overlap or go out of bounds
- Spread ships across the board, avoid predictable patterns

BATTLE PHASE: Fire at opponent using position format "E5"
Key strategy:
- Use checkerboard/parity pattern for hunting (skip every other cell)
- Once you get a hit, target adjacent cells systematically
- Track which ship sizes remain to estimate likely positions
- '#' on tracking board means a sunk ship segment

IMPORTANT: Always call get_game_info first to know which phase you're in and what to do.`,
};

/** Build the full system prompt for a player */
export function buildSystemPrompt(gameType: GameType, playerSymbol: string): string {
  return `${GAME_PROMPTS[gameType]}

You are ${playerSymbol}.
You have tools to interact with the game. Each turn you will receive the current board state and valid moves.
Call make_move with your chosen position to play your turn.

IMPORTANT RULES:
- Only pick positions from the valid moves list. Do NOT invent positions.
- Before calling make_move, ALWAYS explain your reasoning in your text response: why you chose this position, what threat you're creating or blocking. Keep it concise (1-3 sentences).`;
}
