import React, { useState } from 'react';
import { BarChart3, CheckCircle, AlertTriangle, Shield, Database, FileText, CheckCircle2, Search } from 'lucide-react';
import ThroughputChart from '../components/ThroughputChart';
import {
  generateSynFloodData,
  generateArpSpoofData,
  generateMacFloodData,
  attackResults,
  traceAuditSummary,
  discrepancyMatrix,
} from '../data/simulationData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const effectivenessData = attackResults.map(r => ({
  name: r.attackName.split('/')[0].trim(),
  effectiveness: r.effectiveness,
  color: r.attackType === 'syn-flood' ? '#ef4444' : r.attackType === 'arp-spoof' ? '#f59e0b' : '#8b5cf6',
}));

const throughputComparison = attackResults.map(r => ({
  name: r.attackName.split('/')[0].trim(),
  baseline: r.baselineThroughput,
  attack: r.attackThroughput,
  mitigated: r.mitigatedThroughput,
}));

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'audit' | 'discrepancy'>('comparison');
  const [filterText, setFilterText] = useState('');

  const synData = generateSynFloodData('report-benchmark');
  const synDataNs2 = generateSynFloodData('measured-ns2');
  const arpData = generateArpSpoofData('report-benchmark');
  const macData = generateMacFloodData();

  const filteredDiscrepancies = discrepancyMatrix.filter(item =>
    item.claim.toLowerCase().includes(filterText.toLowerCase()) ||
    item.status.toLowerCase().includes(filterText.toLowerCase()) ||
    item.sourceEvidence.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyber-green" />
            <span className="text-[10px] font-semibold text-cyber-green uppercase tracking-widest font-mono">Experiment Verification</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Experiment Results & Discrepancy Audit</h1>
          <p className="text-sm text-gray-400 mt-1">
            Empirical benchmark analytics, cross-attack comparisons, and line-by-line traceability against actual NS-2 trace files.
          </p>
        </div>

        {/* View Selection Tabs */}
        <div className="bg-navy-800/80 p-1.5 rounded-lg border border-white/10 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'comparison', label: '1. Benchmark Results', icon: BarChart3 },
            { id: 'audit', label: '2. Raw NS-2 Trace Audit', icon: Database },
            { id: 'discrepancy', label: '3. Discrepancy Matrix', icon: AlertTriangle },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyber-blue text-navy-950 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Benchmark Results */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 overflow-hidden">
            <h3 className="text-sm font-semibold text-white mb-3">Enterprise Cross-Attack Benchmark Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-mono">
                    <th className="text-left py-2.5 px-3">Evaluation Metric</th>
                    <th className="text-center text-cyber-red py-2.5 px-3">TCP SYN Flood</th>
                    <th className="text-center text-cyber-amber py-2.5 px-3">ARP Cache Poisoning</th>
                    <th className="text-center text-purple-400 py-2.5 px-3">MAC Address Flooding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {[
                    { metric: 'OSI Protocol Layer', syn: 'Layer 4 / Layer 3 (Transport/Network)', arp: 'Layer 2 (Data Link)', mac: 'Layer 2 (Data Link)' },
                    { metric: 'Primary CIA Impact', syn: 'Availability (DoS)', arp: 'Confidentiality & Integrity (MITM)', mac: 'Confidentiality (CAM Overflow)' },
                    { metric: 'Baseline Goodput', syn: '~9,000 kbps (10M Model) / 1,983 kbps (NS2)', arp: '~10,000 kbps', mac: '~9,000 kbps' },
                    { metric: 'Goodput Under Attack', syn: '0 kbps (Total Outage)', arp: '~10,000 kbps (Stealthy)', mac: '~9,000 kbps (Unchanged)' },
                    { metric: 'Mitigated Goodput', syn: '8,894–8,902 kbps (99% baseline)', arp: '~10,000 kbps (Direct)', mac: '~9,000 kbps (Direct)' },
                    { metric: 'Simulated Attack Load', syn: '262,500 pkts (Report) / 421k (NS2)', arp: '71,822 diverted pkts', mac: '97,657 random frames' },
                    { metric: 'Packets Leaked / Intercepted', syn: '2,237 reaching server', arp: '71,822 pkts intercepted', mac: '9,001 flooded copies' },
                    { metric: 'Dropped / Blocked by Defense', syn: '260,263 pkts (99.1%)', arp: '0 pkts diverted with static ARP', mac: '96,680 frames (Port Shutdown)' },
                    { metric: 'Outage Window Duration', syn: '~12 seconds (Report) / 5s (NS2)', arp: 'None (Passive eavesdropping)', mac: 'None (Unicast flooding)' },
                    { metric: 'Cisco Mitigation Control', syn: 'Router Ingress ACL 101 + Rate Limit', arp: 'Static ARP Binding / Cisco DAI', mac: 'Switchport Port Security Shutdown' },
                    { metric: 'Mitigation Effectiveness', syn: '99.15% (Loss Restored)', arp: '100% (Interception Zeroed)', mac: '100% (Leakage Zeroed)' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-gray-400 font-medium">{row.metric}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-gray-200">{row.syn}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-gray-200">{row.arp}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-gray-200">{row.mac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Mitigation Filtering Effectiveness (%)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={effectivenessData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <YAxis domain={[95, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number) => [`${value}%`, 'Mitigation Ratio']}
                  />
                  <Bar dataKey="effectiveness" radius={[6, 6, 0, 0]}>
                    {effectivenessData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Throughput Benchmark Comparison (kbps)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={throughputComparison} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                  <Legend formatter={(value: string) => <span className="text-xs text-gray-400">{value}</span>} />
                  <Bar dataKey="baseline" name="Baseline" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attack" name="Under Attack" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mitigated" name="Mitigated" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Charts Comparison */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Dynamic Telemetry Curves</h3>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <ThroughputChart data={synData} title="TCP SYN Flood (10M Model)" height={220} />
              <ThroughputChart data={arpData} title="ARP Cache Poisoning" height={220} />
              <ThroughputChart data={macData} title="Switch MAC Flooding" height={220} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Raw NS-2 Trace Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyber-blue" />
              Executable Trace Parser & File Verification
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              The metrics below are parsed directly from the genuine NS-2 trace files (<code className="text-cyber-blue">baseline.tr</code>, <code className="text-cyber-red">attack.tr</code>, and <code className="text-cyber-green">mitigated.tr</code>) located in <code className="text-white">simulation/results/</code> using the audit script <code className="text-white">simulation/verify_traces.py</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs mb-6">
              {traceAuditSummary.map((item, idx) => (
                <div key={idx} className="bg-navy-900/80 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="font-bold text-white border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>{item.mode}</span>
                    <span className="text-[10px] text-gray-400 font-sans px-2 py-0.5 rounded bg-black/40">{item.fileSizeMb} MB</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Total Trace Events:</span>
                    <span className="text-cyber-blue font-semibold">{item.totalLines.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Logged Packet Drops:</span>
                    <span className="text-cyber-red font-semibold">{item.totalDrops.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Legit Pkts at Server:</span>
                    <span className="text-cyber-green font-semibold">{item.legitServerPackets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Flood Pkts at Server:</span>
                    <span className="text-amber-400 font-semibold">{item.floodServerPackets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 pt-1 border-t border-white/5">
                    <span>Full 10s Mean Goodput:</span>
                    <span className="text-white font-bold">{item.avgLegitThroughputMbps.toFixed(4)} Mbps</span>
                  </div>
                  {item.recoveredSteadyStateThroughputMbps !== undefined && (
                    <div className="flex justify-between text-gray-400">
                      <span>Recovered (t≥5s):</span>
                      <span className="text-cyber-green font-bold">{item.recoveredSteadyStateThroughputMbps.toFixed(4)} Mbps</span>
                    </div>
                  )}
                  {item.attackWindowThroughputMbps !== undefined && (
                    <div className="flex justify-between text-gray-400">
                      <span>Attack Phase (3-8s):</span>
                      <span className="text-amber-400 font-semibold">{item.attackWindowThroughputMbps.toFixed(4)} Mbps</span>
                    </div>
                  )}
                  {item.note && (
                    <p className="text-[10px] text-gray-400 font-sans italic pt-1 border-t border-white/5 leading-tight">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* NS2 Measured Chart */}
            <div className="bg-navy-900/60 p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-xs font-semibold text-white">NS-2 sim.tcl 2 Mbps Bottleneck Goodput Telemetry (Measured in 0.5s Bins)</h4>
              <ThroughputChart data={synDataNs2} title="Measured sim.tcl Trace Output" height={240} yUnit="kbps" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Discrepancy Matrix */}
      {activeTab === 'discrepancy' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-800/60 p-4 rounded-xl border border-white/5">
            <div>
              <h3 className="text-sm font-semibold text-white">Phase 6 Discrepancy & Traceability Audit Matrix</h3>
              <p className="text-xs text-gray-400">Comprehensive reconciliation between academic report claims, executable source code, and website displays.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search claims or status..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full bg-navy-900/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-navy-800/60 rounded-xl border border-white/5">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-mono">
                  <th className="py-2.5 px-4 w-1/4">Claim in Report or Website</th>
                  <th className="py-2.5 px-4 w-1/4">Evidence in Source Code</th>
                  <th className="py-2.5 px-4 w-1/5">Validation Performed</th>
                  <th className="py-2.5 px-3 text-center">Audit Status</th>
                  <th className="py-2.5 px-4 w-1/4">Required / Implemented Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredDiscrepancies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] align-top">
                    <td className="py-3 px-4 font-semibold text-white">{item.claim}</td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-[11px] leading-relaxed">{item.sourceEvidence}</td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">{item.validationPerformed}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap ${
                        item.status === 'Verified' ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' :
                        item.status === 'Partially verified' ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30' :
                        item.status === 'Simulated approximation' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                        item.status === 'Hardcoded/demo data' ? 'bg-purple-400/20 text-purple-400 border border-purple-400/30' :
                        'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-[11px] leading-relaxed">{item.requiredAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
