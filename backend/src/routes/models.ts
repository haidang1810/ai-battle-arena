import { Router } from 'express';
import { providerRegistry } from '../services/providers/provider-registry.js';

const router = Router();

/** List all available providers */
router.get('/providers', (_req, res) => {
  res.json({ providers: providerRegistry.listProviders() });
});

/** List models for a specific provider (requires API key) */
router.post('/models', async (req, res) => {
  try {
    const { providerId, apiKey } = req.body as { providerId: string; apiKey: string };
    if (!providerId || !apiKey) {
      res.status(400).json({ error: 'providerId and apiKey required' });
      return;
    }
    if (!providerRegistry.has(providerId)) {
      res.status(400).json({ error: `Unknown provider: ${providerId}` });
      return;
    }
    const provider = providerRegistry.create(providerId, apiKey);
    const models = await provider.listModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/** Check if a custom model ID exists by sending a minimal chat request */
router.post('/check-model', async (req, res) => {
  try {
    const { providerId, apiKey, modelId } = req.body as { providerId?: string; apiKey?: string; modelId?: string };
    if (!providerId || !apiKey || !modelId) {
      res.json({ valid: false, error: 'providerId, apiKey, and modelId required' });
      return;
    }
    if (!providerRegistry.has(providerId)) {
      res.json({ valid: false, error: `Unknown provider: ${providerId}` });
      return;
    }
    const provider = providerRegistry.create(providerId, apiKey);
    try {
      await provider.chat(modelId, [{ role: 'user', content: 'hi' }]);
      res.json({ valid: true });
    } catch (error) {
      const status = (error as { status?: number }).status;
      // 404 or model-not-found = invalid model
      if (status === 404 || status === 400) {
        res.json({ valid: false, error: 'Model not found' });
        return;
      }
      // Other errors (rate limit, server error) — model might exist but call failed
      res.json({ valid: false, error: `Check failed: ${(error as Error).message}` });
    }
  } catch {
    res.json({ valid: false, error: 'Check failed' });
  }
});

export default router;
