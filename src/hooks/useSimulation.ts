import { useState, useCallback, useRef, useEffect } from 'react';
import { SimulationMode, SimulationStatus, SimulationMetrics } from '../types';

interface UseSimulationOptions {
  duration: number; // total seconds
  tickInterval: number; // ms between ticks
  onTick: (time: number, mode: SimulationMode) => SimulationMetrics;
}

interface UseSimulationReturn {
  mode: SimulationMode;
  status: SimulationStatus;
  progress: number;
  timeElapsed: number;
  metricsHistory: SimulationMetrics[];
  currentMetrics: SimulationMetrics;
  setMode: (mode: SimulationMode) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const defaultMetrics: SimulationMetrics = {
  timestamp: 0,
  throughput: 0,
  packetsSent: 0,
  packetsDropped: 0,
  packetsIntercepted: 0,
  packetsReachingServer: 0,
  attackPacketRate: 0,
  switchTableUtil: 0,
};

export function useSimulation(options: UseSimulationOptions): UseSimulationReturn {
  const { duration, tickInterval, onTick } = options;
  const [mode, setModeState] = useState<SimulationMode>('baseline');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [metricsHistory, setMetricsHistory] = useState<SimulationMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SimulationMetrics>(defaultMetrics);
  const intervalRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    timeRef.current += tickInterval / 1000;
    const t = timeRef.current;

    if (t >= duration) {
      clearTimer();
      setStatus('completed');
      setProgress(100);
      return;
    }

    const metrics = onTick(t, mode);
    setTimeElapsed(t);
    setProgress((t / duration) * 100);
    setCurrentMetrics(metrics);
    setMetricsHistory(prev => [...prev, metrics]);
  }, [mode, duration, tickInterval, onTick, clearTimer]);

  const start = useCallback(() => {
    timeRef.current = 0;
    setTimeElapsed(0);
    setProgress(0);
    setMetricsHistory([]);
    setCurrentMetrics(defaultMetrics);
    setStatus('running');
    clearTimer();
    intervalRef.current = window.setInterval(tick, tickInterval);
  }, [tick, tickInterval, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    setStatus('running');
    intervalRef.current = window.setInterval(tick, tickInterval);
  }, [tick, tickInterval]);

  const reset = useCallback(() => {
    clearTimer();
    timeRef.current = 0;
    setStatus('idle');
    setProgress(0);
    setTimeElapsed(0);
    setMetricsHistory([]);
    setCurrentMetrics(defaultMetrics);
  }, [clearTimer]);

  const setMode = useCallback((newMode: SimulationMode) => {
    setModeState(newMode);
    reset();
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Update tick function when mode changes
  useEffect(() => {
    if (status === 'running') {
      clearTimer();
      intervalRef.current = window.setInterval(tick, tickInterval);
    }
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mode,
    status,
    progress,
    timeElapsed,
    metricsHistory,
    currentMetrics,
    setMode,
    start,
    pause,
    resume,
    reset,
  };
}
