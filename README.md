# Simulation and Mitigation of Layer 2/3 Network Attacks in an Enterprise LAN

An interactive, educational cybersecurity network monitoring and simulation platform demonstrating Layer 2 and Layer 3 attacks and their defensive mitigations, combining quantitative research results from **Network Simulator 2 (NS2)**, **Cisco Packet Tracer**, and **Wireshark**.

Built for University Computer Networks Laboratory Evaluation and Project Review 3.

---

## 🎯 Project Overview

This platform visually models, benchmarks, and explains three canonical enterprise LAN attack vectors:

1. **TCP SYN Flooding (Layer 4/3 - Availability)**:
   - Evaluates half-open connection exhaustion on a critical enterprise server.
   - Compares unmitigated outage (12-second total loss of service) against router Access Control List (ACL) ingress rate limiting and packet filtering.
2. **ARP Cache Poisoning / Spoofing (Layer 2 - Confidentiality/Integrity)**:
   - Demonstrates gratuitous ARP reply manipulation causing traffic diversion through an eavesdropping host (Man-in-the-Middle).
   - Demonstrates how static ARP binding and Dynamic ARP Inspection (DAI) preserve legitimate traffic paths.
3. **MAC Address Table Flooding (Layer 2 - Confidentiality)**:
   - Illustrates switch CAM table exhaustion leading to switch fail-open behavior (broadcasting unicast frames as hub floods).
   - Demonstrates Cisco IOS switchport port security in shutdown violation mode.

---

## 📊 Academic Reference Benchmarks

This laboratory implementation uses exact quantitative reference figures from academic research benchmarks:

| Attack Vector | Layer | Metric | Baseline | Unmitigated Attack | Mitigated Defense |
|---|---|---|---|---|---|
| **TCP SYN Flood** | L4/L3 | Server Throughput | ~9,000 kbps | **0 kbps** (12s outage) | **8,894–8,902 kbps** |
| | | Attack Packets | 0 | 262,500 pkts | 260,263 dropped (2,237 passed) |
| **ARP Spoofing** | L2 | Intercepted Pkts | 0 | **71,822 pkts** | **0 pkts** |
| | | Throughput | ~10,000 kbps | ~10,000 kbps (hidden) | ~10,000 kbps |
| **MAC Flooding** | L2 | Total Flood Frames| 0 | 97,657 frames | 977 frames (port shutdown) |
| | | Flooded Copies | 0 | **9,001 frames** | **0 frames** |

*Note on Simulator Modeling*: As disclosed in the academic documentation, NS2 approximates the SYN flood attack via high-volume CBR/UDP streams and models ARP diversion through scripted routing overrides due to NS2's protocol-layer abstractions.

---

## 🛠️ Multi-Tool Simulation Synergy

- **Network Simulator 2 (NS2)**: Event scheduling, quantitative packet delivery ratios, drop statistics, and queue delay models.
- **Cisco Packet Tracer**: Layer 2 CAM table state transitions, Catalyst switch CLI, and IOS port security violation behavior.
- **Wireshark**: Deep packet inspection, pcap dissections, frame syntax analysis, and educational display filters (`tcp.flags.syn == 1 && tcp.flags.ack == 0`, `arp.opcode == 2`, `eth`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository (or navigate to project directory)
cd "cn prject review 3"

# Install dependencies
npm install
```

### Running Locally
```bash
# Launch Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Architecture

```
├── index.html                  # HTML entry point with dark cyber theme
├── package.json                # Project dependencies and build scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS cybersecurity design tokens
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite bundling configuration
└── src/
    ├── main.tsx                # React DOM mount point with BrowserRouter
    ├── App.tsx                 # Root router with Navbar and Footer
    ├── index.css               # Global typography, animations, and glow effects
    ├── types.ts                # TypeScript interfaces for nodes, packets, metrics
    ├── components/
    │   ├── Navbar.tsx          # Responsive navigation bar with status indicator
    │   ├── MetricCard.tsx      # Cyber-styled telemetry cards with delta stats
    │   ├── SimulationControls.tsx # Play, pause, step, reset, mode toggles
    │   ├── ThroughputChart.tsx # Recharts-based live telemetry line charts
    │   └── TopologyMap.tsx     # Dynamic SVG enterprise LAN topology visualization
    ├── pages/
    │   ├── Dashboard.tsx       # Main laboratory overview with KPIs and summaries
    │   ├── TopologyPage.tsx    # Interactive full-screen network diagram
    │   ├── SynFloodPage.tsx    # Module A: TCP SYN flood simulation & ACL mitigation
    │   ├── ArpSpoofPage.tsx    # Module B: ARP poisoning simulation & static ARP
    │   ├── MacFloodPage.tsx    # Module C: CAM table flood & port security
    │   ├── TrafficAnalysisPage.tsx # Wireshark-inspired protocol analyzer
    │   ├── ConfigLabPage.tsx   # Cisco Packet Tracer IOS configuration generator
    │   ├── ResultsPage.tsx     # Empirical comparison tables & conclusions
    │   └── DocumentationPage.tsx # Academic abstract, methodology & viva preparation
    ├── data/
    │   └── simulationData.ts   # Deterministic benchmark datasets and IOS configurations
    └── hooks/
        └── useSimulation.ts    # Deterministic simulation timeline and state management
```

---

## 🛡️ License & Academic Citation

Developed for academic demonstration and laboratory project evaluation. All rights reserved.
