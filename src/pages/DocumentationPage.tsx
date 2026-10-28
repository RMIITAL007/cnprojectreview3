import React, { useState } from 'react';
import { BookOpen, Shield, Network, Terminal, CheckCircle2, AlertTriangle, Layers, Cpu, Database, ChevronRight, HelpCircle } from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'attacks' | 'mitigations' | 'tools' | 'viva'>('overview');

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20">
              Academic Reference & Viva Guide
            </span>
            <span className="text-xs text-gray-500 font-mono">CN-LAB-REV3</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Documentation & Theoretical Framework
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Complete formal specification, methodology, tool roles, and viva examination preparation.
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-navy-800/80 p-1 rounded-lg border border-white/5 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Project Overview', icon: BookOpen },
            { id: 'attacks', label: '2. Layer 2/3 Attacks', icon: AlertTriangle },
            { id: 'mitigations', label: '3. Mitigations', icon: Shield },
            { id: 'tools', label: '4. Simulation Tool Roles', icon: Layers },
            { id: 'viva', label: '5. Viva Prep Q&A', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-cyber-blue text-navy-900 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Overview & Methodology */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Abstract */}
              <div className="bg-navy-800/60 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyber-blue" />
                  Project Abstract
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Enterprise Local Area Networks (LANs) rely fundamentally on the unauthenticated assumptions of traditional Ethernet switches and standard IP/TCP protocol stacks. Vulnerabilities located at Layer 2 (Data Link) and Layer 3 (Network) represent high-severity threat vectors because perimeter firewalls typically do not inspect internal LAN frames. This project evaluates, simulates, and benchmarks three canonical network layer attacks: <strong>TCP SYN Flooding (Availability/L4-L3)</strong>, <strong>ARP Cache Poisoning / Spoofing (Confidentiality & Integrity/L2)</strong>, and <strong>Switch MAC Address Table Flooding (CAM Table Exhaustion/L2)</strong>. Using combined instrumentation from Network Simulator 2 (NS2), Cisco Packet Tracer, and Wireshark protocol analysis, this study demonstrates both unmitigated attack degradation and the quantifiable resilience delivered by Cisco IOS switchport port security, edge Access Control Lists (ACLs), and static ARP binding.
                </p>
              </div>

              {/* Problem Statement & Objectives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
                  <h3 className="text-sm font-semibold text-cyber-red mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Problem Statement
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Default switch operating modes treat all connected internal access ports as trusted domains. Inherent protocol weaknesses—such as stateless ARP resolution without cryptographic verification, lack of CAM table state exhaustion thresholds, and asymmetric TCP three-way handshake allocation—allow rogue inside entities to disable core services, eavesdrop on isolated switched traffic, and hijack enterprise default gateways.
                  </p>
                </div>

                <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
                  <h3 className="text-sm font-semibold text-cyber-green mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Core Project Objectives
                  </h3>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>Simulate deterministic Layer 2/3 attack vectors in a standardized enterprise topology.</li>
                    <li>Inspect packet syntax, forged headers, and handshake anomalies via Wireshark filters.</li>
                    <li>Quantify empirical performance metrics: throughput (kbps), packet delivery ratio, and loss.</li>
                    <li>Formulate, apply, and validate defensive Cisco IOS mitigation controls.</li>
                    <li>Disclose experimental limitations between discrete simulator abstractions and physical silicon.</li>
                  </ul>
                </div>
              </div>

              {/* Topology Architecture Summary */}
              <div className="bg-navy-800/60 rounded-xl border border-white/5 p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyber-blue" />
                  Enterprise Network Architecture
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 font-mono">
                        <th className="py-2 pr-4">Node Designation</th>
                        <th className="py-2 px-4">Role</th>
                        <th className="py-2 px-4">IP Address</th>
                        <th className="py-2 px-4">MAC Address</th>
                        <th className="py-2 pl-4">Switch Port</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">Target Server</td>
                        <td className="py-2.5 px-4 text-gray-400">HTTP / Application Host</td>
                        <td className="py-2.5 px-4 text-cyber-blue">192.168.1.100</td>
                        <td className="py-2.5 px-4">00:50:79:66:68:00</td>
                        <td className="py-2.5 pl-4">FastEthernet 0/1</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">PC-1 (User 1)</td>
                        <td className="py-2.5 px-4 text-gray-400">Legitimate Workstation</td>
                        <td className="py-2.5 px-4 text-cyber-green">192.168.1.10</td>
                        <td className="py-2.5 px-4">00:50:79:66:68:01</td>
                        <td className="py-2.5 pl-4">FastEthernet 0/2</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">Attacker Host</td>
                        <td className="py-2.5 px-4 text-gray-400">Rogue Internal Machine</td>
                        <td className="py-2.5 px-4 text-cyber-red">192.168.1.50</td>
                        <td className="py-2.5 px-4">00:50:79:66:68:99</td>
                        <td className="py-2.5 pl-4">FastEthernet 0/3</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">PC-2 (User 2)</td>
                        <td className="py-2.5 px-4 text-gray-400">Legitimate Workstation</td>
                        <td className="py-2.5 px-4 text-cyber-green">192.168.1.20</td>
                        <td className="py-2.5 px-4">00:50:79:66:68:02</td>
                        <td className="py-2.5 pl-4">FastEthernet 0/4</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">Cisco Catalyst Switch</td>
                        <td className="py-2.5 px-4 text-gray-400">Layer 2 Distribution/Access</td>
                        <td className="py-2.5 px-4 text-gray-400">VLAN 1: 192.168.1.2</td>
                        <td className="py-2.5 px-4">00:0A:41:88:99:01</td>
                        <td className="py-2.5 pl-4">Fa0/1 - Fa0/24</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-white">Enterprise Router</td>
                        <td className="py-2.5 px-4 text-gray-400">Default Gateway & L3 ACL Edge</td>
                        <td className="py-2.5 px-4 text-purple-400">192.168.1.1</td>
                        <td className="py-2.5 px-4">00:0A:41:88:99:00</td>
                        <td className="py-2.5 pl-4">GigabitEthernet 0/0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar: Methodological Overview */}
            <div className="space-y-4">
              <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Scientific Methodology
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyber-blue/10 text-cyber-blue font-mono text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Baseline Steady-State</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Establish reference legitimate traffic (TCP flow at ~9,000–10,000 kbps) with zero drops.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyber-red/10 text-cyber-red font-mono text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Simulated Attack Injection</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Inject scripted attack vectors; measure latency spikes, throughput degradation, and traffic leakage.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyber-green/10 text-cyber-green font-mono text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Mitigation Deployment</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Apply IOS configurations (ACLs, Port Security, Static ARP); record dropped attacker packets and restored legitimate bandwidth.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-400/10 text-purple-400 font-mono text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Packet Forensic Validation</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Examine pcap headers in Wireshark to confirm filtering rules and verify attack isolation.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Disclosure Alert */}
              <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Academic Limitations Disclosure
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  As acknowledged in the foundational academic report, NS2 does not implement native Ethernet CAM tables or hardware stateful TCP TCB queues. It models SYN floods via high-rate CBR/UDP streams and ARP redirection through scripted routing modifications. These numerical approximations provide valuable macro-level behavioral benchmarks while acknowledging simulator-specific trade-offs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Layer 2/3 Attacks Deep Dive */}
      {activeSection === 'attacks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SYN Flood */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-red/10 text-cyber-red border border-cyber-red/20">
                  Layer 4 / Layer 3 Denial-of-Service
                </span>
                <span className="text-xs font-mono text-gray-500">CIE: Availability</span>
              </div>
              <h3 className="text-base font-bold text-white">TCP SYN Flood Attack</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                In standard TCP connections, the client initiates a 3-way handshake with a <code className="text-cyber-blue">SYN</code> packet. The server allocates a Transmission Control Block (TCB) memory buffer and replies with <code className="text-cyber-blue">SYN-ACK</code>, waiting in the <code className="text-amber-400">SYN_RCVD</code> state.
              </p>
              <div className="bg-navy-900/60 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-gray-300 space-y-1">
                <div className="text-cyber-red">Attacker &rarr; Server: SYN (spoofed/unanswered)</div>
                <div className="text-gray-400">Server &rarr; [Nowhere]: SYN-ACK (backlog allocated)</div>
                <div className="text-cyber-red font-bold">Result: Backlog Queue Exhausted (0 kbps for users)</div>
              </div>
              <div className="text-xs text-gray-400">
                <strong className="text-white">Measured Impact:</strong> Complete 12-second total service outage; legitimate client throughput dropped from 9,000 kbps to 0 kbps. Over 262,500 attack packets flooded the ingress buffer.
              </div>
            </div>

            {/* ARP Poisoning */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  Layer 2 Man-In-The-Middle
                </span>
                <span className="text-xs font-mono text-gray-500">CIE: Confidentiality</span>
              </div>
              <h3 className="text-base font-bold text-white">ARP Cache Poisoning</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                The Address Resolution Protocol (ARP) translates 32-bit IP addresses to 48-bit MAC addresses. Because ARP is stateless and lacks cryptographic authentication, hosts accept unsolicited gratuitous ARP replies, overwriting dynamic cache entries.
              </p>
              <div className="bg-navy-900/60 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-gray-300 space-y-1">
                <div className="text-amber-400">Attacker &rarr; PC-1: "Server IP is at Attacker MAC"</div>
                <div className="text-amber-400">Attacker &rarr; Server: "PC-1 IP is at Attacker MAC"</div>
                <div className="text-cyber-red font-bold">Result: 71,822 packets intercepted secretly</div>
              </div>
              <div className="text-xs text-gray-400">
                <strong className="text-white">Measured Impact:</strong> 71,822 packets diverted through the attacker before forwarding. Legitimate communication appears normal (~10,000 kbps), giving victims no indication of eavesdropping.
              </div>
            </div>

            {/* MAC Flooding */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-400/10 text-purple-400 border border-purple-400/20">
                  Layer 2 Switch Fail-Open
                </span>
                <span className="text-xs font-mono text-gray-500">CIE: Confidentiality</span>
              </div>
              <h3 className="text-base font-bold text-white">MAC Address Table Flooding</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Switches maintain a Content Addressable Memory (CAM) table to map source MAC addresses to physical ports. When an attacker floods random spoofed source MAC addresses, the fixed-capacity table fills completely.
              </p>
              <div className="bg-navy-900/60 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-gray-300 space-y-1">
                <div className="text-purple-400">Attacker sends: 97,657 random MAC frames</div>
                <div className="text-gray-400">CAM Table: 100% full (legitimate mappings evicted)</div>
                <div className="text-cyber-red font-bold">Result: Switch turns into hub ("fail-open" unicast flood)</div>
              </div>
              <div className="text-xs text-gray-400">
                <strong className="text-white">Measured Impact:</strong> 9,001 private frames flooded out port Fa0/3, allowing the attacker on a non-participating port to capture confidential unicast traffic.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Mitigations Deep Dive */}
      {activeSection === 'mitigations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Router ACL */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyber-blue/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyber-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Access Control Lists (ACLs)</h3>
                  <span className="text-[10px] font-mono text-gray-500">RFC 2827 / Ingress Filtering</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                By placing an extended IP Access Control List on the router's inbound interface or upstream gateway, packets with malicious source IP signatures or rate anomalies are dropped in hardware ASIC logic prior to reaching the target server's TCP socket.
              </p>
              <div className="bg-navy-900/80 p-3 rounded-lg border border-white/5 font-mono text-xs text-cyber-blue">
                access-list 101 deny tcp host 192.168.1.50 any<br/>
                access-list 101 permit ip any any
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Packets Dropped:</span>
                  <span className="font-mono text-cyber-green font-bold">260,263 (99.1%)</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Throughput Preserved:</span>
                  <span className="font-mono text-cyber-green font-bold">8,894–8,902 kbps</span>
                </div>
              </div>
            </div>

            {/* Static ARP */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyber-green/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyber-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Static ARP Bindings / DAI</h3>
                  <span className="text-[10px] font-mono text-gray-500">Deterministic L2 Mappings</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Binding static IP-to-MAC associations directly on host endpoints prevents dynamic overwrite when rogue ARP replies arrive. In production enterprise switches, Dynamic ARP Inspection (DAI) coupled with DHCP Snooping performs this validation dynamically in hardware.
              </p>
              <div className="bg-navy-900/80 p-3 rounded-lg border border-white/5 font-mono text-xs text-cyber-green">
                arp -s 192.168.1.100 00-50-79-66-68-00<br/>
                ip arp inspection vlan 1
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Intercepted Packets:</span>
                  <span className="font-mono text-cyber-green font-bold">0 (100% eliminated)</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Path Integrity:</span>
                  <span className="font-mono text-cyber-green font-bold">Direct PC-1 &rarr; Server</span>
                </div>
              </div>
            </div>

            {/* Port Security */}
            <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cisco Port Security</h3>
                  <span className="text-[10px] font-mono text-gray-500">Hardware CAM Protection</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Port security restricts the maximum number of unique source MAC addresses allowed on an edge switch access port. When an attacker emits spoofed frames exceeding this threshold, the port enters an <code className="text-cyber-red">err-disabled</code> shutdown state.
              </p>
              <div className="bg-navy-900/80 p-3 rounded-lg border border-white/5 font-mono text-xs text-purple-300">
                switchport port-security maximum 2<br/>
                switchport port-security violation shutdown
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Frames before Shutdown:</span>
                  <span className="font-mono text-gray-300">977 frames</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Flooded Traffic Leaked:</span>
                  <span className="font-mono text-cyber-green font-bold">0 frames (0%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Tool Roles */}
      {activeSection === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-cyber-blue" />
              <h3 className="text-sm font-bold text-white">Network Simulator 2 (NS2)</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>Role in Project:</strong> Provides the quantitative mathematical discrete-event simulation engine. NS2 handles scheduled event queues, OTcl scripting of network node linkages, queue delay models (DropTail/RED), and outputs trace files (.tr) capturing exact packet sequence numbers and timestamps.
            </p>
            <div className="p-3 bg-navy-900/60 rounded border border-white/5 text-[11px] text-gray-400 font-mono">
              Key Output: Quantitative throughput drop profiles, packet counters (262,500 attack packets, 260,263 drops).
            </div>
          </div>

          <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <Network className="w-5 h-5 text-cyber-green" />
              <h3 className="text-sm font-bold text-white">Cisco Packet Tracer</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>Role in Project:</strong> Provides realistic Cisco IOS Command Line Interface (CLI) configuration, switch CAM table state modeling, and simulated enterprise edge topologies. It validates that defensive commands execute identically to physical Catalyst 2960 switches and 2911 routers.
            </p>
            <div className="p-3 bg-navy-900/60 rounded border border-white/5 text-[11px] text-gray-400 font-mono">
              Key Output: Exact IOS syntax verification, switchport port-security violation state triggers, ACL syntax checks.
            </div>
          </div>

          <div className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Wireshark Protocol Analyzer</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>Role in Project:</strong> Facilitates deep packet inspection (DPI) of simulated pcap captures. Wireshark inspects protocol headers, validates TCP flags (SYN=1, ACK=0), flags duplicate gratuitous ARP announcements, and enables educational display filter formulations.
            </p>
            <div className="p-3 bg-navy-900/60 rounded border border-white/5 text-[11px] text-gray-400 font-mono">
              Key Output: Syntax verification for display filters, packet dissection of spoofed headers, delta-time analysis.
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Viva Examination Q&A */}
      {activeSection === 'viva' && (
        <div className="space-y-4">
          <div className="bg-navy-800/40 p-4 rounded-lg border border-white/5 text-xs text-gray-400">
            Below are standard questions frequently asked during university Computer Networks laboratory project evaluations and external viva voce examinations.
          </div>

          {[
            {
              q: "Q1: Why are Layer 2 attacks considered exceptionally dangerous compared to external internet attacks?",
              a: "Layer 2 attacks operate within the local broadcast domain, bypassing traditional perimeter defenses like edge stateful firewalls and NAT gateways. Because standard Ethernet switches implicitly trust connected hosts, an internal attacker can corrupt ARP tables or overwhelm switch memory without generating external internet telemetry.",
            },
            {
              q: "Q2: How does a TCP SYN flood exhaust server resources if the attacker sends relatively small packets?",
              a: "TCP is a connection-oriented protocol requiring state tracking. Upon receiving a SYN, the server allocates a Transmission Control Block (TCB) in kernel memory and places the connection into a half-open backlog queue. If the final ACK never arrives, these entries persist until timeout, consuming memory and preventing legitimate handshakes from being accepted.",
            },
            {
              q: "Q3: In the MAC flooding experiment, why does the switch begin forwarding traffic to all ports like a hub?",
              a: "When the switch's CAM table overflows, it cannot record new MAC-to-port bindings and may evict valid ones. In accordance with Ethernet switching standards (IEEE 802.1D), when a switch encounters an unknown unicast destination address, it must flood the frame out all ports in the VLAN except the source port ('fail-open').",
            },
            {
              q: "Q4: What is the difference between Cisco port-security violation modes: protect, restrict, and shutdown?",
              a: "- Protect: Drops packets from unauthorized MACs silently without generating log messages or incrementing violation counters.\n- Restrict: Drops packets, increments the violation counter, and generates an SNMP trap / Syslog entry.\n- Shutdown: Immediately places the physical interface into an 'err-disabled' state, halting all traffic until manually cleared or auto-recovered.",
            },
            {
              q: "Q5: What are the primary differences between simulating in NS2 vs real hardware implementation?",
              a: "NS2 is a discrete-event simulator operating on abstract mathematical queueing models. In our referenced experiments, NS2 approximates a SYN flood using UDP/CBR packets and models ARP redirection through scripted routing overrides rather than executing true low-level TCP handshake state machines or silicon CAM ASIC lookups.",
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-navy-800/60 rounded-xl border border-white/5 p-5 space-y-2">
              <h4 className="text-sm font-semibold text-cyber-blue flex items-center gap-2">
                <ChevronRight className="w-4 h-4 shrink-0" />
                {item.q}
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed pl-6 whitespace-pre-line">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
