import React, { useCallback, useState } from 'react';
import { Wifi, Shield, AlertTriangle, TrendingUp, Database, Lock, Ban, HelpCircle } from 'lucide-react';
import SimulationControls from '../components/SimulationControls';
import MetricCard from '../components/MetricCard';
import ThroughputChart from '../components/ThroughputChart';
import TopologyMap from '../components/TopologyMap';
import { useSimulation } from '../hooks/useSimulation';
import { generateMacFloodData } from '../data/simulationData';
import { SimulationMode, SimulationMetrics, ChartDataPoint } from '../types';

const fullChartData = generateMacFloodData();

export default function MacFloodPage() {
  const [liveChartData, setLiveChartData] = useState<ChartDataPoint[]>([]);

  const onTick = useCallback((time: number, mode: SimulationMode): SimulationMetrics => {
    const t = Math.min(Math.floor(time), fullChartData.length - 1);
    const point = fullChartData[t] || fullChartData[fullChartData.length - 1];

    setLiveChartData(prev => {
      if (prev.length <= t) return [...prev, point];
      return prev;
    });

    const throughput = mode === 'baseline' ? point.baseline :
                       mode === 'attack' ? point.attack : point.mitigation;

    const framesSent = mode === 'attack' ? Math.round(97657 * (time / 30)) :
                       mode === 'mitigation' ? Math.min(977, Math.round(977 * (time / 5))) : 0;
    const flooded = mode === 'attack' ? Math.round(9001 * (time / 30)) : 0;
    const tableUtil = mode === 'attack' ? Math.min(100, (time / 30) * 100) :
                      mode === 'mitigation' ? Math.min(5, (time / 30) * 5) : 2;

    return {
      timestamp: time,
      throughput,
      packetsSent: framesSent,
      packetsDropped: mode === 'mitigation' && time > 3 ? Math.round(framesSent * 0.95) : 0,
      packetsIntercepted: flooded,
      packetsReachingServer: 0,
      attackPacketRate: mode === 'attack' ? 3255 : mode === 'mitigation' && time < 3 ? 195 : 0,
      switchTableUtil: Math.round(tableUtil),
    };
  }, []);

  const sim = useSimulation({ duration: 30, tickInterval: 200, onTick });

  const resetAll = () => { sim.reset(); setLiveChartData([]); };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest font-mono">Module C — Confidentiality Attack</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">MAC Address Table Flooding Simulation</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Overwhelms switch CAM table capacity with random synthetic source MAC addresses, inducing unknown-unicast flooding ("fail-open") across all access ports.
          </p>
        </div>

        {/* Audit Evidence Label */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Evidence: Unverified Report Benchmark</span>
        </div>
      </div>

      {/* Audit Disclosure Banner */}
      <div className="p-4 rounded-xl bg-navy-800/80 border border-white/10 text-xs text-gray-300 leading-relaxed">
        <strong className="text-white font-semibold block mb-1">Evidence & Reproducibility Notice:</strong>
        As documented in <code className="text-cyber-blue font-mono">simulation/mac_flood_theory.md</code>, NS-2.35 wired networks use point-to-point links and do not implement Ethernet CAM tables, aging timers, or unknown-unicast flooding logic. The metrics displayed below (<strong className="text-amber-400 font-mono">97,657 frames sent</strong>, <strong className="text-amber-400 font-mono">9,001 flooded copies</strong>, and <strong className="text-amber-400 font-mono">977 frames before shutdown</strong>) represent <em>unverified academic report benchmarks</em> from external hardware/Packet Tracer testing. No raw PCAP or executable NS-2 CAM trace file exists in the repository.
      </div>

      <SimulationControls
        mode={sim.mode} status={sim.status} progress={sim.progress} timeElapsed={sim.timeElapsed}
        onSetMode={sim.setMode}
        onStart={() => { setLiveChartData([]); sim.start(); }}
        onPause={sim.pause} onResume={sim.resume} onReset={resetAll}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard label="Legitimate Throughput" value={sim.currentMetrics.throughput.toLocaleString()} unit="kbps" icon={TrendingUp} color="blue" subtitle="Maintained ~9,000 kbps" />
        <MetricCard label="Bogus Frames Sent" value={sim.currentMetrics.packetsSent.toLocaleString()} icon={AlertTriangle} color="red" subtitle="Random src MACs" />
        <MetricCard label="Flooded Copies to Attacker" value={sim.currentMetrics.packetsIntercepted.toLocaleString()} icon={Wifi} color={sim.mode === 'attack' ? 'amber' : 'green'} subtitle="Unknown unicast leakage" />
        <MetricCard label="Switch CAM Utilisation" value={`${sim.currentMetrics.switchTableUtil}%`} icon={Database} color={sim.currentMetrics.switchTableUtil > 80 ? 'red' : 'blue'} subtitle="Simulated buffer model" />
        <MetricCard label="Port Security Status" value={sim.mode === 'mitigation' ? 'Shutdown (Err-Disabled)' : 'Disabled'} icon={Lock} color={sim.mode === 'mitigation' ? 'green' : 'amber'} />
        <MetricCard label="Frames Blocked" value={sim.currentMetrics.packetsDropped.toLocaleString()} icon={Ban} color="green" subtitle="After 977 frames" />
      </div>

      {/* Switch Table Visualization */}
      <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Simulated Switch MAC Address Table (CAM Buffer Model)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-400">CAM Table Capacity (8,192 entries)</span>
              <span className={`font-mono font-semibold ${
                sim.currentMetrics.switchTableUtil > 80 ? 'text-cyber-red' :
                sim.currentMetrics.switchTableUtil > 50 ? 'text-amber-400' :
                'text-cyber-blue'
              }`}>{sim.currentMetrics.switchTableUtil}% Full</span>
            </div>
            <div className="h-3 bg-navy-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sim.currentMetrics.switchTableUtil > 80 ? 'bg-cyber-red' :
                  sim.currentMetrics.switchTableUtil > 50 ? 'bg-amber-400' :
                  'bg-cyber-blue'
                }`}
                style={{ width: `${sim.currentMetrics.switchTableUtil}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              {sim.mode === 'attack' && sim.currentMetrics.switchTableUtil > 80
                ? 'CRITICAL: CAM table exhausted. Switch has failed open into broadcast/hub mode.'
                : sim.mode === 'mitigation'
                ? 'PROTECTED: Port security violation shutdown prevented CAM table exhaustion.'
                : 'NORMAL: Legitimate dynamic MAC-to-port bindings intact.'}
            </p>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1.5 flex justify-between">
              <span>Learned MAC Addresses</span>
              <span className="text-[10px] font-mono text-gray-500">FastEthernet 0/3</span>
            </div>
            <div className="bg-navy-900/80 rounded-lg p-2.5 font-mono text-[11px] space-y-1 max-h-24 overflow-y-auto border border-white/5">
              <div className="text-cyber-green flex justify-between">
                <span>00:50:79:66:68:01 (PC-1)</span>
                <span className="text-gray-500">Fa0/2 [Dynamic]</span>
              </div>
              <div className="text-cyber-blue flex justify-between">
                <span>00:50:79:66:68:00 (Server)</span>
                <span className="text-gray-500">Fa0/1 [Dynamic]</span>
              </div>
              {sim.mode === 'attack' && (
                <>
                  <div className="text-cyber-red flex justify-between">
                    <span>02:1a:4b:99:c2:01 (Bogus)</span>
                    <span className="text-gray-500">Fa0/3 [Spoofed]</span>
                  </div>
                  <div className="text-cyber-red flex justify-between">
                    <span>02:8f:33:11:aa:92 (Bogus)</span>
                    <span className="text-gray-500">Fa0/3 [Spoofed]</span>
                  </div>
                  <div className="text-amber-400 text-[10px]">... +97,655 synthetic source MACs</div>
                </>
              )}
              {sim.mode === 'mitigation' && (
                <div className="text-cyber-green flex justify-between">
                  <span>00:50:79:66:68:99 (Attacker)</span>
                  <span className="text-cyber-green">Fa0/3 [Sticky 1/2]</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <TopologyMap mode={sim.mode} attackType="mac-flood" compact />
        </div>
      </div>

      <ThroughputChart
        data={liveChartData.length > 1 ? liveChartData : fullChartData}
        title="Server Throughput — Unaffected by Layer 2 MAC Flooding"
        height={280}
      />

      {/* Academic Values Table */}
      <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Academic Report Benchmark Values (Unverified Reference)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Frames Sent (unmitigated flood)', value: '97,657', color: 'text-cyber-red' },
            { label: 'Flooded Copies to Attacker', value: '9,001', color: 'text-amber-400' },
            { label: 'Frames Before Port-Security Shutdown', value: '977', color: 'text-purple-400' },
            { label: 'Flooded Copies (with port security)', value: '0', color: 'text-cyber-green' },
            { label: 'Legitimate Server Throughput', value: '~9,000 kbps', color: 'text-cyber-blue' },
            { label: 'Mitigation Effectiveness', value: '100%', color: 'text-cyber-green' },
          ].map((item, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-[10px] text-gray-400 font-sans">{item.label}</p>
              <p className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations & Disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold text-white">Mechanism & Cisco Mitigation</h3>
          <p className="text-gray-300 leading-relaxed">
            When switch memory is exhausted by 97,657 spoofed Ethernet frames, the ASIC cannot learn new associations and floods unknown unicast frames to all VLAN ports (9,001 leaked frames).
          </p>
          <div className="p-3 bg-navy-900/60 rounded border border-white/5 font-mono text-[11px] text-gray-300">
            Cisco IOS Mitigation: <code className="text-purple-300">switchport port-security violation shutdown</code> limits learning to 2 MACs and places port Fa0/3 into err-disabled state after 977 frames.
          </div>
        </div>

        <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5 space-y-2 text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            NS-2 Architecture Limitation
          </div>
          <p className="leading-relaxed">
            NS-2.35 lacks an IEEE 802.1D bridge/switch agent with finite CAM hashing. The numbers shown above originate from the written project report and Packet Tracer Catalyst 2960 configurations. They must be presented as an educational simulation model rather than an executable NS-2 trace.
          </p>
        </div>
      </div>
    </div>
  );
}
