import { Router } from 'express';
import { providerRegistry } from '../services/providers/provider-registry.js';

const router = Router();

/** Validate an API key for a specific provider */
router.post('/validate-key', async (req, res) => {
  try {
    const { providerId, apiKey } = req.body as { providerId?: string; apiKey?: string };
    if (!apiKey || typeof apiKey !== 'string') {
      res.json({ valid: false, error: 'API key is required' });
      return;
    }
    const pid = providerId ?? 'openrouter';
    if (!providerRegistry.has(pid)) {
      res.json({ valid: false, error: `Unknown provider: ${pid}` });
      return;
    }
    const provider = providerRegistry.create(pid, apiKey);
    const result = await provider.validateKey();
    res.json(result);
  } catch {
    res.json({ valid: false, error: 'Connection failed' });
  }
});

export default router;
