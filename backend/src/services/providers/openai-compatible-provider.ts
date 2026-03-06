import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import type { AIProvider, AIResponse, ModelInfo } from './ai-provider-interface.js';
import pino from 'pino';

const logger = pino({ name: 'openai-compatible-provider' });

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Generic OpenAI-compatible provider.
 * Works with any API that follows OpenAI's chat completions format.
 * Used for: AliCloud, LiteLLM, vLLM, LocalAI, etc.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  readonly displayName: string;
  private client: OpenAI;
  private apiKey: string;
  private baseURL: string;
  private modelCache: { data: ModelInfo[]; timestamp: number } | null = null;
  private fallbackModels: ModelInfo[];

  constructor(id: string, displayName: string, baseURL: string, apiKey: string, fallbackModels: ModelInfo[] = []) {
    this.id = id;
    this.displayName = displayName;
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey, baseURL });
    this.fallbackModels = fallbackModels;
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
          model, messages,
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
          logger.warn({ provider: this.id, attempt, backoff }, 'Rate limited, retrying...');
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error('Max retries exceeded');
  }

  async validateKey(): Promise<{ valid: boolean; error?: string }> {
    // Try /models first, fall back to a minimal chat completion
    try {
      const res = await fetch(`${this.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (res.ok) return { valid: true };
    } catch {
      // /models not supported, try chat
    }

    try {
      // Send a minimal chat call — any model name works for auth check
      // If key is invalid: 401. If model is wrong but key is valid: 400/404 with auth-related body
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      if (res.ok) return { valid: true };
      // Parse error to distinguish auth failure from model issues
      const body = await res.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
      const code = body?.error?.code ?? '';
      const msg = body?.error?.message ?? '';
      // Auth errors = invalid key
      if (res.status === 401 || code === 'invalid_api_key' || msg.toLowerCase().includes('api key')) {
        return { valid: false, error: 'Invalid API key' };
      }
      // 400/404 with non-auth error = key is valid, model just doesn't exist
      if (res.status === 400 || res.status === 404) {
        return { valid: true };
      }
      return { valid: false, error: `API returned status ${res.status}` };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (this.modelCache && Date.now() - this.modelCache.timestamp < CACHE_TTL_MS) {
      return this.modelCache.data;
    }
    try {
      const res = await fetch(`${this.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) {
        logger.warn({ provider: this.id, status: res.status }, 'listModels API failed, using fallback');
        return this.fallbackModels;
      }
      const body = await res.json() as { data?: Array<{ id: string }> };
      const rawModels = body.data ?? [];
      if (rawModels.length === 0) return this.fallbackModels;

      const models: ModelInfo[] = rawModels.map((m) => ({
        id: m.id,
        name: m.id,
        pricing: { prompt: '0', completion: '0' },
        contextLength: 128000,
      }));
      this.modelCache = { data: models, timestamp: Date.now() };
      return models;
    } catch {
      return this.fallbackModels;
    }
  }
}
