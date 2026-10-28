import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, Zap, Eye, Lock, Server, Wifi, AlertTriangle, ArrowRight, BarChart3, Terminal } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TopologyMap from '../components/TopologyMap';
import ThroughputChart from '../components/ThroughputChart';
import { generateSynFloodData } from '../data/simulationData';

const attackModules = [
  {
    id: 'syn-flood',
    title: 'UDP/CBR Flood Model',
    subtitle: 'Availability / DoS Model (Approximating SYN Flood)',
    layer: 'Layer 4/3',
    path: '/syn-flood',
    color: 'red' as const,
    icon: Zap,
    description: 'High-rate UDP CBR traffic saturates the shared bottleneck link, modeling throughput collapse and link-cutoff mitigation.',
    metrics: { packets: '78,125 (NS2) / 262k (Rep)', dropped: '47,180 (NS2) / 260k (Rep)', outage: '5s (NS2) / 12s (Rep)' },
    status: 'ready' as const,
  },
  {
    id: 'arp-spoof',
    title: 'ARP Spoofing Diversion',
    subtitle: 'Confidentiality / MITM Behavioral Model',
    layer: 'Layer 2',
    path: '/arp-spoof',
    color: 'amber' as const,
    icon: Eye,
    description: 'Models traffic path redirection to a rogue host; in physical LANs, caused by unsolicited gratuitous ARP poisoning.',
    metrics: { intercepted: '71,822 pkts (Report)', mitigated: '0 pkts', throughput: '~10,000 kbps' },
    status: 'ready' as const,
  },
  {
    id: 'mac-flood',
    title: 'MAC Table Flooding',
    subtitle: 'Layer 2 CAM Exhaustion (Packet Tracer Model)',
    layer: 'Layer 2',
    path: '/mac-flood',
    color: 'purple' as const,
    icon: Wifi,
    description: 'Models unknown-unicast fail-open flooding when switch CAM table fills; mitigated via Cisco port-security violation shutdown.',
    metrics: { frames: '97,657 (Unverified)', flooded: '9,001 leaked', blocked: '977 before shutdown' },
    status: 'ready' as const,
  },
];

export default function Dashboard() {
  const chartData = generateSynFloodData();

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyber-blue status-pulse" />
            <span className="text-[10px] font-semibold text-cyber-blue uppercase tracking-widest">Active Laboratory</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
            Network Attack Simulation
            <span className="text-cyber-blue"> Platform</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Simulation and Mitigation of Layer 2/3 Network Attacks in an Enterprise LAN using NS2, Cisco Packet Tracer and Wireshark
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/results"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all border border-white/5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyber-green" /> View Results & Audit
          </Link>
          <Link
            to="/traffic"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 text-xs font-semibold transition-all border border-cyber-blue/20"
          >
            <Terminal className="w-3.5 h-3.5" /> Traffic Analysis
          </Link>
        </div>
      </div>

      {/* Network Health Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <MetricCard label="Network Status" value="Healthy" icon={Activity} color="green" trend="stable" />
        <MetricCard label="Active Hosts" value={6} icon={Server} color="blue" subtitle="4 legitimate, 1 attacker, 1 monitor" />
        <MetricCard label="Baseline Throughput" value="9,000" unit="kbps" icon={Zap} color="cyan" trend="stable" />
        <MetricCard label="Total Packets Sent" value="262,500" icon={Shield} color="amber" subtitle="SYN flood simulation" />
        <MetricCard label="Packets Dropped" value="260,263" icon={Lock} color="red" subtitle="By mitigation" />
        <MetricCard label="Packets Intercepted" value="71,822" icon={Eye} color="purple" subtitle="ARP spoof (unmitigated)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Topology Overview */}
        <div className="xl:col-span-2 bg-navy-800 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Enterprise LAN Topology</h2>
            <Link to="/topology" className="text-[10px] text-cyber-blue hover:text-cyan-300 font-medium flex items-center gap-1">
              Full View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <TopologyMap mode="baseline" attackType="none" compact />
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Click any device for details • Simulated topology — not a live network
          </p>
        </div>

        {/* Attack Modules */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Attack Modules</h2>
          {attackModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                to={mod.path}
                className="block bg-navy-800 rounded-xl border border-white/5 p-4 card-hover group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    mod.color === 'red' ? 'bg-red-500/10' :
                    mod.color === 'amber' ? 'bg-amber-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      mod.color === 'red' ? 'text-red-400' :
                      mod.color === 'amber' ? 'text-amber-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyber-blue transition-colors">
                        {mod.title}
                      </h3>
                      <span className="text-[9px] font-mono text-gray-600 bg-navy-700 px-1.5 py-0.5 rounded">
                        {mod.layer}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1.5">{mod.subtitle}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{mod.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
                      <span className="text-[10px] text-gray-500">Simulation Ready</span>
                      <ArrowRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-cyber-blue transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Throughput Overview Chart */}
      <ThroughputChart
        data={chartData}
        title="TCP SYN Flood — Throughput Comparison (Baseline vs Attack vs Mitigation)"
        showArea
      />

      {/* Comparison Quick Stats */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Attack Comparison Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-500 font-medium py-2 px-3">Attack</th>
                <th className="text-left text-gray-500 font-medium py-2 px-3">Layer</th>
                <th className="text-left text-gray-500 font-medium py-2 px-3">CIA Impact</th>
                <th className="text-right text-gray-500 font-medium py-2 px-3">Baseline</th>
                <th className="text-right text-gray-500 font-medium py-2 px-3">Under Attack</th>
                <th className="text-right text-gray-500 font-medium py-2 px-3">Mitigated</th>
                <th className="text-left text-gray-500 font-medium py-2 px-3">Mitigation</th>
                <th className="text-right text-gray-500 font-medium py-2 px-3">Effectiveness</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 text-white font-semibold">TCP SYN Flood</td>
                <td className="py-2.5 px-3 text-gray-400">Layer 3/4</td>
                <td className="py-2.5 px-3"><span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">Availability</span></td>
                <td className="py-2.5 px-3 text-right text-cyber-blue font-mono">9,000 kbps</td>
                <td className="py-2.5 px-3 text-right text-red-400 font-mono">0 kbps</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">~8,898 kbps</td>
                <td className="py-2.5 px-3 text-gray-400">Router ACL</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">99.15%</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 text-white font-semibold">ARP Spoofing</td>
                <td className="py-2.5 px-3 text-gray-400">Layer 2</td>
                <td className="py-2.5 px-3"><span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">Confidentiality</span></td>
                <td className="py-2.5 px-3 text-right text-cyber-blue font-mono">10,000 kbps</td>
                <td className="py-2.5 px-3 text-right text-amber-400 font-mono">10,000 kbps</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">10,000 kbps</td>
                <td className="py-2.5 px-3 text-gray-400">Static ARP</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">100%</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 text-white font-semibold">MAC Flooding</td>
                <td className="py-2.5 px-3 text-gray-400">Layer 2</td>
                <td className="py-2.5 px-3"><span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">Confidentiality</span></td>
                <td className="py-2.5 px-3 text-right text-cyber-blue font-mono">9,000 kbps</td>
                <td className="py-2.5 px-3 text-right text-purple-400 font-mono">9,000 kbps</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">9,000 kbps</td>
                <td className="py-2.5 px-3 text-gray-400">Port Security</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-600 mt-3">
          All values sourced from the academic report. Throughput values represent legitimate TCP traffic as measured in NS2 simulations.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-navy-800/50 rounded-xl border border-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-amber-400 mb-1">Simulation Disclaimer</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              This platform displays simulated attack and traffic data for educational purposes. No actual network attacks are performed,
              no live packets are captured, and no real devices are compromised. The NS2 experiments use UDP/CBR traffic as an approximation
              for some attack types. All results are sourced from the academic laboratory report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
