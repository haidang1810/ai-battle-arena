import { useState } from 'react';
import { useSocket } from './hooks/use-socket';
import SetupPage from './components/setup/setup-page';
import GamePage from './components/game/game-page';
import HistoryPage from './components/history/history-page';
import ReplayPage from './components/replay/replay-page';
import StatsPage from './components/stats/stats-page';

type Screen = 'setup' | 'game' | 'history' | 'replay' | 'stats';

export default function App() {
  const { socket, connected } = useSocket();
  const [screen, setScreen] = useState<Screen>('setup');
  const [gameId, setGameId] = useState('');
  const [replayId, setReplayId] = useState('');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <button onClick={() => setScreen('setup')} className="font-bold text-lg hover:text-blue-400 transition-colors">
          AI Battle Arena
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen('stats')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Stats
          </button>
          <button
            onClick={() => setScreen('history')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Match History
          </button>
          <span className="text-xs">
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
          </span>
        </div>
      </div>

      {screen === 'setup' && (
        <SetupPage onGameCreated={(id) => { setGameId(id); setScreen('game'); }} />
      )}
      {screen === 'game' && (
        <GamePage socket={socket} gameId={gameId} onBack={() => setScreen('setup')} />
      )}
      {screen === 'history' && (
        <HistoryPage
          onSelectReplay={(id) => { setReplayId(id); setScreen('replay'); }}
          onBack={() => setScreen('setup')}
        />
      )}
      {screen === 'replay' && (
        <ReplayPage gameId={replayId} onBack={() => setScreen('history')} />
      )}
      {screen === 'stats' && (
        <StatsPage onBack={() => setScreen('setup')} />
      )}
    </div>
  );
}
