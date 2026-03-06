import type { AIProvider, ModelInfo } from './ai-provider-interface.js';
import { OpenRouterProvider } from './openrouter-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

/** Curated model list for AliCloud Sub (coding-intl endpoint) */
const ALICLOUD_SUB_MODELS: ModelInfo[] = [
  { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'GLM-5', name: 'GLM-5', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'qwen3-max-2026-01-23', name: 'Qwen 3 Max (2026-01-23)', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'qwen3-coder-next', name: 'Qwen 3 Coder Next', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'qwen3-coder-plus', name: 'Qwen 3 Coder Plus', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
  { id: 'glm-4.7', name: 'GLM 4.7', pricing: { prompt: '0', completion: '0' }, contextLength: 131072 },
];

export type ProviderId = string;

/** Provider factory function — creates a provider instance with an API key */
type ProviderFactory = (apiKey: string) => AIProvider;

/**
 * Registry of all available AI providers.
 * To add a new provider: register its factory here.
 */
class ProviderRegistry {
  private factories = new Map<ProviderId, ProviderFactory>();
  private displayNames = new Map<ProviderId, string>();

  register(id: ProviderId, displayName: string, factory: ProviderFactory) {
    this.factories.set(id, factory);
    this.displayNames.set(id, displayName);
  }

  /** Create a provider instance for the given ID and API key */
  create(id: ProviderId, apiKey: string): AIProvider {
    const factory = this.factories.get(id);
    if (!factory) throw new Error(`Unknown provider: "${id}". Available: ${this.listIds().join(', ')}`);
    return factory(apiKey);
  }

  /** List all registered provider IDs */
  listIds(): ProviderId[] {
    return Array.from(this.factories.keys());
  }

  /** List providers with display names for UI */
  listProviders(): Array<{ id: ProviderId; displayName: string }> {
    return this.listIds().map((id) => ({
      id,
      displayName: this.displayNames.get(id) ?? id,
    }));
  }

  has(id: ProviderId): boolean {
    return this.factories.has(id);
  }
}

/** Singleton registry with built-in providers */
export const providerRegistry = new ProviderRegistry();

// Register built-in providers
providerRegistry.register('openrouter', 'OpenRouter', (apiKey) => new OpenRouterProvider(apiKey));
providerRegistry.register('openai', 'OpenAI', (apiKey) => new OpenAIProvider(apiKey));
providerRegistry.register('alicloud-sub', 'AliCloud Sub', (apiKey) =>
  new OpenAICompatibleProvider('alicloud-sub', 'AliCloud Sub', 'https://coding-intl.dashscope.aliyuncs.com/v1', apiKey, ALICLOUD_SUB_MODELS));
providerRegistry.register('alicloud-ap', 'AliCloud AP', (apiKey) =>
  new OpenAICompatibleProvider('alicloud-ap', 'AliCloud AP', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', apiKey));
