import type { GameType, ModelInfo, ProviderInfo } from '../types/game-types.js';

const API_BASE = '/api';

export async function validateKey(providerId: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, apiKey }),
    });
    if (!res.ok) return { valid: false, error: `Error: ${res.status} ${res.statusText}` };
    return res.json();
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  const res = await fetch(`${API_BASE}/providers`);
  const data = await res.json();
  return data.providers;
}

export async function checkModel(providerId: string, apiKey: string, modelId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/check-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, apiKey, modelId }),
    });
    if (!res.ok) return { valid: false, error: `Error: ${res.status}` };
    return res.json();
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

export async function fetchModels(providerId: string, apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId, apiKey }),
  });
  const data = await res.json();
  return data.models ?? [];
}

export async function createGame(
  gameType: GameType,
  players: Array<{ providerId: string; modelId: string; displayName: string; apiKey: string }>,
  settings?: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameType, players, settings }),
  });
  return res.json();
}
