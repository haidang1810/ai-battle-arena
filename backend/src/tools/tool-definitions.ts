import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Base tool definitions shared across all games.
 * Each game can extend with game-specific tools.
 */
export const BASE_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_board_state',
      description: 'Get the current state of the game board as a text representation',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_valid_moves',
      description: 'Get a list of all valid moves you can make this turn',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'make_move',
      description: 'Make a move. Caro: "H8". Chess: SAN like "e4","Nf3","O-O". Battleship placement: "carrier:A1:H". Battleship battle: "E5".',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            description: 'The move. Caro: "H8". Chess: "e4". Battleship placement: "shipName:pos:H/V". Battleship battle: "E5".',
          },
        },
        required: ['position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_game_info',
      description: 'Get information about the current game: rules, board size, your symbol, current turn',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];
