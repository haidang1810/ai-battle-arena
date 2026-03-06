import type { GameEngine } from '../engine/game-engine-interface.js';
import type { MoveResult } from '../types/game-types.js';
import pino from 'pino';

const logger = pino({ name: 'tool-executor' });

export interface ToolCallResult {
  output: string;
  moveResult?: MoveResult;
}

/**
 * Execute a tool call against the game engine.
 * Returns the tool output string and optional move result.
 */
export function executeTool(
  engine: GameEngine,
  toolName: string,
  args: Record<string, unknown>,
): ToolCallResult {
  switch (toolName) {
    case 'get_board_state':
      return { output: engine.getBoardAscii() };

    case 'get_valid_moves': {
      const moves = engine.getValidMoves();
      // Limit output to avoid token waste: show count + sample
      if (moves.length > 50) {
        return {
          output: `${moves.length} valid moves available. Showing first 50: ${moves.slice(0, 50).join(', ')}. Use get_board_state to see the board and pick a strategic position.`,
        };
      }
      return { output: moves.join(', ') };
    }

    case 'make_move': {
      const position = args.position as string;
      if (!position) {
        return {
          output: 'Error: position is required. Example: make_move({position: "H8"})',
          moveResult: { valid: false, reason: 'Missing position argument' },
        };
      }
      const result = engine.makeMove(position);
      if (result.valid) {
        const msg = result.gameOver
          ? `Move ${position} accepted. Game over! ${result.winner !== null && result.winner !== undefined ? `Player ${result.winner + 1} wins!` : 'Draw!'}`
          : `Move ${position} accepted.`;
        return { output: msg, moveResult: result };
      }
      return {
        output: `Invalid move: ${result.reason}. Try again with a valid position.`,
        moveResult: result,
      };
    }

    case 'get_game_info':
      return { output: engine.getGameInfo() };

    default:
      logger.warn({ toolName }, 'Unknown tool called');
      return { output: `Unknown tool: ${toolName}` };
  }
}
