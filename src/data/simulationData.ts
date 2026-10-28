import {
  NetworkDevice,
  NetworkLink,
  PacketEntry,
  AttackResult,
  ChartDataPoint,
  ConfigCommand,
  DiscrepancyItem,
  TraceAuditMetrics,
} from '../types';

// ─── Network Devices ───
export const networkDevices: NetworkDevice[] = [
  {
    id: 'internet',
    name: 'Internet Gateway',
    type: 'internet',
    ip: '203.0.113.1 (WAN)',
    mac: '00:11:22:33:44:00',
    x: 400,
    y: 40,
    role: 'External network uplink — connects enterprise gateway to outside network segments.',
    status: 'online',
  },
  {
    id: 'router',
    name: 'Cisco 2911 Edge Router (R1)',
    type: 'router',
    ip: '192.168.1.1',
    mac: '00:0A:41:88:99:00',
    x: 400,
    y: 150,
    role: 'Gateway router with Extended ACL 101 filtering and egress rate-limiting capabilities.',
    status: 'online',
    securityConfig: ['Extended ACL 101 (inbound Fa0/0)', 'Rate limiting DropTail buffer'],
  },
  {
    id: 'switch',
    name: 'Cisco Catalyst 2960 Switch (SW1)',
    type: 'switch',
    ip: '192.168.1.2 (VLAN 1)',
    mac: '00:0A:41:88:99:01',
    x: 400,
    y: 280,
    role: 'Layer 2 managed switch with port-security capabilities. Connects all LAN hosts.',
    status: 'online',
    securityConfig: ['Port security (max 2, shutdown violation)', 'Sticky MAC learning', 'CAM capacity: 8192'],
  },
  {
    id: 'pc1',
    name: 'PC-1 (Legitimate Workstation)',
    type: 'pc',
    ip: '192.168.1.10',
    mac: '00:50:79:66:68:01',
    x: 150,
    y: 420,
    role: 'Legitimate workstation generating normal TCP/FTP traffic to the target server.',
    status: 'online',
  },
  {
    id: 'pc2',
    name: 'PC-2 (Legitimate Workstation)',
    type: 'pc',
    ip: '192.168.1.20',
    mac: '00:50:79:66:68:02',
    x: 300,
    y: 420,
    role: 'Second legitimate workstation generating baseline network traffic.',
    status: 'online',
  },
  {
    id: 'attacker',
    name: 'Attacker Machine (Rogue Host)',
    type: 'attacker',
    ip: '192.168.1.50',
    mac: '00:50:79:66:68:99',
    x: 500,
    y: 420,
    role: 'Rogue internal machine executing simulated SYN floods, forged ARP replies, and CAM overflows.',
    status: 'online',
  },
  {
    id: 'server',
    name: 'Target Enterprise Server',
    type: 'server',
    ip: '192.168.1.100',
    mac: '00:50:79:66:68:00',
    x: 650,
    y: 420,
    role: 'Enterprise application server hosting TCP/HTTP and database services. Primary attack target.',
    status: 'online',
  },
  {
    id: 'monitor',
    name: 'SPAN Port / Wireshark Probe',
    type: 'monitor',
    ip: '192.168.1.200',
    mac: '00:50:79:66:68:FE',
    x: 650,
    y: 280,
    role: 'Port mirroring (SPAN) capture point running Wireshark/tshark deep packet inspection.',
    status: 'online',
  },
];

// ─── Network Links ───
export const networkLinks: NetworkLink[] = [
  { id: 'l1', from: 'internet', to: 'router', type: 'normal', bandwidth: '1 Gbps', active: true },
  { id: 'l2', from: 'router', to: 'switch', type: 'normal', bandwidth: '1 Gbps', active: true },
  { id: 'l3', from: 'switch', to: 'pc1', type: 'normal', bandwidth: '100 Mbps (Fa0/2)', active: true },
  { id: 'l4', from: 'switch', to: 'pc2', type: 'normal', bandwidth: '100 Mbps (Fa0/4)', active: true },
  { id: 'l5', from: 'switch', to: 'attacker', type: 'normal', bandwidth: '100 Mbps (Fa0/3)', active: true },
  { id: 'l6', from: 'switch', to: 'server', type: 'normal', bandwidth: '100 Mbps (Fa0/1)', active: true },
  { id: 'l7', from: 'switch', to: 'monitor', type: 'monitored', bandwidth: 'SPAN Mirror Port', active: true },
];

// ─── Measured NS-2 Trace Dataset (From sim.tcl output CSVs in simulation/results/) ───
// Exact 0.5s bins from baseline_throughput.csv, attack_throughput.csv, and mitigated_throughput.csv
// Modeled with a 2 Mbps bottleneck router-server link and 5 Mbps UDP CBR flood
export const measuredNs2ThroughputData: ChartDataPoint[] = [
  { time: 0.0, baseline: 1614.72, attack: 1614.72, mitigation: 1614.72, floodAttack: 0.0, floodMitigated: 0.0, label: 'TCP Handshake ramp-up' },
  { time: 0.5, baseline: 1996.80, attack: 1996.80, mitigation: 1996.80, floodAttack: 0.0, floodMitigated: 0.0 },
  { time: 1.0, baseline: 2013.44, attack: 2013.44, mitigation: 2013.44, floodAttack: 0.0, floodMitigated: 0.0 },
  { time: 1.5, baseline: 1996.80, attack: 1996.80, mitigation: 1996.80, floodAttack: 0.0, floodMitigated: 0.0 },
  { time: 2.0, baseline: 1996.80, attack: 1996.80, mitigation: 1996.80, floodAttack: 0.0, floodMitigated: 0.0 },
  { time: 2.5, baseline: 1996.80, attack: 1996.80, mitigation: 1996.80, floodAttack: 0.0, floodMitigated: 0.0 },
  { time: 3.0, baseline: 1996.80, attack: 282.88, mitigation: 282.88, floodAttack: 1728.00, floodMitigated: 1728.00, label: 'UDP flood begins (t=3.0s)' },
  { time: 3.5, baseline: 2013.44, attack: 0.00, mitigation: 0.00, floodAttack: 2000.00, floodMitigated: 2000.00, label: 'Total legitimate outage' },
  { time: 4.0, baseline: 1996.80, attack: 0.00, mitigation: 0.00, floodAttack: 2000.00, floodMitigated: 71.68, label: 'Mitigation applied: link down (t=4.0s)' },
  { time: 4.5, baseline: 1996.80, attack: 0.00, mitigation: 1331.20, floodAttack: 2000.00, floodMitigated: 0.00, label: 'Buffer draining & recovery' },
  { time: 5.0, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 2000.00, floodMitigated: 0.00, label: 'Full recovery to 2 Mbps' },
  { time: 5.5, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 2000.00, floodMitigated: 0.00 },
  { time: 6.0, baseline: 2013.44, attack: 0.00, mitigation: 1996.80, floodAttack: 2000.00, floodMitigated: 0.00 },
  { time: 6.5, baseline: 1996.80, attack: 0.00, mitigation: 2013.44, floodAttack: 2000.00, floodMitigated: 0.00 },
  { time: 7.0, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 2000.00, floodMitigated: 0.00 },
  { time: 7.5, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 2000.00, floodMitigated: 0.00 },
  { time: 8.0, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 92.16, floodMitigated: 0.00, label: 'Attack traffic ends (t=8.0s)' },
  { time: 8.5, baseline: 1996.80, attack: 0.00, mitigation: 1996.80, floodAttack: 0.00, floodMitigated: 0.00 },
  { time: 9.0, baseline: 2013.44, attack: 282.88, mitigation: 2013.44, floodAttack: 0.00, floodMitigated: 0.00, label: 'TCP retransmission recovery' },
  { time: 9.5, baseline: 1996.80, attack: 1847.04, mitigation: 1996.80, floodAttack: 0.00, floodMitigated: 0.00 },
];

// ─── Academic Report Benchmark Dataset (10 Mbps Enterprise Model Reference) ───
export function generateSynFloodData(dataset: 'measured-ns2' | 'report-benchmark' = 'report-benchmark'): ChartDataPoint[] {
  if (dataset === 'measured-ns2') {
    return measuredNs2ThroughputData;
  }

  const data: ChartDataPoint[] = [];
  for (let t = 0; t <= 30; t++) {
    const baseline = 9000 + Math.sin(t * 0.3) * 100;
    let attack: number;
    let mitigation: number;

    if (t < 5) {
      attack = 9000 + Math.sin(t * 0.3) * 100;
      mitigation = 9000 + Math.sin(t * 0.3) * 80;
    } else if (t < 8) {
      attack = 9000 - ((t - 5) / 3) * 9000;
      mitigation = 8900 - ((t - 5) / 3) * 50;
    } else if (t < 20) {
      attack = 0;
      mitigation = 8894 + Math.sin(t * 0.5) * 8;
    } else if (t < 23) {
      attack = ((t - 20) / 3) * 8500;
      mitigation = 8900 + ((t - 20) / 3) * 100;
    } else {
      attack = 8800 + Math.sin(t * 0.3) * 200;
      mitigation = 9000 + Math.sin(t * 0.3) * 80;
    }

    data.push({
      time: t,
      baseline: Math.round(baseline),
      attack: Math.max(0, Math.round(attack)),
      mitigation: Math.round(mitigation),
    });
  }
  return data;
}

// ─── ARP Spoofing Chart Data ───
export function generateArpSpoofData(dataset: 'measured-ns2' | 'report-benchmark' = 'report-benchmark'): ChartDataPoint[] {
  if (dataset === 'measured-ns2') {
    // Derived from sim_arp.tcl (1 Mbps diverted stream, 10s simulation)
    return Array.from({ length: 20 }, (_, i) => {
      const t = i * 0.5;
      const normal = 10000;
      const spoof = t >= 3.0 ? 1000 : 0; // 1 Mbps intercepted
      const staticArp = t >= 3.0 && t < 5.0 ? 1000 : 0;
      return {
        time: t,
        baseline: normal,
        attack: spoof,
        mitigation: staticArp,
      };
    });
  }

  const data: ChartDataPoint[] = [];
  for (let t = 0; t <= 30; t++) {
    const baseline = 10000 + Math.sin(t * 0.4) * 100;
    const attack = 10000 + Math.sin(t * 0.4) * 120;
    const mitigation = 10000 + Math.sin(t * 0.4) * 80;

    data.push({
      time: t,
      baseline: Math.round(baseline),
      attack: Math.round(attack),
      mitigation: Math.round(mitigation),
    });
  }
  return data;
}

// ─── MAC Flood Chart Data ───
export function generateMacFloodData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  for (let t = 0; t <= 30; t++) {
    const baseline = 9000 + Math.sin(t * 0.35) * 100;
    let attack: number;
    let mitigation: number;

    if (t < 5) {
      attack = 9000 + Math.sin(t * 0.35) * 100;
      mitigation = 9000 + Math.sin(t * 0.35) * 80;
    } else if (t < 10) {
      attack = 9000 - ((t - 5) / 5) * 1500;
      mitigation = 9000 + Math.sin(t * 0.35) * 80;
    } else {
      attack = 7500 + Math.sin(t * 0.5) * 300;
      mitigation = 9000 + Math.sin(t * 0.35) * 80;
    }

    data.push({
      time: t,
      baseline: Math.round(baseline),
      attack: Math.round(attack),
      mitigation: Math.round(mitigation),
    });
  }
  return data;
}

// ─── Wireshark Sample Packets ───
export function generatePacketData(filter?: string): PacketEntry[] {
  const basePackets: PacketEntry[] = [
    { id: 1, timestamp: '0.000000', source: '192.168.1.10', destination: '192.168.1.100', protocol: 'TCP', length: 74, info: '49152 → 80 [SYN] Seq=0 Win=65535', type: 'syn', details: { srcMac: '00:50:79:66:68:01', dstMac: '00:50:79:66:68:00', srcPort: 49152, dstPort: 80, flags: 'SYN' } },
    { id: 2, timestamp: '0.000045', source: '192.168.1.100', destination: '192.168.1.10', protocol: 'TCP', length: 74, info: '80 → 49152 [SYN, ACK] Seq=0 Ack=1', type: 'normal', details: { srcMac: '00:50:79:66:68:00', dstMac: '00:50:79:66:68:01', srcPort: 80, dstPort: 49152, flags: 'SYN, ACK' } },
    { id: 3, timestamp: '0.000090', source: '192.168.1.10', destination: '192.168.1.100', protocol: 'TCP', length: 66, info: '49152 → 80 [ACK] Seq=1 Ack=1', type: 'normal', details: { srcMac: '00:50:79:66:68:01', dstMac: '00:50:79:66:68:00', srcPort: 49152, dstPort: 80, flags: 'ACK' } },
    { id: 4, timestamp: '0.001200', source: '192.168.1.10', destination: '192.168.1.100', protocol: 'HTTP', length: 410, info: 'GET / HTTP/1.1', type: 'normal', details: { srcMac: '00:50:79:66:68:01', dstMac: '00:50:79:66:68:00', srcPort: 49152, dstPort: 80, payload: 'GET / HTTP/1.1\\r\\nHost: 192.168.1.100' } },
    { id: 5, timestamp: '0.002100', source: '192.168.1.100', destination: '192.168.1.10', protocol: 'HTTP', length: 1260, info: 'HTTP/1.1 200 OK (text/html)', type: 'normal', details: { srcMac: '00:50:79:66:68:00', dstMac: '00:50:79:66:68:01', srcPort: 80, dstPort: 49152, payload: 'HTTP/1.1 200 OK\\r\\nContent-Type: text/html' } },
    // SYN Flood attack packets
    { id: 6, timestamp: '3.000100', source: '192.168.1.50', destination: '192.168.1.100', protocol: 'TCP', length: 74, info: '12345 → 80 [SYN] Seq=0 Win=65535 (SIMULATED FLOOD)', type: 'syn', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:00', srcPort: 12345, dstPort: 80, flags: 'SYN' } },
    { id: 7, timestamp: '3.000102', source: '192.168.1.50', destination: '192.168.1.100', protocol: 'TCP', length: 74, info: '12346 → 80 [SYN] Seq=0 Win=65535 (SIMULATED FLOOD)', type: 'syn', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:00', srcPort: 12346, dstPort: 80, flags: 'SYN' } },
    { id: 8, timestamp: '3.000104', source: '192.168.1.50', destination: '192.168.1.100', protocol: 'TCP', length: 74, info: '12347 → 80 [SYN] Seq=0 Win=65535 (SIMULATED FLOOD)', type: 'syn', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:00', srcPort: 12347, dstPort: 80, flags: 'SYN' } },
    // ARP spoofing packets
    { id: 9, timestamp: '3.100000', source: '192.168.1.50', destination: '192.168.1.10', protocol: 'ARP', length: 42, info: 'ARP Reply: 192.168.1.100 is at 00:50:79:66:68:99 (POISONED)', type: 'arp', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:01' } },
    { id: 10, timestamp: '3.100010', source: '192.168.1.50', destination: '192.168.1.100', protocol: 'ARP', length: 42, info: 'ARP Reply: 192.168.1.10 is at 00:50:79:66:68:99 (POISONED)', type: 'arp', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:00' } },
    // MAC flood frames
    { id: 11, timestamp: '3.200000', source: '02:00:00:00:00:01', destination: 'FF:FF:FF:FF:FF:FF', protocol: 'Ethernet', length: 64, info: 'Bogus frame — random src MAC (CAM TABLE FLOOD)', type: 'flood', details: { srcMac: '02:00:00:00:00:01', dstMac: 'FF:FF:FF:FF:FF:FF' } },
    { id: 12, timestamp: '3.200001', source: '02:00:00:00:00:02', destination: 'FF:FF:FF:FF:FF:FF', protocol: 'Ethernet', length: 64, info: 'Bogus frame — random src MAC (CAM TABLE FLOOD)', type: 'flood', details: { srcMac: '02:00:00:00:00:02', dstMac: 'FF:FF:FF:FF:FF:FF' } },
    // Normal ongoing traffic
    { id: 13, timestamp: '4.000000', source: '192.168.1.20', destination: '192.168.1.100', protocol: 'TCP', length: 66, info: '50000 → 443 [SYN] Seq=0 Win=65535', type: 'syn', details: { srcMac: '00:50:79:66:68:02', dstMac: '00:50:79:66:68:00', srcPort: 50000, dstPort: 443, flags: 'SYN' } },
    { id: 14, timestamp: '4.001000', source: '192.168.1.100', destination: '192.168.1.20', protocol: 'TCP', length: 66, info: '443 → 50000 [SYN, ACK] Seq=0 Ack=1', type: 'normal', details: { srcMac: '00:50:79:66:68:00', dstMac: '00:50:79:66:68:02', srcPort: 443, dstPort: 50000, flags: 'SYN, ACK' } },
    { id: 15, timestamp: '4.100000', source: '192.168.1.50', destination: '192.168.1.100', protocol: 'TCP', length: 74, info: '12348 → 80 [SYN] Seq=0 Win=65535 (BLOCKED BY ACL)', type: 'blocked', details: { srcMac: '00:50:79:66:68:99', dstMac: '00:50:79:66:68:00', srcPort: 12348, dstPort: 80, flags: 'SYN' } },
    { id: 16, timestamp: '5.000000', source: '192.168.1.10', destination: '192.168.1.100', protocol: 'ICMP', length: 98, info: 'Echo (ping) request id=0x0001, seq=1', type: 'normal', details: { srcMac: '00:50:79:66:68:01', dstMac: '00:50:79:66:68:00' } },
    { id: 17, timestamp: '5.000500', source: '192.168.1.100', destination: '192.168.1.10', protocol: 'ICMP', length: 98, info: 'Echo (ping) reply id=0x0001, seq=1', type: 'normal', details: { srcMac: '00:50:79:66:68:00', dstMac: '00:50:79:66:68:01' } },
    { id: 18, timestamp: '6.000000', source: '192.168.1.10', destination: '192.168.1.1', protocol: 'ARP', length: 42, info: 'Who has 192.168.1.1? Tell 192.168.1.10', type: 'normal', details: { srcMac: '00:50:79:66:68:01', dstMac: 'FF:FF:FF:FF:FF:FF' } },
    { id: 19, timestamp: '6.000100', source: '192.168.1.1', destination: '192.168.1.10', protocol: 'ARP', length: 42, info: '192.168.1.1 is at 00:0A:41:88:99:00', type: 'normal', details: { srcMac: '00:0A:41:88:99:00', dstMac: '00:50:79:66:68:01' } },
    { id: 20, timestamp: '7.500000', source: '02:00:00:00:00:03', destination: 'FF:FF:FF:FF:FF:FF', protocol: 'Ethernet', length: 64, info: 'Bogus frame — random src MAC (BLOCKED BY PORT SECURITY)', type: 'blocked', details: { srcMac: '02:00:00:00:00:03', dstMac: 'FF:FF:FF:FF:FF:FF' } },
  ];

  if (!filter) return basePackets;

  const f = filter.toLowerCase();
  if (f.includes('syn') || f.includes('tcp.flags.syn')) {
    return basePackets.filter(p => p.type === 'syn' || p.details.flags?.includes('SYN'));
  }
  if (f.includes('arp')) {
    return basePackets.filter(p => p.protocol === 'ARP' || p.type === 'arp');
  }
  if (f.includes('eth') || f.includes('ethernet') || f.includes('flood')) {
    return basePackets.filter(p => p.protocol === 'Ethernet' || p.type === 'flood');
  }
  if (f.includes('blocked')) {
    return basePackets.filter(p => p.type === 'blocked');
  }
  if (f.includes('attack') || f.includes('malicious')) {
    return basePackets.filter(p => ['syn', 'arp', 'flood', 'blocked'].includes(p.type));
  }

  return basePackets.filter(p =>
    p.source.toLowerCase().includes(f) ||
    p.destination.toLowerCase().includes(f) ||
    p.protocol.toLowerCase().includes(f) ||
    p.info.toLowerCase().includes(f)
  );
}

// ─── Cisco IOS Configuration Commands ───
export const routerACLConfig: ConfigCommand[] = [
  { command: 'enable', explanation: 'Enter privileged EXEC mode.', category: 'acl' },
  { command: 'configure terminal', explanation: 'Enter global configuration mode.', category: 'acl' },
  { command: 'access-list 101 deny tcp host 192.168.1.50 any eq 80', explanation: 'Drop all TCP SYN flood requests originating from the rogue attacker host destined to the HTTP web server port 80.', category: 'acl' },
  { command: 'access-list 101 deny tcp host 192.168.1.50 any eq 443', explanation: 'Deny rogue attacker TCP connection attempts on HTTPS port 443.', category: 'acl' },
  { command: 'access-list 101 permit ip any any', explanation: 'Permit all legitimate enterprise IP traffic to prevent accidental blackholing.', category: 'acl' },
  { command: 'interface GigabitEthernet0/0', explanation: 'Select the gateway router interface facing the enterprise LAN switch trunk.', category: 'acl' },
  { command: 'ip access-group 101 in', explanation: 'Bind Extended ACL 101 to the inbound direction so unauthorized packets are filtered in hardware before routing.', category: 'acl' },
  { command: 'end', explanation: 'Return to privileged EXEC mode.', category: 'acl' },
  { command: 'show access-lists 101', explanation: 'Inspect ACL rule hit counters and verify dropped packet counts.', category: 'acl' },
];

export const switchPortSecurityConfig: ConfigCommand[] = [
  { command: 'enable', explanation: 'Enter privileged EXEC mode.', category: 'port-security' },
  { command: 'configure terminal', explanation: 'Enter global configuration mode.', category: 'port-security' },
  { command: 'interface FastEthernet0/3', explanation: 'Select switch port Fa0/3 connected to the rogue host segment.', category: 'port-security' },
  { command: 'switchport mode access', explanation: 'Set the switchport explicitly into access mode (port security requires static access).', category: 'port-security' },
  { command: 'switchport port-security', explanation: 'Enable Cisco IOS port security on the physical interface.', category: 'port-security' },
  { command: 'switchport port-security maximum 2', explanation: 'Limit MAC address learning to a maximum of 2 addresses on this physical port.', category: 'port-security' },
  { command: 'switchport port-security violation shutdown', explanation: 'Enforce immediate interface shutdown (err-disabled) if an unauthorized MAC address is detected.', category: 'port-security' },
  { command: 'switchport port-security mac-address sticky', explanation: 'Dynamically learn and pin legitimate MAC addresses into the running configuration.', category: 'port-security' },
  { command: 'end', explanation: 'Return to privileged EXEC mode.', category: 'port-security' },
  { command: 'show port-security interface FastEthernet0/3', explanation: 'Verify operational status, violation counters, and security action.', category: 'port-security' },
];

export const staticARPConfig: ConfigCommand[] = [
  { command: '# On Victim PC-1 (Windows):', explanation: 'Command-line execution for static ARP table binding on Windows OS endpoints.', category: 'static-arp' },
  { command: 'arp -s 192.168.1.1 00-0A-41-88-99-00', explanation: 'Statically bind default gateway router IP to its genuine hardware MAC address.', category: 'static-arp' },
  { command: 'arp -s 192.168.1.100 00-50-79-66-68-00', explanation: 'Statically bind target server IP to its genuine hardware MAC address.', category: 'static-arp' },
  { command: 'arp -a', explanation: 'Verify active ARP cache to confirm static mapping status.', category: 'static-arp' },
  { command: '', explanation: '', category: 'static-arp' },
  { command: '# On Victim PC-1 (Linux):', explanation: 'Equivalent commands for Linux enterprise workstations.', category: 'static-arp' },
  { command: 'sudo ip neigh add 192.168.1.1 lladdr 00:0a:41:88:99:00 nud permanent dev eth0', explanation: 'Permanent neighbor binding for default gateway on Linux.', category: 'static-arp' },
  { command: 'sudo ip neigh add 192.168.1.100 lladdr 00:50:79:66:68:00 nud permanent dev eth0', explanation: 'Permanent neighbor binding for target server on Linux.', category: 'static-arp' },
  { command: 'ip neigh show', explanation: 'Display permanent neighbor cache entries.', category: 'static-arp' },
];

// ─── Attack Results Benchmarks ───
export const attackResults: AttackResult[] = [
  {
    attackName: 'UDP/CBR Flood Model (Approximating SYN Flood)',
    attackType: 'syn-flood',
    layer: 'Layer 4 / Layer 3 (Transport/Network)',
    ciaImpact: 'Availability',
    baselineThroughput: 9000,
    attackThroughput: 0,
    mitigatedThroughput: 8898,
    keyMetric: 'Attack packets / Filtered by mitigation',
    keyMetricValue: '262,500 pkts / 260,263 dropped (99.1%)',
    mitigationMethod: 'Router Ingress Filtering / Link Cutoff',
    effectiveness: 99.15,
    traceEvidence: 'sim.tcl / attack.tr (431,897 events, 47,180 trace drops) & report benchmark',
    modelingMethod: 'NS-2 UDP CBR flood (40-byte pkts, 5 Mbps) approximating bottleneck queue congestion',
  },
  {
    attackName: 'ARP Spoofing Behavioral Diversion',
    attackType: 'arp-spoof',
    layer: 'Layer 2 (Data Link)',
    ciaImpact: 'Confidentiality & Integrity',
    baselineThroughput: 10000,
    attackThroughput: 10000,
    mitigatedThroughput: 10000,
    keyMetric: 'Intercepted traffic diverted to rogue host',
    keyMetricValue: '71,822 pkts intercepted (Report model) → 0 with static ARP',
    mitigationMethod: 'Static ARP Cache Binding / Cisco DAI',
    effectiveness: 100,
    traceEvidence: 'sim_arp.tcl / arp_spoof_throughput.csv (Illustrative Model) & python_attacks/arp_spoof.py (Implemented Script)',
    modelingMethod: 'NS-2 scripted routing redirection; Scapy script implemented with dry-run safety (live execution unverified)',
  },
  {
    attackName: 'Switch MAC Address Table Flooding',
    attackType: 'mac-flood',
    layer: 'Layer 2 (Data Link)',
    ciaImpact: 'Confidentiality',
    baselineThroughput: 9000,
    attackThroughput: 9000,
    mitigatedThroughput: 9000,
    keyMetric: 'CAM overflow frames / Blocked by port security',
    keyMetricValue: '97,657 sent (9,001 leaked) — Unverified Report Benchmark',
    mitigationMethod: 'Cisco IOS Port Security (violation shutdown)',
    effectiveness: 100,
    traceEvidence: 'Theoretical analysis in mac_flood_theory.md & python_attacks/mac_flood.py (No raw PCAP in repo)',
    modelingMethod: 'Unverified external report benchmark (NS-2 lacks switch CAM table logic)',
  },
];

// ─── Ground-Truth Trace Audit Summary (Parsed directly from baseline.tr, attack.tr, mitigated.tr) ───
export const traceAuditSummary: TraceAuditMetrics[] = [
  {
    mode: 'Baseline Steady-State',
    totalLines: 28659,
    fileSizeMb: 1.37,
    totalDrops: 0,
    legitServerPackets: 2384,
    floodServerPackets: 0,
    avgLegitThroughputMbps: 1.9827,
    recoveredSteadyStateThroughputMbps: 1.9968,
    attackWindowThroughputMbps: 2.0001,
    note: 'Steady-state TCP goodput approaching the 2.0 Mbps bottleneck link (~99.84% capacity) with zero packet loss.',
  },
  {
    mode: 'Unmitigated Attack (UDP CBR Flood)',
    totalLines: 431897,
    fileSizeMb: 21.22,
    totalDrops: 47180,
    legitServerPackets: 846,
    floodServerPackets: 30969,
    avgLegitThroughputMbps: 0.7031,
    attackWindowThroughputMbps: 0.0283,
    recoveredSteadyStateThroughputMbps: 0.0000,
    note: 'Goodput falls to 0.0000 Mbps from t=3.5s to 8.5s during the 5-second 5 Mbps CBR flood.',
  },
  {
    mode: 'Mitigated (Link Down at t=4.0s)',
    totalLines: 108069,
    fileSizeMb: 5.21,
    totalDrops: 9710,
    legitServerPackets: 2000,
    floodServerPackets: 5937,
    avgLegitThroughputMbps: 1.6632, // Full 10.0s run average (including 3.0-4.5s attack/drain degradation)
    attackWindowThroughputMbps: 1.3612, // Average during 3.0s-8.0s window
    recoveredSteadyStateThroughputMbps: 1.9968, // Steady-state post-mitigation modal bin (120 pkts/0.5s = ~99.84% capacity)
    note: 'After mitigation, legitimate traffic approaches the configured 2 Mbps bottleneck capacity, with the measured result depending on the measurement window and throughput methodology.',
  },
];

// ─── Complete Discrepancy & Traceability Matrix (Phase 6 Requirement) ───
export const discrepancyMatrix: DiscrepancyItem[] = [
  {
    claim: 'TCP SYN Flood baseline throughput is ~9,000 kbps on a 10 Mbps enterprise link.',
    sourceEvidence: 'sim.tcl defines duplex-link $router $server 2Mb 10ms DropTail. baseline.tr measures 1.9827 Mbps (~1,983 kbps).',
    validationPerformed: 'Parsed baseline.tr and baseline_throughput.csv using verify_traces.py. Verified link bottleneck parameter.',
    status: 'Partially verified',
    requiredAction: 'Document that the local NS-2 script used a 2 Mbps bottleneck to model router congestion, while the academic report scaled the benchmark to 10 Mbps full LAN.',
  },
  {
    claim: 'Unmitigated attack causes ~12-second complete outage (throughput falls to 0 kbps).',
    sourceEvidence: 'In sim.tcl, attack is scheduled from 3.0s to 8.0s (5-second window). attack.tr shows 0.000 Mbps from 3.5s to 8.5s.',
    validationPerformed: 'attack_throughput.csv confirmed 0.000 Mbps legitimate throughput for 5 seconds. The 12-second outage figure belongs to the 30-second report benchmark.',
    status: 'Simulated approximation',
    requiredAction: 'Provide toggle between the 10-second NS-2 measured trace (5s outage) and the 30-second report target (12s outage).',
  },
  {
    claim: 'Simulated attack packets = 262,500; Packets dropped by mitigation = 260,263; Server ingress = 2,237.',
    sourceEvidence: 'In sim.tcl, CBR rate is 5 Mbps with 40-byte packets over 5s (78,125 packets generated). attack.tr logs 421,594 flow 2 trace events and 47,180 drops.',
    validationPerformed: 'Executed verify_traces.py on attack.tr and mitigated.tr. Verified that 262,500 was calculated for an 8.4-second flood at 10 Mbps in the academic report.',
    status: 'Partially verified',
    requiredAction: 'Explicitly display both the raw NS-2 trace drops (47,180 in attack.tr) and the report benchmark totals (260,263 drops) with formula derivation.',
  },
  {
    claim: 'NS-2 implements genuine TCP SYN handshake exhaustion.',
    sourceEvidence: 'sim.tcl uses Agent/UDP with Application/Traffic/CBR (packetSize 40, fid 2), connecting to Agent/Null.',
    validationPerformed: 'Audited sim.tcl lines 69-80. NS-2 CBR generates UDP datagrams rather than stateful TCP SYN handshake packets.',
    status: 'Simulated approximation',
    requiredAction: 'Clearly disclose in the UI and documentation that NS-2 approximates half-open queue congestion via high-volume UDP/CBR packets.',
  },
  {
    claim: 'ARP Spoofing simulation intercepts 71,822 packets without mitigation and 0 with static ARP.',
    sourceEvidence: 'sim_arp.tcl diverts a 1 Mbps UDP flow to the attacker node from 3.0s to 10.0s (7 seconds). NS-2 has no native ARP cache in wired topologies.',
    validationPerformed: 'Audited sim_arp.tcl lines 4-8. Verified that 71,822 packets reflects the report high-rate model, while sim_arp.tcl represents the behavioral path redirection.',
    status: 'Simulated approximation',
    requiredAction: 'Disclose NS-2 protocol limitation; maintain both the behavioral trace dataset and the report benchmark values.',
  },
  {
    claim: 'MAC Address Table Flooding is simulated inside NS-2 (97,657 frames sent, 9,001 flooded copies).',
    sourceEvidence: 'mac_flood_theory.md states: "NS-2.35 does not provide a Layer 2 switch with a finite CAM table... MAC flooding is documented as a limitation rather than simulated."',
    validationPerformed: 'Audited entire NS-2 codebase; confirmed no .tcl script models CAM table overflow. Verified python_attacks/mac_flood.py provides Scapy frames for Packet Tracer.',
    status: 'Hardcoded/demo data',
    requiredAction: 'Label MAC flooding CAM table figures as an unverified academic report benchmark. NS-2 does not model switch CAM tables.',
  },
  {
    claim: 'Mitigated legitimate goodput discrepancy: 1.6632 Mbps vs 1.9968 Mbps.',
    sourceEvidence: 'mitigated.tr total flow 1 bytes = 2,079,000 across 10.0s (1.6632 Mbps). mitigated_throughput.csv shows 1.9968 Mbps modal bins from t=5.0s to 10.0s.',
    validationPerformed: 'Audited sim.tcl analyze procedure and verify_traces.py. After mitigation, legitimate traffic approaches the configured 2 Mbps bottleneck capacity, with the measured result depending on the measurement window and throughput methodology.',
    status: 'Verified',
    requiredAction: 'Distinguish full-run average throughput (1.6632 Mbps) from post-mitigation steady-state throughput (1.9968 Mbps modal bin, ~99.84% capacity) and 5.0s window packet-arrival goodput (2.000128 Mbps).',
  },
  {
    claim: 'Post-mitigation 5-second arrival goodput is 2.000128 Mbps, exceeding nominal 2.0 Mbps bottleneck capacity by 80 bytes (1,250,080 vs 1,250,000 bytes).',
    sourceEvidence: 'mitigated.tr records exactly 1,202 received 1040-byte data packets at server node 2 in [5.0s, 10.0s). Nominal 5-second capacity at 2 Mbps is 1,250,000 bytes.',
    validationPerformed: 'Audited trace timestamps. Packets span from completion of packet 795 reception at 4.998312s to packet 1997 reception at 9.998632s (5.000320s). The 80-byte excess is an inherent discrete packet boundary quantization artifact of continuous-window measurement, not physical link over-capacity.',
    status: 'Partially verified',
    requiredAction: 'Retain the 80-byte difference as an explicit measurement limitation of discrete packet-arrival counting across continuous time windows.',
  },
  {
    claim: 'Wireshark traffic analyzer captures live network packets from the host.',
    sourceEvidence: 'wireshark_stats.py is a standalone tshark wrapper for offline .pcapng files. The web UI displays curated inspection frames.',
    validationPerformed: 'Audited TrafficAnalysisPage.tsx. All packet entries are deterministic demonstration frames with valid Wireshark filter syntax.',
    status: 'Hardcoded/demo data',
    requiredAction: 'Clearly label the Wireshark page as an interactive protocol analyzer demonstrator rather than live kernel packet capture.',
  },
];
