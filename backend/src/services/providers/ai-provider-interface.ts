import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

/** Token usage from an AI API call */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Parsed AI response with tool calls */
export interface AIResponse {
  content: string | null;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  usage: TokenUsage;
  thinkingLog: string;
}

/** Model info returned by a provider */
export interface ModelInfo {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
  contextLength: number;
}

/**
 * Abstract interface for AI providers.
 * Each provider (OpenRouter, OpenAI, etc.) implements this.
 * Adding a new provider = implement this interface + register it.
 */
export interface AIProvider {
  /** Unique provider identifier (e.g., 'openrouter', 'openai') */
  readonly id: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Send a chat completion request with optional tool calling */
  chat(
    model: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
  ): Promise<AIResponse>;

  /** Validate the API key for this provider */
  validateKey(): Promise<{ valid: boolean; error?: string }>;

  /** List available models from this provider */
  listModels(): Promise<ModelInfo[]>;
}
