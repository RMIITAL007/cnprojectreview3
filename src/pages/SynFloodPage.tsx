import React, { useCallback, useState } from 'react';
import { Zap, Shield, AlertTriangle, TrendingUp, Server, Ban, Database, CheckCircle2, FileText } from 'lucide-react';
import SimulationControls from '../components/SimulationControls';
import MetricCard from '../components/MetricCard';
import ThroughputChart from '../components/ThroughputChart';
import TopologyMap from '../components/TopologyMap';
import { useSimulation } from '../hooks/useSimulation';
import { generateSynFloodData, traceAuditSummary } from '../data/simulationData';
import { SimulationMode, SimulationMetrics, ChartDataPoint, DatasetSource } from '../types';

export default function SynFloodPage() {
  const [datasetSource, setDatasetSource] = useState<DatasetSource>('measured-ns2');
  const [liveChartData, setLiveChartData] = useState<ChartDataPoint[]>([]);

  const fullChartData = generateSynFloodData(datasetSource);

  const onTick = useCallback((time: number, mode: SimulationMode): SimulationMetrics => {
    const isNs2 = datasetSource === 'measured-ns2';
    const maxLen = fullChartData.length;
    // Map time proportionally to dataset length
    const maxTime = isNs2 ? 10 : 30;
    const normalizedIndex = Math.min(Math.floor((time / maxTime) * (maxLen - 1)), maxLen - 1);
    const point = fullChartData[normalizedIndex] || fullChartData[maxLen - 1];

    setLiveChartData(prev => {
      if (prev.length <= normalizedIndex) {
        return [...prev, point];
      }
      return prev;
    });

    const throughput = mode === 'baseline' ? point.baseline :
                       mode === 'attack' ? point.attack :
                       point.mitigation;

    let totalAttackPackets = 0;
    let dropped = 0;
    let reaching = 0;
    let attackRate = 0;

    if (isNs2) {
      // NS-2 measured trace values from sim.tcl / attack.tr / mitigated.tr
      const progressRatio = time / maxTime;
      if (mode === 'attack') {
        totalAttackPackets = Math.round(421594 * progressRatio);
        dropped = Math.round(47180 * progressRatio);
        reaching = Math.round(30969 * progressRatio);
        attackRate = time >= 3 && time <= 8 ? 15625 : 0; // 5 Mbps / 40 bytes = 15,625 pkts/s
      } else if (mode === 'mitigation') {
        totalAttackPackets = Math.round(83906 * progressRatio);
        dropped = Math.round(9710 * progressRatio);
        reaching = Math.round(5937 * progressRatio);
        attackRate = time >= 3 && time < 4 ? 15625 : 0;
      }
    } else {
      // Academic report benchmark values (10 Mbps model)
      const progressRatio = time / maxTime;
      totalAttackPackets = mode !== 'baseline' ? Math.round(262500 * progressRatio) : 0;
      dropped = mode === 'mitigation' ? Math.round(260263 * progressRatio) : 0;
      reaching = mode === 'mitigation' ? Math.round(2237 * progressRatio) :
                 mode === 'attack' ? Math.round(262500 * progressRatio) : 0;
      attackRate = mode !== 'baseline' && time >= 5 && time < 20 ? 17500 : 0;
    }

    return {
      timestamp: time,
      throughput,
      packetsSent: Math.round(totalAttackPackets),
      packetsDropped: dropped,
      packetsIntercepted: 0,
      packetsReachingServer: reaching,
      attackPacketRate: attackRate,
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
            <Zap className="w-4 h-4 text-cyber-red" />
            <span className="text-[10px] font-semibold text-cyber-red uppercase tracking-widest font-mono">Module A — Availability Attack Model</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">UDP/CBR Flood & Congestion Mitigation Model</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Simulates bottleneck queue congestion using high-rate UDP/CBR traffic as an approximation of volumetric denial-of-service, modeling throughput collapse and link-cutoff mitigation. (Note: Approximates link congestion rather than stateful TCP handshake exhaustion).
          </p>
        </div>

        {/* Dataset Source Toggle */}
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
            Measured NS-2 Trace (sim.tcl)
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

      {/* Dataset Context Alert */}
      <div className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        datasetSource === 'measured-ns2'
          ? 'bg-cyber-blue/10 border-cyber-blue/20 text-cyan-200'
          : 'bg-purple-900/20 border-purple-500/20 text-purple-200'
      }`}>
        <div className="flex items-start gap-2.5">
          {datasetSource === 'measured-ns2' ? (
            <Database className="w-4 h-4 text-cyber-blue shrink-0 mt-0.5" />
          ) : (
            <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="font-semibold text-white">
              {datasetSource === 'measured-ns2'
                ? 'Active Dataset: Ground-Truth NS-2.35 Trace (2 Mbps Link Bottleneck)'
                : 'Active Dataset: Academic Review 3 Target Benchmark (10 Mbps Full-LAN Model)'}
            </strong>
            <p className="mt-0.5 text-gray-300">
              {datasetSource === 'measured-ns2'
                ? 'Generated from actual executable script sim.tcl and parsed from baseline.tr, attack.tr, and mitigated.tr (2 Mbps router-server link, 5 Mbps UDP CBR flood, 0.5s bins).'
                : 'Scaled theoretical model used in academic documentation (10 Mbps link with 262,500 total attack packets, 260,263 ACL drops, and ~12s unmitigated outage).'}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[11px] px-2.5 py-1 rounded bg-black/40 border border-white/10">
          {datasetSource === 'measured-ns2' ? 'Duration: 10.0s | Bins: 20' : 'Duration: 30.0s | Bins: 31'}
        </span>
      </div>

      {/* Controls */}
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

      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Legitimate Server Throughput"
          value={sim.currentMetrics.throughput.toLocaleString()}
          unit="kbps"
          icon={TrendingUp}
          color={sim.mode === 'attack' && sim.currentMetrics.throughput < 500 ? 'red' : 'blue'}
          trend={sim.currentMetrics.throughput > (datasetSource === 'measured-ns2' ? 1500 : 7000) ? 'up' : sim.currentMetrics.throughput === 0 ? 'down' : 'stable'}
        />
        <MetricCard
          label="Attack Packets Logged"
          value={sim.currentMetrics.packetsSent.toLocaleString()}
          unit="pkts"
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          label="Packets Dropped by Mitigation"
          value={sim.currentMetrics.packetsDropped.toLocaleString()}
          unit="pkts"
          icon={Ban}
          color="green"
        />
        <MetricCard
          label="Attack Ingress Reaching Server"
          value={sim.currentMetrics.packetsReachingServer.toLocaleString()}
          unit="pkts"
          icon={Server}
          color={sim.mode === 'attack' ? 'red' : 'green'}
        />
      </div>

      {/* Main Grid: Chart + Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live Throughput Telemetry</h3>
            <span className="text-xs font-mono text-gray-400">
              {datasetSource === 'measured-ns2' ? 'Throughput (kbps) vs Time (s)' : 'Throughput (kbps) vs Time (s)'}
            </span>
          </div>
          <ThroughputChart
            data={liveChartData.length > 0 ? liveChartData : fullChartData}
            title={datasetSource === 'measured-ns2' ? 'NS-2 Trace Goodput (sim.tcl Output)' : 'Enterprise LAN Target Goodput'}
            yUnit="kbps"
          />
        </div>

        <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Topology Interaction & Traffic State</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-navy-900 text-cyber-blue border border-cyber-blue/20">
              Mode: {sim.mode.toUpperCase()}
            </span>
          </div>
          <TopologyMap mode={sim.mode} attackType="syn-flood" />
        </div>
      </div>

      {/* Trace Audit Evidence Panel */}
      <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyber-green" />
          Raw NS-2 Trace File Verification (simulation/results/)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {traceAuditSummary.map((item, idx) => (
            <div key={idx} className="bg-navy-900/60 p-3.5 rounded-lg border border-white/5 space-y-1.5">
              <div className="font-semibold text-white border-b border-white/5 pb-1">{item.mode}</div>
              <div className="text-gray-400">Trace Lines: <span className="text-cyber-blue font-semibold">{item.totalLines.toLocaleString()}</span> ({item.fileSizeMb} MB)</div>
              <div className="text-gray-400">Queue Drops: <span className="text-cyber-red font-semibold">{item.totalDrops.toLocaleString()}</span></div>
              <div className="text-gray-400">Legit Ingress: <span className="text-cyber-green font-semibold">{item.legitServerPackets.toLocaleString()} pkts</span></div>
              <div className="text-gray-400">Full 10s Mean: <span className="text-amber-400 font-bold">{item.avgLegitThroughputMbps.toFixed(4)} Mbps</span></div>
              {item.recoveredSteadyStateThroughputMbps !== undefined && (
                <div className="text-gray-400">Recovered (t≥5s): <span className="text-cyber-green font-bold">{item.recoveredSteadyStateThroughputMbps.toFixed(4)} Mbps</span></div>
              )}
              {item.note && <div className="text-[10px] text-gray-400 font-sans italic pt-1 border-t border-white/5">{item.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Technical Disclosure */}
      <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5 text-xs text-amber-200/90 leading-relaxed">
        <strong className="text-amber-400 font-semibold block mb-1">NS-2 Modeling Limitation Disclosure:</strong>
        In standard NS-2 wired configurations, transport agents implement abstract state queues rather than true kernel-level Transmission Control Block (TCB) half-open tables. The simulation script <code className="text-white">sim.tcl</code> generates a high-volume UDP CBR flow (5 Mbps, 40-byte datagrams) to saturate the shared bottleneck router link. While this accurately models packet loss and throughput collapse, physical TCP SYN attacks deplete memory structures via spoofed handshakes rather than raw volumetric link bandwidth alone.
      </div>
    </div>
  );
}
