import React, { useCallback, useState } from 'react';
import { Eye, Shield, AlertTriangle, TrendingUp, Server, Lock, Database, FileText } from 'lucide-react';
import SimulationControls from '../components/SimulationControls';
import MetricCard from '../components/MetricCard';
import ThroughputChart from '../components/ThroughputChart';
import TopologyMap from '../components/TopologyMap';
import { useSimulation } from '../hooks/useSimulation';
import { generateArpSpoofData } from '../data/simulationData';
import { SimulationMode, SimulationMetrics, ChartDataPoint, DatasetSource } from '../types';

export default function ArpSpoofPage() {
  const [datasetSource, setDatasetSource] = useState<DatasetSource>('measured-ns2');
  const [liveChartData, setLiveChartData] = useState<ChartDataPoint[]>([]);

  const fullChartData = generateArpSpoofData(datasetSource);

  const onTick = useCallback((time: number, mode: SimulationMode): SimulationMetrics => {
    const isNs2 = datasetSource === 'measured-ns2';
    const maxLen = fullChartData.length;
    const maxTime = isNs2 ? 10 : 30;
    const normalizedIndex = Math.min(Math.floor((time / maxTime) * (maxLen - 1)), maxLen - 1);
    const point = fullChartData[normalizedIndex] || fullChartData[maxLen - 1];

    setLiveChartData(prev => {
      if (prev.length <= normalizedIndex) return [...prev, point];
      return prev;
    });

    const throughput = mode === 'baseline' ? point.baseline :
                       mode === 'attack' ? point.attack : point.mitigation;

    let intercepted = 0;
    let rate = 0;

    if (isNs2) {
      // NS-2 sim_arp.tcl: 1 Mbps CBR stream (125 pkts/sec)
      const activeDuration = Math.max(0, time - 3.0);
      if (mode === 'attack') {
        intercepted = Math.round(activeDuration * 125);
        rate = time >= 3.0 ? 125 : 0;
      } else if (mode === 'mitigation') {
        const cappedDuration = Math.min(2.0, activeDuration);
        intercepted = Math.round(cappedDuration * 125);
        rate = time >= 3.0 && time < 5.0 ? 125 : 0;
      }
    } else {
      // Academic report benchmark model: 71,822 packets
      const progressRatio = time / maxTime;
      intercepted = mode === 'attack' ? Math.round(71822 * progressRatio) : 0;
      rate = mode === 'attack' ? 2394 : 0;
    }

    return {
      timestamp: time,
      throughput,
      packetsSent: 0,
      packetsDropped: 0,
      packetsIntercepted: intercepted,
      packetsReachingServer: 0,
      attackPacketRate: rate,
      switchTableUtil: 0,
      datasetSource,
    };
  }, [datasetSource, fullChartData]);

  const sim = useSimulation({
    duration: datasetSource === 'measured-ns2' ? 10 : 30,
    tickInterval: datasetSource === 'measured-ns2' ? 200 : 250,
    onTick,
  });

  const resetAll = () => {
    sim.reset();
    setLiveChartData([]);
  };

  const handleDatasetChange = (newSource: DatasetSource) => {
    setDatasetSource(newSource);
    sim.reset();
    setLiveChartData([]);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-cyber-amber" />
            <span className="text-[10px] font-semibold text-cyber-amber uppercase tracking-widest font-mono">Module B — Confidentiality Attack</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">ARP Cache Poisoning & Static ARP Mitigation</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Corrupts endpoint dynamic ARP caches with unsolicited gratuitous replies, silently diverting sensitive client-to-server traffic through an unauthorized eavesdropping host.
          </p>
        </div>

        {/* Dataset Toggle */}
        <div className="bg-navy-800/80 p-1.5 rounded-lg border border-white/10 flex items-center gap-1">
          <button
            onClick={() => handleDatasetChange('measured-ns2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              datasetSource === 'measured-ns2'
                ? 'bg-cyber-blue text-navy-950 font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            NS-2 Scripted Model (sim_arp.tcl)
          </button>
          <button
            onClick={() => handleDatasetChange('report-benchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              datasetSource === 'report-benchmark'
                ? 'bg-cyber-blue text-navy-950 font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Academic Report Benchmark
          </button>
        </div>
      </div>

      <SimulationControls
        mode={sim.mode}
        status={sim.status}
        progress={sim.progress}
        timeElapsed={sim.timeElapsed}
        onSetMode={sim.setMode}
        onStart={() => { setLiveChartData([]); sim.start(); }}
        onPause={sim.pause}
        onResume={sim.resume}
        onReset={resetAll}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Server Throughput"
          value={sim.currentMetrics.throughput.toLocaleString()}
          unit="kbps"
          icon={TrendingUp}
          color="blue"
          subtitle="Maintained across all modes"
        />
        <MetricCard
          label="Packets Intercepted"
          value={sim.currentMetrics.packetsIntercepted.toLocaleString()}
          unit="pkts"
          icon={Eye}
          color={sim.mode === 'attack' ? 'amber' : 'green'}
          subtitle={sim.mode === 'attack' ? 'Traffic diverted via rogue host' : 'Direct path preserved'}
        />
        <MetricCard
          label="ARP Spoof Status"
          value={sim.mode === 'attack' ? 'Poisoning Active' : sim.mode === 'mitigation' ? 'Static Protected' : 'Inactive'}
          icon={AlertTriangle}
          color={sim.mode === 'attack' ? 'red' : 'green'}
        />
        <MetricCard
          label="Defense Mechanism"
          value={sim.mode === 'mitigation' ? 'Static ARP / DAI Active' : 'Dynamic Learning'}
          icon={Lock}
          color={sim.mode === 'mitigation' ? 'green' : 'amber'}
        />
      </div>

      {/* Traffic Path Visualization */}
      <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Enterprise Path Trajectory Inspection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Normal Path */}
          <div className={`rounded-lg border p-3.5 transition-all ${sim.mode === 'baseline' ? 'border-cyber-blue/40 bg-cyber-blue/10' : 'border-white/5 bg-navy-900/40'}`}>
            <p className="text-xs font-semibold text-cyber-blue mb-2">Baseline Legitimate Path</p>
            <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
              <span className="bg-navy-700/80 px-2 py-1 rounded">PC-1</span>
              <span className="text-cyber-blue">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Switch</span>
              <span className="text-cyber-blue">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Server</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Frames travel directly through switch to server; zero traffic leaks to rogue host.</p>
          </div>
          {/* Attack Path */}
          <div className={`rounded-lg border p-3.5 transition-all ${sim.mode === 'attack' ? 'border-cyber-red/40 bg-cyber-red/10' : 'border-white/5 bg-navy-900/40'}`}>
            <p className="text-xs font-semibold text-cyber-red mb-2">Attacked Path (ARP Poisoned MITM)</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono flex-wrap">
              <span className="bg-navy-700/80 px-2 py-1 rounded">PC-1</span>
              <span className="text-amber-400">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Switch</span>
              <span className="text-cyber-red">&rarr;</span>
              <span className="bg-cyber-red/20 text-cyber-red px-2 py-1 rounded font-bold">Attacker</span>
              <span className="text-amber-400">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Server</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Rogue host intercepts and forwards data; users experience normal speeds with zero confidentiality.</p>
          </div>
          {/* Mitigated Path */}
          <div className={`rounded-lg border p-3.5 transition-all ${sim.mode === 'mitigation' ? 'border-cyber-green/40 bg-cyber-green/10' : 'border-white/5 bg-navy-900/40'}`}>
            <p className="text-xs font-semibold text-cyber-green mb-2">Mitigated Path (Static Bindings)</p>
            <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
              <span className="bg-navy-700/80 px-2 py-1 rounded">PC-1</span>
              <span className="text-cyber-green">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Switch</span>
              <span className="text-cyber-green">&rarr;</span>
              <span className="bg-navy-700/80 px-2 py-1 rounded">Server</span>
              <span className="text-cyber-green text-[10px] font-sans font-semibold">✓ Verified</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Dynamic ARP replies ignored; operating system maintains deterministic IP-MAC binding.</p>
          </div>
        </div>
        <TopologyMap mode={sim.mode} attackType="arp-spoof" compact />
      </div>

      {/* Chart */}
      <ThroughputChart
        data={liveChartData.length > 1 ? liveChartData : fullChartData}
        title="Server Throughput — Constant Bandwidth Across Normal, Poisoned & Mitigated States"
        height={280}
      />

      {/* Technical Breakdown & Academic Limitation Disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold text-white">Theoretical Mechanism</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            ARP resolution lacks stateful authentication. When an attacker sends gratuitous ARP replies asserting ownership of the gateway IP (<code className="text-cyber-blue">192.168.1.1 is at Attacker-MAC</code>) and server IP, victim endpoints update their translation tables without questioning the claim.
          </p>
          <div className="p-3 bg-navy-900/60 rounded border border-white/5 text-[11px] font-mono text-gray-300">
            Defense: Cisco Dynamic ARP Inspection (DAI) inspects ARP packets against the DHCP snooping binding database and discards invalid mappings at line-rate.
          </div>
        </div>

        <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5 space-y-2 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            NS-2 Simulation Limitation Disclosure
          </div>
          <p className="leading-relaxed">
            The script <code className="text-white">sim_arp.tcl</code> does not implement an IEEE 802.3 broadcast medium or native ARP protocol cache. It models the macroscopic <em>effect</em> of ARP spoofing by diverting a controlled 1 Mbps UDP stream to the attacker node from <code className="text-white">t=3.0s</code>, which stops upon static mitigation at <code className="text-white">t=5.0s</code>. For true raw frame injection, the project includes Scapy test script <code className="text-white">python_attacks/arp_spoof.py</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
