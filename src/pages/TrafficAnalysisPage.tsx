import React, { useState, useMemo } from 'react';
import { Search, Filter, Info, Copy, Check, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { generatePacketData } from '../data/simulationData';
import { PacketEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const filterExamples = [
  { label: 'TCP SYN Packets', filter: 'tcp.flags.syn == 1 && tcp.flags.ack == 0', desc: 'Display only initial SYN packets (connection requests)' },
  { label: 'ARP Replies', filter: 'arp.opcode == 2', desc: 'Display ARP reply packets (potential spoofing indicators)' },
  { label: 'Ethernet Frames', filter: 'eth', desc: 'Display all Ethernet-level frames' },
  { label: 'Blocked Packets', filter: 'blocked', desc: 'Show packets blocked by ACL or port security' },
  { label: 'All Attack Traffic', filter: 'attack', desc: 'Show all attack-related packets' },
];

function getRowColor(type: string) {
  switch (type) {
    case 'syn': return 'bg-purple-500/5 hover:bg-purple-500/10';
    case 'normal': return 'hover:bg-white/[0.03]';
    case 'arp': return 'bg-amber-500/5 hover:bg-amber-500/10';
    case 'attack': return 'bg-red-500/5 hover:bg-red-500/10';
    case 'flood': return 'bg-red-500/8 hover:bg-red-500/12';
    case 'blocked': return 'bg-emerald-500/5 hover:bg-emerald-500/10';
    default: return 'hover:bg-white/[0.03]';
  }
}

function getProtocolColor(protocol: string) {
  switch (protocol) {
    case 'TCP': return 'text-purple-400';
    case 'HTTP': return 'text-cyber-blue';
    case 'ARP': return 'text-amber-400';
    case 'ICMP': return 'text-cyan-400';
    case 'Ethernet': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export default function TrafficAnalysisPage() {
  const [filterText, setFilterText] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<PacketEntry | null>(null);
  const [copiedFilter, setCopiedFilter] = useState('');

  const packets = useMemo(() => generatePacketData(filterText || undefined), [filterText]);

  const protocolStats = useMemo(() => {
    const allPackets = generatePacketData();
    const counts: Record<string, number> = {};
    allPackets.forEach(p => { counts[p.protocol] = (counts[p.protocol] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, []);

  const copyFilter = (f: string) => {
    setFilterText(f);
    setCopiedFilter(f);
    setTimeout(() => setCopiedFilter(''), 1500);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-cyber-cyan" />
          <span className="text-[10px] font-semibold text-cyber-cyan uppercase tracking-widest">Network Protocol Analyser</span>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Traffic Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wireshark-inspired packet inspection interface. Displaying simulated/imported packet data for educational analysis.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Apply display filter (e.g., tcp.flags.syn, arp, eth, blocked)..."
              className="w-full pl-9 pr-4 py-2 bg-navy-900 border border-white/10 rounded-lg text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-cyber-blue/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setFilterText('')}
            className="px-3 py-2 bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-medium"
          >
            Clear
          </button>
        </div>

        {/* Filter Examples */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-gray-600 py-1">Quick filters:</span>
          {filterExamples.map((f) => (
            <button
              key={f.filter}
              onClick={() => copyFilter(f.filter)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                filterText === f.filter
                  ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-transparent'
              }`}
              title={f.desc}
            >
              {copiedFilter === f.filter ? <Check className="w-3 h-3 text-emerald-400" /> : <Filter className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Packet Table */}
        <div className="xl:col-span-2 bg-navy-800 rounded-xl border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400">
              Packet List — <span className="text-white">{packets.length} packets</span>
            </h3>
            <span className="text-[10px] text-gray-600">Simulated data</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-navy-700/50 border-b border-white/5">
                  <th className="text-left text-gray-500 font-medium py-2 px-3 w-10">#</th>
                  <th className="text-left text-gray-500 font-medium py-2 px-3">Time</th>
                  <th className="text-left text-gray-500 font-medium py-2 px-3">Source</th>
                  <th className="text-left text-gray-500 font-medium py-2 px-3">Destination</th>
                  <th className="text-left text-gray-500 font-medium py-2 px-3 w-16">Protocol</th>
                  <th className="text-right text-gray-500 font-medium py-2 px-3 w-12">Len</th>
                  <th className="text-left text-gray-500 font-medium py-2 px-3">Info</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((pkt) => (
                  <tr
                    key={pkt.id}
                    className={`border-b border-white/[0.03] cursor-pointer transition-colors ${getRowColor(pkt.type)} ${
                      selectedPacket?.id === pkt.id ? 'ring-1 ring-cyber-blue/30' : ''
                    }`}
                    onClick={() => setSelectedPacket(pkt)}
                  >
                    <td className="py-1.5 px-3 text-gray-600 font-mono">{pkt.id}</td>
                    <td className="py-1.5 px-3 text-gray-400 font-mono">{pkt.timestamp}</td>
                    <td className="py-1.5 px-3 text-gray-300 font-mono">{pkt.source}</td>
                    <td className="py-1.5 px-3 text-gray-300 font-mono">{pkt.destination}</td>
                    <td className={`py-1.5 px-3 font-mono font-semibold ${getProtocolColor(pkt.protocol)}`}>{pkt.protocol}</td>
                    <td className="py-1.5 px-3 text-gray-400 font-mono text-right">{pkt.length}</td>
                    <td className="py-1.5 px-3 text-gray-400 max-w-[300px] truncate">{pkt.info}</td>
                  </tr>
                ))}
                {packets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-600 text-xs">
                      No packets match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Details + Stats */}
        <div className="space-y-4">
          {/* Packet Detail Panel */}
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-3">Packet Details</h3>
            {selectedPacket ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <ChevronDown className="w-3 h-3 text-cyber-blue" />
                    Frame {selectedPacket.id}: {selectedPacket.length} bytes
                  </div>
                  <div className="pl-4 space-y-0.5 text-gray-400 font-mono text-[10px]">
                    <p>Src MAC: <span className="text-gray-300">{selectedPacket.details.srcMac}</span></p>
                    <p>Dst MAC: <span className="text-gray-300">{selectedPacket.details.dstMac}</span></p>
                    <p>Type: <span className={getProtocolColor(selectedPacket.protocol)}>{selectedPacket.protocol}</span></p>
                  </div>
                </div>

                {selectedPacket.protocol !== 'Ethernet' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <ChevronDown className="w-3 h-3 text-cyber-blue" />
                      {selectedPacket.protocol} Layer
                    </div>
                    <div className="pl-4 space-y-0.5 text-gray-400 font-mono text-[10px]">
                      <p>Source: <span className="text-gray-300">{selectedPacket.source}</span></p>
                      <p>Destination: <span className="text-gray-300">{selectedPacket.destination}</span></p>
                      {selectedPacket.details.srcPort && (
                        <p>Src Port: <span className="text-gray-300">{selectedPacket.details.srcPort}</span></p>
                      )}
                      {selectedPacket.details.dstPort && (
                        <p>Dst Port: <span className="text-gray-300">{selectedPacket.details.dstPort}</span></p>
                      )}
                      {selectedPacket.details.flags && (
                        <p>Flags: <span className="text-purple-400">[{selectedPacket.details.flags}]</span></p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPacket.details.payload && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <ChevronRight className="w-3 h-3 text-cyber-blue" />
                      Payload
                    </div>
                    <pre className="pl-4 text-[10px] text-gray-400 font-mono bg-navy-900 p-2 rounded border border-white/5 overflow-x-auto">
                      {selectedPacket.details.payload}
                    </pre>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    selectedPacket.type === 'normal' ? 'bg-cyber-blue/10 text-cyber-blue' :
                    selectedPacket.type === 'syn' ? 'bg-purple-500/10 text-purple-400' :
                    selectedPacket.type === 'arp' ? 'bg-amber-500/10 text-amber-400' :
                    selectedPacket.type === 'flood' ? 'bg-red-500/10 text-red-400' :
                    selectedPacket.type === 'blocked' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {selectedPacket.type === 'normal' ? 'Legitimate Traffic' :
                     selectedPacket.type === 'syn' ? 'TCP SYN (potential flood)' :
                     selectedPacket.type === 'arp' ? 'ARP (potential spoof)' :
                     selectedPacket.type === 'flood' ? 'MAC Flood Frame' :
                     selectedPacket.type === 'blocked' ? 'Blocked by Mitigation' :
                     selectedPacket.type}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 text-center py-6">Select a packet from the table to view details.</p>
            )}
          </div>

          {/* Protocol Distribution */}
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-3">Protocol Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={protocolStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1528', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="count" fill="#00b4d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Reference */}
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-3">Wireshark Filter Reference</h3>
            <div className="space-y-2">
              {filterExamples.slice(0, 3).map((f) => (
                <div key={f.filter} className="bg-navy-900 rounded-lg p-2 border border-white/5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-gray-500">{f.label}</span>
                    <button
                      onClick={() => copyFilter(f.filter)}
                      className="text-gray-600 hover:text-cyber-blue"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <code className="text-[10px] text-cyber-cyan font-mono">{f.filter}</code>
                  <p className="text-[9px] text-gray-600 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 text-gray-600 shrink-0" />
        <p>
          This interface displays simulated packet data for educational purposes. The entries represent typical packet captures
          you would see during the laboratory experiments. No live traffic capture is performed by this web application.
        </p>
      </div>
    </div>
  );
}
