import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { GameEngine } from '../engine/game-engine-interface.js';
import type { MoveResult, PlayerIndex } from '../types/game-types.js';
import type { AIProvider } from './providers/ai-provider-interface.js';
import { buildSystemPrompt } from './game-system-prompts.js';
import { BASE_TOOLS } from '../tools/tool-definitions.js';
import { executeTool } from '../tools/tool-executor.js';
import pino from 'pino';

const logger = pino({ name: 'ai-player' });

const MAX_TOOL_ROUNDS = 10;

export interface MoveRequestResult {
  move: string;
  thinkingLog: string;
  tokensUsed: number;
  costEstimate: number;
  thinkingTimeMs: number;
  moveResult: MoveResult;
  invalidAttempts: number;
}

/**
 * Persistent conversation context for one AI player across the entire game.
 * Keeps message history so the AI understands previous moves.
 */
export class AIPlayerContext {
  readonly playerIndex: PlayerIndex;
  readonly modelId: string;
  private provider: AIProvider;
  private messages: ChatCompletionMessageParam[];

  constructor(provider: AIProvider, modelId: string, engine: GameEngine, playerIndex: PlayerIndex) {
    this.provider = provider;
    this.modelId = modelId;
    this.playerIndex = playerIndex;

    const symbols: Record<string, [string, string]> = {
      caro: ['X (Player 1)', 'O (Player 2)'],
      chess: ['White (Player 1)', 'Black (Player 2)'],
      battleship: ['Player 1', 'Player 2'],
    };
    const playerSymbol = (symbols[engine.gameType] ?? ['Player 1', 'Player 2'])[playerIndex];
    const systemPrompt = buildSystemPrompt(engine.gameType, playerSymbol);

    this.messages = [
      { role: 'system', content: systemPrompt },
    ];
  }

  /** Request a move from this AI player, injecting current board state */
  async requestMove(engine: GameEngine, maxInvalidMoves: number): Promise<MoveRequestResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    let thinkingLog = '';
    let invalidAttempts = 0;

    // Inject current board state + valid moves as the turn prompt
    const boardState = engine.getBoardAscii();
    const validMoves = engine.getValidMoves();
    const movesPreview = validMoves.length > 50
      ? `${validMoves.length} valid moves. Sample: ${validMoves.slice(0, 50).join(', ')}`
      : validMoves.join(', ');

    const turnPrompt = `Your turn. Here is the current board:\n\n${boardState}\n\nValid moves: ${movesPreview}\n\nAnalyze the board, then call make_move with your chosen position.`;
    this.messages.push({ role: 'user', content: turnPrompt });

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.provider.chat(this.modelId, this.messages, BASE_TOOLS);
      totalTokens += response.usage.totalTokens;

      // Capture AI's text reasoning (not tool outputs) as thinkingLog
      if (response.content) {
        thinkingLog += response.content + '\n';
      }

      if (response.toolCalls.length === 0) {
        logger.warn({ modelId: this.modelId, round }, 'AI responded without tool calls');
        // Push AI response and nudge it to use tools
        if (response.content) {
          this.messages.push({ role: 'assistant', content: response.content });
        }
        this.messages.push({ role: 'user', content: 'Please use the make_move tool to play your move. Pick a position from the valid moves list.' });
        continue;
      }

      const assistantMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };
      this.messages.push(assistantMessage);

      let moveCompleted = false;
      let lastMoveResult: MoveResult | undefined;
      let lastMovePosition = '';

      for (const toolCall of response.toolCalls) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(toolCall.arguments) as Record<string, unknown>;
        } catch {
          args = {};
        }

        const result = executeTool(engine, toolCall.name, args);

        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result.output,
        });

        if (toolCall.name === 'make_move' && result.moveResult) {
          if (result.moveResult.valid) {
            moveCompleted = true;
            lastMoveResult = result.moveResult;
            lastMovePosition = args.position as string;
          } else {
            invalidAttempts++;
            logger.warn({
              modelId: this.modelId,
              player: this.playerIndex,
              round,
              attempt: invalidAttempts,
              position: args.position,
              reason: result.moveResult.reason,
              boardSent: boardState,
              validMovesCount: validMoves.length,
            }, 'AI made invalid move');
            if (invalidAttempts >= maxInvalidMoves) {
              logger.error({
                modelId: this.modelId,
                player: this.playerIndex,
                invalidAttempts,
                lastPosition: args.position,
                aiContent: response.content,
              }, 'AI forfeited — max invalid moves reached');
              return {
                move: '',
                thinkingLog,
                tokensUsed: totalTokens,
                costEstimate: 0,
                thinkingTimeMs: Date.now() - startTime,
                moveResult: { valid: false, reason: `Forfeited after ${maxInvalidMoves} invalid attempts` },
                invalidAttempts,
              };
            }
          }
        }
      }

      if (moveCompleted && lastMoveResult) {
        return {
          move: lastMovePosition,
          thinkingLog,
          tokensUsed: totalTokens,
          costEstimate: 0,
          thinkingTimeMs: Date.now() - startTime,
          moveResult: lastMoveResult,
          invalidAttempts,
        };
      }
    }

    return {
      move: '',
      thinkingLog,
      tokensUsed: totalTokens,
      costEstimate: 0,
      thinkingTimeMs: Date.now() - startTime,
      moveResult: { valid: false, reason: 'AI failed to make a move within allowed rounds' },
      invalidAttempts,
    };
  }
}
