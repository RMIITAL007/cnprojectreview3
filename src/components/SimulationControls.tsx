import React from 'react';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { SimulationMode, SimulationStatus } from '../types';

interface SimulationControlsProps {
  mode: SimulationMode;
  status: SimulationStatus;
  progress: number;
  timeElapsed: number;
  onSetMode: (mode: SimulationMode) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function SimulationControls({
  mode,
  status,
  progress,
  timeElapsed,
  onSetMode,
  onStart,
  onPause,
  onResume,
  onReset,
}: SimulationControlsProps) {
  const modeColors: Record<SimulationMode, string> = {
    baseline: 'cyber-blue',
    attack: 'cyber-red',
    mitigation: 'cyber-green',
  };

  const modeLabels: Record<SimulationMode, string> = {
    baseline: 'Baseline',
    attack: 'Attack',
    mitigation: 'Mitigation',
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Mode</span>
        {(['baseline', 'attack', 'mitigation'] as SimulationMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === m
                ? m === 'baseline'
                  ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30'
                  : m === 'attack'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-navy-700 text-gray-400 border border-transparent hover:text-white hover:bg-navy-600'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        {status === 'idle' || status === 'completed' ? (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-blue/15 text-cyber-blue hover:bg-cyber-blue/25 text-xs font-semibold transition-all"
          >
            <Play className="w-3.5 h-3.5" /> Start
          </button>
        ) : status === 'running' ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-xs font-semibold transition-all"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-blue/15 text-cyber-blue hover:bg-cyber-blue/25 text-xs font-semibold transition-all"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-gray-500">
            Time: <span className="text-white font-mono">{timeElapsed.toFixed(1)}s</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${
            status === 'running' ? 'text-cyber-green' :
            status === 'paused' ? 'text-amber-400' :
            status === 'completed' ? 'text-cyber-blue' :
            'text-gray-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              status === 'running' ? 'bg-cyber-green status-pulse' :
              status === 'paused' ? 'bg-amber-400' :
              status === 'completed' ? 'bg-cyber-blue' :
              'bg-gray-600'
            }`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            mode === 'baseline' ? 'bg-cyber-blue' :
            mode === 'attack' ? 'bg-red-500' :
            'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
