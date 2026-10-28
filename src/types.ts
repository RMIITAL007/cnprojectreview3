// ─── Simulation Modes ───
export type SimulationMode = 'baseline' | 'attack' | 'mitigation';
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';
export type AttackType = 'syn-flood' | 'arp-spoof' | 'mac-flood';
export type DatasetSource = 'measured-ns2' | 'report-benchmark';

// ─── Device Types ───
export interface NetworkDevice {
  id: string;
  name: string;
  type: 'internet' | 'router' | 'switch' | 'pc' | 'attacker' | 'server' | 'monitor';
  ip: string;
  mac: string;
  x: number;
  y: number;
  role: string;
  status: 'online' | 'offline' | 'compromised' | 'protected';
  securityConfig?: string[];
}

export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  type: 'normal' | 'attack' | 'blocked' | 'monitored' | 'intercepted';
  bandwidth: string;
  active: boolean;
}

// ─── Metrics ───
export interface SimulationMetrics {
  timestamp: number;
  throughput: number;
  packetsSent: number;
  packetsDropped: number;
  packetsIntercepted: number;
  packetsReachingServer: number;
  attackPacketRate: number;
  switchTableUtil: number;
  datasetSource?: DatasetSource;
}

// ─── Packet Entry (Wireshark-style) ───
export interface PacketEntry {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  type: 'normal' | 'attack' | 'arp' | 'syn' | 'blocked' | 'flood';
  details: {
    srcMac: string;
    dstMac: string;
    srcPort?: number;
    dstPort?: number;
    flags?: string;
    payload?: string;
  };
}

// ─── Attack Module State ───
export interface AttackModuleState {
  mode: SimulationMode;
  status: SimulationStatus;
  progress: number; // 0-100
  timeElapsed: number;
  metrics: SimulationMetrics[];
  currentMetrics: SimulationMetrics;
}

// ─── Chart Data Point ───
export interface ChartDataPoint {
  time: number;
  baseline: number;
  attack: number;
  mitigation: number;
  floodAttack?: number;
  floodMitigated?: number;
  label?: string;
}

// ─── Configuration Command ───
export interface ConfigCommand {
  command: string;
  explanation: string;
  category: 'acl' | 'port-security' | 'static-arp' | 'general';
}

// ─── Results Data ───
export interface AttackResult {
  attackName: string;
  attackType: AttackType;
  layer: string;
  ciaImpact: string;
  baselineThroughput: number;
  attackThroughput: number;
  mitigatedThroughput: number;
  keyMetric: string;
  keyMetricValue: string;
  mitigationMethod: string;
  effectiveness: number;
  traceEvidence: string;
  modelingMethod: string;
}

// ─── Discrepancy Table Entry ───
export interface DiscrepancyItem {
  claim: string;
  sourceEvidence: string;
  validationPerformed: string;
  status: 'Verified' | 'Partially verified' | 'Simulated approximation' | 'Hardcoded/demo data' | 'Not implemented' | 'Unable to verify';
  requiredAction: string;
}

// ─── Trace Audit Summary ───
export interface TraceAuditMetrics {
  mode: string;
  totalLines: number;
  fileSizeMb: number;
  totalDrops: number;
  legitServerPackets: number;
  floodServerPackets: number;
  avgLegitThroughputMbps: number; // Full 10s run average (0.0s-10.0s)
  attackWindowThroughputMbps?: number; // 3.0s-8.0s phase average
  recoveredSteadyStateThroughputMbps?: number; // 5.0s-10.0s post-mitigation steady state
  note?: string;
}

