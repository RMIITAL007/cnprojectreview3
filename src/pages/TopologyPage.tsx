import React, { useState } from 'react';
import TopologyMap from '../components/TopologyMap';
import { SimulationMode } from '../types';
import { RotateCcw, Info } from 'lucide-react';

export default function TopologyPage() {
  const [mode, setMode] = useState<SimulationMode>('baseline');
  const [attackType, setAttackType] = useState<'syn-flood' | 'arp-spoof' | 'mac-flood' | 'none'>('none');

  const reset = () => {
    setMode('baseline');
    setAttackType('none');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Interactive Enterprise LAN Topology</h1>
          <p className="text-sm text-gray-500 mt-0.5">Click on any device to view its role, IP/MAC, and configuration details.</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs font-medium">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Controls */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Scenario:</span>
          {[
            { label: 'Normal Traffic', m: 'baseline' as SimulationMode, a: 'none' as const },
            { label: 'SYN Flood Attack', m: 'attack' as SimulationMode, a: 'syn-flood' as const },
            { label: 'ARP Spoofing', m: 'attack' as SimulationMode, a: 'arp-spoof' as const },
            { label: 'MAC Flooding', m: 'attack' as SimulationMode, a: 'mac-flood' as const },
            { label: 'Mitigated Network', m: 'mitigation' as SimulationMode, a: 'none' as const },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => { setMode(s.m); setAttackType(s.a); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === s.m && attackType === s.a
                  ? s.m === 'attack'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : s.m === 'mitigation'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30'
                  : 'bg-navy-700 text-gray-400 border border-transparent hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full Topology */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-4 lg:p-6">
        <TopologyMap mode={mode} attackType={attackType} />
      </div>

      {/* Legend */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Traffic Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { color: '#00b4d8', label: 'Normal Traffic', desc: 'Legitimate data flow' },
            { color: '#ef4444', label: 'Attack Traffic', desc: 'Malicious or simulated packets' },
            { color: '#f59e0b', label: 'Intercepted Traffic', desc: 'Redirected through attacker' },
            { color: '#10b981', label: 'Protected Traffic', desc: 'Mitigated / secured path' },
            { color: '#8b5cf6', label: 'Monitored Traffic', desc: 'Captured for analysis' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <div className="w-4 h-0.5 rounded mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-xs text-white font-medium">{item.label}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 text-gray-600 shrink-0" />
        <p>
          This topology is a visual representation of the simulated enterprise LAN. Device positions and connections match the NS2/Packet Tracer lab setup.
          Packet animations are illustrative — they do not represent real captured traffic.
        </p>
      </div>
    </div>
  );
}
