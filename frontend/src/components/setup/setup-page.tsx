import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import type { GameType, ModelInfo, ProviderInfo } from '../../types/game-types';
import { validateKey, fetchProviders, fetchModels, checkModel, createGame } from '../../hooks/use-api';

interface PlayerSetup {
  providerId: string;
  apiKey: string;
  keyStatus: 'idle' | 'testing' | 'valid' | 'invalid';
  modelId: string;
  models: ModelInfo[];
  modelsLoading: boolean;
  customModel: string;
  customModelStatus: 'idle' | 'checking' | 'valid' | 'invalid';
}

const defaultPlayer = (): PlayerSetup => ({
  providerId: '', apiKey: '', keyStatus: 'idle',
  modelId: '', models: [], modelsLoading: false,
  customModel: '', customModelStatus: 'idle',
});

interface SetupPageProps {
  onGameCreated: (gameId: string) => void;
}

export default function SetupPage({ onGameCreated }: SetupPageProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [players, setPlayers] = useState<[PlayerSetup, PlayerSetup]>([defaultPlayer(), defaultPlayer()]);
  const [gameType, setGameType] = useState<GameType>('caro');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProviders().then(setProviders).catch(() => {});
  }, []);

  const updatePlayer = (idx: 0 | 1, update: Partial<PlayerSetup>) => {
    setPlayers((prev) => {
      const next = [...prev] as [PlayerSetup, PlayerSetup];
      next[idx] = { ...next[idx], ...update };
      return next;
    });
  };

  /** Test API key for a player's selected provider */
  const testKey = async (idx: 0 | 1) => {
    const p = players[idx];
    if (!p.providerId || !p.apiKey) return;
    updatePlayer(idx, { keyStatus: 'testing' });
    const result = await validateKey(p.providerId, p.apiKey);
    updatePlayer(idx, { keyStatus: result.valid ? 'valid' : 'invalid' });
    if (result.valid) loadModels(idx);
  };

  /** Load models when provider + key are valid */
  const loadModels = async (idx: 0 | 1) => {
    const p = players[idx];
    updatePlayer(idx, { modelsLoading: true, models: [], modelId: '' });
    try {
      const models = await fetchModels(p.providerId, p.apiKey);
      updatePlayer(idx, { models, modelsLoading: false });
    } catch {
      updatePlayer(idx, { modelsLoading: false });
    }
  };

  /** When provider changes, reset key status and models */
  const onProviderChange = (idx: 0 | 1, providerId: string) => {
    updatePlayer(idx, { providerId, keyStatus: 'idle', models: [], modelId: '', customModel: '', customModelStatus: 'idle' });
  };

  /** Check if a custom model ID exists */
  const checkCustomModel = async (idx: 0 | 1) => {
    const p = players[idx];
    if (!p.customModel.trim()) return;
    updatePlayer(idx, { customModelStatus: 'checking' });
    const result = await checkModel(p.providerId, p.apiKey, p.customModel.trim());
    updatePlayer(idx, {
      customModelStatus: result.valid ? 'valid' : 'invalid',
      modelId: result.valid ? p.customModel.trim() : '',
    });
  };

  const startBattle = async () => {
    const [p1, p2] = players;
    if (!p1.modelId || !p2.modelId) return;
    setLoading(true);
    try {
      const result = await createGame(gameType, [
        { providerId: p1.providerId, modelId: p1.modelId, displayName: p1.modelId.split('/').pop() || p1.modelId, apiKey: p1.apiKey },
        { providerId: p2.providerId, modelId: p2.modelId, displayName: p2.modelId.split('/').pop() || p2.modelId, apiKey: p2.apiKey },
      ]);
      onGameCreated(result.id);
    } catch {
      setLoading(false);
    }
  };

  const gameTypes: { value: GameType; label: string; desc: string }[] = [
    { value: 'caro', label: 'Caro (Gomoku)', desc: '15x15 board, 5 in a row' },
    { value: 'chess', label: 'Chess', desc: 'Standard FIDE rules' },
    { value: 'battleship', label: 'Battleship', desc: 'Ships + targeting' },
  ];

  const canStart = players[0].modelId && players[1].modelId && !loading;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Battle Arena</h1>
        <p className="text-gray-400">Pick 2 AI models from any provider. Watch them fight.</p>
      </div>

      {/* Game Type */}
      <section className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Game</label>
        <div className="grid grid-cols-3 gap-3">
          {gameTypes.map((gt) => (
            <button
              key={gt.value}
              onClick={() => setGameType(gt.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                gameType === gt.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="font-medium">{gt.label}</div>
              <div className="text-xs text-gray-400 mt-1">{gt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Player Setup Cards */}
      <div className="grid grid-cols-2 gap-6">
        {([0, 1] as const).map((idx) => (
          <PlayerSetupCard
            key={idx}
            label={idx === 0
              ? `Player 1 (${gameType === 'chess' ? 'White' : 'X'})`
              : `Player 2 (${gameType === 'chess' ? 'Black' : 'O'})`}
            player={players[idx]}
            providers={providers}
            onProviderChange={(pid) => onProviderChange(idx, pid)}
            onApiKeyChange={(key) => updatePlayer(idx, { apiKey: key, keyStatus: 'idle' })}
            onTestKey={() => testKey(idx)}
            onModelChange={(mid) => updatePlayer(idx, { modelId: mid })}
            onCustomModelChange={(v) => updatePlayer(idx, { customModel: v, customModelStatus: 'idle', ...(v ? { modelId: '' } : {}) })}
            onCheckCustomModel={() => checkCustomModel(idx)}
          />
        ))}
      </div>

      {/* Start */}
      <button
        onClick={startBattle}
        disabled={!canStart}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creating game...' : 'Start Battle'}
      </button>
    </div>
  );
}

/** Dark-theme styles for react-select */
const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: '#1f2937',
    borderColor: state.isFocused ? '#3b82f6' : '#374151',
    boxShadow: 'none',
    '&:hover': { borderColor: '#4b5563' },
    minHeight: '36px',
    fontSize: '0.875rem',
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    zIndex: 20,
  }),
  option: (base: Record<string, unknown>, state: { isFocused: boolean; isSelected: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#374151' : 'transparent',
    color: '#e5e7eb',
    fontSize: '0.875rem',
    '&:active': { backgroundColor: '#2563eb' },
  }),
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: '#e5e7eb' }),
  input: (base: Record<string, unknown>) => ({ ...base, color: '#e5e7eb' }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: '#6b7280' }),
  noOptionsMessage: (base: Record<string, unknown>) => ({ ...base, color: '#6b7280', fontSize: '0.875rem' }),
};

/** Individual player setup: provider → API key → test → model picker */
function PlayerSetupCard({
  label, player, providers, onProviderChange, onApiKeyChange, onTestKey,
  onModelChange, onCustomModelChange, onCheckCustomModel,
}: {
  label: string;
  player: PlayerSetup;
  providers: ProviderInfo[];
  onProviderChange: (id: string) => void;
  onApiKeyChange: (key: string) => void;
  onTestKey: () => void;
  onModelChange: (id: string) => void;
  onCustomModelChange: (value: string) => void;
  onCheckCustomModel: () => void;
}) {
  const modelOptions = useMemo(
    () => player.models.map((m) => ({ value: m.id, label: m.name || m.id })),
    [player.models],
  );
  const selectedModel = modelOptions.find((o) => o.value === player.modelId) ?? null;

  return (
    <section className="space-y-3 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="font-medium text-sm text-gray-300">{label}</h3>

      {/* Provider */}
      <select
        value={player.providerId}
        onChange={(e) => onProviderChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="">Select provider...</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>{p.displayName}</option>
        ))}
      </select>

      {/* API Key + Test */}
      {player.providerId && (
        <div className="flex gap-2">
          <input
            type="password"
            value={player.apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="API key..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={onTestKey}
            disabled={!player.apiKey || player.keyStatus === 'testing'}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 transition-colors"
          >
            {player.keyStatus === 'testing' ? '...' : 'Test'}
          </button>
        </div>
      )}
      {player.keyStatus === 'valid' && <p className="text-green-400 text-xs">Connected</p>}
      {player.keyStatus === 'invalid' && <p className="text-red-400 text-xs">Invalid key</p>}

      {/* Searchable model select (shown after key validated) */}
      {player.keyStatus === 'valid' && player.models.length > 0 && (
        <Select
          options={modelOptions}
          value={selectedModel}
          onChange={(opt) => onModelChange(opt?.value ?? '')}
          placeholder="Search & select model..."
          isSearchable
          isClearable
          styles={selectStyles}
          noOptionsMessage={() => 'No matching models'}
        />
      )}

      {/* Custom model input + check button */}
      {player.keyStatus === 'valid' && !player.modelsLoading && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={player.customModel}
              onChange={(e) => onCustomModelChange(e.target.value)}
              placeholder="Or enter model ID..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={onCheckCustomModel}
              disabled={!player.customModel.trim() || player.customModelStatus === 'checking'}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 transition-colors"
            >
              {player.customModelStatus === 'checking' ? '...' : 'Check'}
            </button>
          </div>
          {player.customModelStatus === 'valid' && (
            <p className="text-green-400 text-xs">Model valid — selected</p>
          )}
          {player.customModelStatus === 'invalid' && (
            <p className="text-red-400 text-xs">Model not found</p>
          )}
        </div>
      )}
      {player.modelsLoading && <p className="text-gray-500 text-xs">Loading models...</p>}
    </section>
  );
}
