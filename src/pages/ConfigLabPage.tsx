import React, { useState } from 'react';
import { FileText, Copy, Check, Shield, Lock, Wifi, Info } from 'lucide-react';
import { routerACLConfig, switchPortSecurityConfig, staticARPConfig } from '../data/simulationData';
import { ConfigCommand } from '../types';

type ConfigTab = 'acl' | 'port-security' | 'static-arp';

function CodeBlock({ commands, title }: { commands: ConfigCommand[]; title: string }) {
  const [copied, setCopied] = useState(false);

  const codeText = commands
    .filter(c => c.command)
    .map(c => c.command)
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-navy-900 rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-navy-700/50 border-b border-white/5">
        <span className="text-xs font-semibold text-gray-400">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-white/5 text-gray-400 hover:text-white transition-all"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <div className="p-4 space-y-0">
        {commands.map((cmd, i) => (
          <div key={i} className={`group ${cmd.command ? '' : 'mt-3'}`}>
            {cmd.command ? (
              <div className="flex items-start gap-4 hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded">
                <code className={`font-mono text-xs whitespace-pre shrink-0 ${
                  cmd.command.startsWith('#') ? 'text-gray-600 italic' :
                  cmd.command.startsWith('!') ? 'text-gray-600' :
                  cmd.command.startsWith('access-list') ? 'text-purple-400' :
                  cmd.command.startsWith('switchport') ? 'text-cyber-blue' :
                  cmd.command.startsWith('arp') || cmd.command.startsWith('sudo arp') ? 'text-amber-400' :
                  cmd.command.startsWith('interface') ? 'text-cyber-cyan' :
                  cmd.command.startsWith('ip ') ? 'text-emerald-400' :
                  cmd.command.startsWith('show') ? 'text-amber-400' :
                  'text-gray-300'
                }`}>
                  {cmd.command.startsWith('#') || cmd.command.startsWith('!') ? cmd.command : `  ${cmd.command}`}
                </code>
                <span className="text-[10px] text-gray-600 leading-relaxed hidden lg:block">
                  {cmd.explanation}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConfigLabPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('acl');

  const tabs = [
    { id: 'acl' as ConfigTab, label: 'Router ACL', icon: Shield, color: 'text-red-400' },
    { id: 'port-security' as ConfigTab, label: 'Switch Port Security', icon: Wifi, color: 'text-purple-400' },
    { id: 'static-arp' as ConfigTab, label: 'Static ARP', icon: Lock, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-cyber-blue" />
          <span className="text-[10px] font-semibold text-cyber-blue uppercase tracking-widest">Cisco IOS Configuration Reference</span>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Configuration Lab</h1>
        <p className="text-sm text-gray-500 mt-1">
          IOS-style configuration examples for each mitigation technique. Commands and interface names must match your actual lab topology.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-navy-800 rounded-xl border border-white/5 p-1.5 flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white/5 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ACL Config */}
      {activeTab === 'acl' && (
        <div className="space-y-6">
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Router Access Control List (ACL)</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              An ACL on the edge router filters traffic from the attacker's IP address, preventing SYN flood packets from reaching the target server.
              This is a standard extended ACL (101) applied inbound on the LAN-facing interface.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Attacker IP</p>
                <p className="text-sm font-mono text-red-400">192.168.1.66</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Target Ports</p>
                <p className="text-sm font-mono text-cyber-blue">80 (HTTP), 443 (HTTPS)</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Interface</p>
                <p className="text-sm font-mono text-cyber-cyan">GigabitEthernet0/0</p>
              </div>
            </div>
          </div>
          <CodeBlock commands={routerACLConfig} title="Router R1 — ACL Configuration" />

          <div className="bg-navy-800/50 rounded-xl border border-cyber-blue/10 p-4">
            <h4 className="text-xs font-semibold text-cyber-blue mb-2">How ACL 101 Works</h4>
            <div className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
              <p><strong>Rule 1:</strong> <code className="text-purple-400 text-[10px]">deny tcp host 192.168.1.66 any eq 80</code> — Drops all TCP traffic from the attacker to any host on port 80.</p>
              <p><strong>Rule 2:</strong> <code className="text-purple-400 text-[10px]">deny tcp host 192.168.1.66 any eq 443</code> — Drops all TCP traffic from the attacker on port 443.</p>
              <p><strong>Rule 3:</strong> <code className="text-emerald-400 text-[10px]">permit ip any any</code> — Allows all other traffic. Without this implicit permit, the ACL would deny everything (implicit deny all).</p>
              <p className="text-gray-500 italic">The ACL is applied <strong>inbound</strong> on the router's LAN interface, filtering traffic before it enters the routing engine.</p>
            </div>
          </div>
        </div>
      )}

      {/* Port Security Config */}
      {activeTab === 'port-security' && (
        <div className="space-y-6">
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Switch Port Security</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Port security limits the number of MAC addresses that can be learned on a switch port. When the attacker attempts to flood the switch
              with thousands of bogus MAC addresses, the security violation triggers a port shutdown.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Target Port</p>
                <p className="text-sm font-mono text-purple-400">FastEthernet0/3</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Max MAC Addresses</p>
                <p className="text-sm font-mono text-cyber-blue">2</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Violation Action</p>
                <p className="text-sm font-mono text-red-400">shutdown</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">MAC Learning</p>
                <p className="text-sm font-mono text-emerald-400">sticky</p>
              </div>
            </div>
          </div>
          <CodeBlock commands={switchPortSecurityConfig} title="Switch SW1 — Port Security Configuration" />

          <div className="bg-navy-800/50 rounded-xl border border-purple-500/10 p-4">
            <h4 className="text-xs font-semibold text-purple-400 mb-2">Violation Modes Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-500 py-2 px-3">Mode</th>
                    <th className="text-left text-gray-500 py-2 px-3">Drops Traffic</th>
                    <th className="text-left text-gray-500 py-2 px-3">Sends Log</th>
                    <th className="text-left text-gray-500 py-2 px-3">Port State</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-3 text-red-400 font-mono font-semibold">shutdown</td>
                    <td className="py-2 px-3 text-emerald-400">Yes</td>
                    <td className="py-2 px-3 text-emerald-400">Yes</td>
                    <td className="py-2 px-3 text-red-400">err-disabled</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-3 text-amber-400 font-mono font-semibold">restrict</td>
                    <td className="py-2 px-3 text-emerald-400">Yes</td>
                    <td className="py-2 px-3 text-emerald-400">Yes</td>
                    <td className="py-2 px-3 text-emerald-400">Up</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-gray-400 font-mono font-semibold">protect</td>
                    <td className="py-2 px-3 text-emerald-400">Yes</td>
                    <td className="py-2 px-3 text-red-400">No</td>
                    <td className="py-2 px-3 text-emerald-400">Up</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Static ARP Config */}
      {activeTab === 'static-arp' && (
        <div className="space-y-6">
          <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Static ARP Entries</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Static ARP entries permanently bind an IP address to its legitimate MAC address on the victim's machine.
              This prevents ARP cache poisoning attacks because the operating system will not overwrite a static entry
              with a spoofed ARP reply.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Gateway IP → MAC</p>
                <p className="text-xs font-mono text-amber-400">192.168.1.1 → AA:BB:CC:DD:EE:01</p>
              </div>
              <div className="bg-navy-900 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 mb-0.5">Server IP → MAC</p>
                <p className="text-xs font-mono text-amber-400">192.168.1.100 → AA:BB:CC:DD:EE:AA</p>
              </div>
            </div>
          </div>
          <CodeBlock commands={staticARPConfig} title="Static ARP Configuration — Victim Machine" />

          <div className="bg-navy-800/50 rounded-xl border border-amber-500/10 p-4">
            <h4 className="text-xs font-semibold text-amber-400 mb-2">Before vs After Static ARP</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-red-400 font-semibold mb-1.5">Without Static ARP (Vulnerable)</p>
                <div className="bg-navy-900 rounded-lg p-3 border border-red-500/20 font-mono text-[10px] text-gray-400 space-y-0.5">
                  <p>? (192.168.1.1) at <span className="text-red-400">AA:BB:CC:DD:EE:66</span> [ether] &nbsp;← <span className="text-red-400">SPOOFED</span></p>
                  <p>? (192.168.1.100) at <span className="text-red-400">AA:BB:CC:DD:EE:66</span> [ether] &nbsp;← <span className="text-red-400">SPOOFED</span></p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 font-semibold mb-1.5">With Static ARP (Protected)</p>
                <div className="bg-navy-900 rounded-lg p-3 border border-emerald-500/20 font-mono text-[10px] text-gray-400 space-y-0.5">
                  <p>? (192.168.1.1) at <span className="text-emerald-400">AA:BB:CC:DD:EE:01</span> [ether] PERM &nbsp;← <span className="text-emerald-400">✓ STATIC</span></p>
                  <p>? (192.168.1.100) at <span className="text-emerald-400">AA:BB:CC:DD:EE:AA</span> [ether] PERM &nbsp;← <span className="text-emerald-400">✓ STATIC</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 text-gray-600 shrink-0" />
        <p>
          These configuration examples use placeholder IP addresses and interface names that match the simulated lab topology.
          Commands and interface names must be adapted to match actual device capabilities and lab equipment.
          This web application does not configure real network devices.
        </p>
      </div>
    </div>
  );
}
