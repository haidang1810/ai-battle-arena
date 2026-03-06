import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import type { AIProvider, AIResponse, ModelInfo } from './ai-provider-interface.js';
import pino from 'pino';

const logger = pino({ name: 'openrouter-provider' });

const BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * OpenRouter provider — gateway to 100+ models via OpenAI-compatible API.
 */
export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter';
  readonly displayName = 'OpenRouter';
  private client: OpenAI;
  private apiKey: string;
  private modelCache: { data: ModelInfo[]; timestamp: number } | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey,
      baseURL: BASE_URL,
      defaultHeaders: { 'X-Title': 'AI Battle Arena' },
    });
  }

  async chat(
    model: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
  ): Promise<AIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          messages,
          tools: tools?.length ? tools : undefined,
          tool_choice: tools?.length ? 'auto' : undefined,
        });

        const message = response.choices[0]?.message;
        const toolCalls = (message?.tool_calls ?? [])
          .filter((tc): tc is Extract<typeof tc, { type: 'function' }> => tc.type === 'function')
          .map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          }));

        return {
          content: message?.content ?? null,
          toolCalls,
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
          thinkingLog: message?.content ?? '',
        };
      } catch (error: unknown) {
        lastError = error as Error;
        if ((error as { status?: number }).status === 429) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          logger.warn({ attempt, backoff }, 'Rate limited, retrying...');
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error('Max retries exceeded');
  }

  async validateKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok ? { valid: true } : { valid: false, error: `Status ${res.status}` };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (this.modelCache && Date.now() - this.modelCache.timestamp < CACHE_TTL_MS) {
      return this.modelCache.data;
    }
    const res = await fetch(`${BASE_URL}/models`);
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

    const json = (await res.json()) as { data: Array<{
      id: string; name: string;
      pricing: { prompt: string; completion: string };
      context_length: number;
    }> };

    const models = json.data.map((m) => ({
      id: m.id, name: m.name, pricing: m.pricing, contextLength: m.context_length,
    }));
    this.modelCache = { data: models, timestamp: Date.now() };
    return models;
  }
}
