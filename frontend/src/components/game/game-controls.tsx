import type { SessionStatus } from '../../types/game-types';

interface GameControlsProps {
  status: SessionStatus;
  onPause: () => void;
  onResume: () => void;
  onNextStep: () => void;
  onReset: () => void;
  stepByStep: boolean;
  onToggleStepByStep: (v: boolean) => void;
  delayMs: number;
  onDelayChange: (v: number) => void;
}

export default function GameControls({
  status,
  onPause,
  onResume,
  onNextStep,
  onReset,
  stepByStep,
  onToggleStepByStep,
  delayMs,
  onDelayChange,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-gray-800 rounded-lg border border-gray-700 p-3">
      {/* Pause/Resume */}
      {status === 'playing' && (
        <button
          onClick={onPause}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm transition-colors"
        >
          Pause
        </button>
      )}
      {status === 'paused' && (
        <button
          onClick={onResume}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
        >
          Resume
        </button>
      )}

      {/* Step by step */}
      {stepByStep && status === 'playing' && (
        <button
          onClick={onNextStep}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
        >
          Next Move
        </button>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
      >
        Reset
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Speed control */}
      <label className="flex items-center gap-2 text-sm text-gray-400">
        Speed
        <input
          type="range"
          min={200}
          max={5000}
          step={200}
          value={delayMs}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs font-mono w-10">{(delayMs / 1000).toFixed(1)}s</span>
      </label>

      {/* Step mode toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={stepByStep}
          onChange={(e) => onToggleStepByStep(e.target.checked)}
          className="rounded"
        />
        Step-by-step
      </label>
    </div>
  );
}
