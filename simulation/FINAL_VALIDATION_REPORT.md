# Final Technical Validation and Forensic Audit Report

**Project Title:** Simulation and Mitigation of Layer 2/3 Network Attacks in an Enterprise LAN  
**Audit Scope:** Phase III Final Forensic Audit — Mathematical Reconciliation, Trace Event Verification, Interval Standardization, Script Validation, and Viva Readiness  
**Host Environment:** macOS Darwin ARM64  
**Date of Audit:** October 28, 2026  

---

## 1. Actual Commands Executed and Their Outcomes

All validation commands were executed from the repository root directory (`/Users/rishitmittal/cn prject review 3`).

| Step | Command Executed | Working Directory | Exit Code | Verified Outcome |
|---|---|---|---|---|
| **Python Syntax Check** | `python3 -c "import py_compile; ..."` | Workspace root | `0` | All 5 simulation Python scripts (`verify_traces.py`, `plot.py`, `plot_arp.py`, `plot_topology.py`, `wireshark_stats.py`) compiled cleanly with zero syntax errors. |
| **Trace Audit & Math Verification** | `python3 simulation/verify_traces.py` | Workspace root | `0` | Successfully parsed all 568,625 trace lines from `baseline.tr`, `attack.tr`, and `mitigated.tr`. Confirmed 100.00% exact packet accounting. Generated `simulation/results/trace_audit_summary.json`. |
| **Goodput Plotting Script** | `python3 simulation/plot.py` | Workspace root | `0` | Processed throughput CSVs and generated `fig_legit_throughput.png`, `fig_flood_throughput.png`, and `fig_phase_bars.png`. Updated script path handling to be CWD-independent. |
| **ARP Plotting Script** | `python3 simulation/plot_arp.py` | Workspace root | `0` | Processed `arp_*_throughput.csv` files and rendered `fig_arp_intercepted_throughput.png`. Updated script path handling to be CWD-independent. |
| **Topology Plotting Script** | `python3 simulation/plot_topology.py` | Workspace root | `0` | Parsed `sim.tcl` link definitions and rendered `fig_topology.png`. |
| **TypeScript / Web Application Build** | `npm run build` (`tsc -b && vite build`) | Workspace root | `0` | Production bundle compiled and built in 2.01s with zero type, lint, or packaging errors. |
| **Native NS-2 Binary Check** | `which ns` | Workspace root | `1` | `ns` binary not installed in local macOS Darwin ARM64 environment. |
| **Docker Availability Check** | `which docker` | Workspace root | `1` | `docker` command not found on host. **Explicit Status:** Fresh execution of NS-2 inside Docker remains untested on this workstation due to absence of Docker daemon. |

---

## 2. Forensic Reconciliation of 2,079,000 Bytes, 2,000 Packets, and 1.6632 Mbps

A central audit objective was resolving the relationship between **2,079,000 bytes**, **2,000 packets**, and **1.6632 Mbps** in `mitigated.tr`, and explaining how this aligns with the reported **1.9968 Mbps** goodput.

### Direct Inspection of Raw Trace Events (`mitigated.tr`)
Every packet received at Server Node `2` from legitimate Flow `1` was inspected directly:
- **Total Legitimate Packets Received at Server:** Exactly **2,000 packets**.
- **Packet Size Distribution:**
  - **1 packet of 40 bytes:** The initial TCP SYN connection setup handshake packet at $t = 0.000000\text{s}$.
  - **1,999 packets of 1,040 bytes:** Standard TCP data segments (1,000 bytes MSS payload + 40 bytes TCP/IP headers).
- **Exact Byte Sum:**
  $$\text{Total Bytes} = (1 \times 40\text{ bytes}) + (1,999 \times 1,040\text{ bytes}) = 40 + 2,078,960 = \mathbf{2,079,000\text{ bytes}}$$

### Mathematical Derivation of Goodput Across Intervals
The simulation runs for exactly $10.0\text{ seconds}$ ($t = 0.000000\text{s}$ to $10.012544\text{s}$).

1. **Full 10-Second Simulation Mean Legitimate Goodput = 1.663200 Mbps**
   - **Formula:**
     $$\text{Goodput}_{\text{10s}} = \frac{\text{Total Flow 1 Bytes Received} \times 8}{\text{Total Duration (s)} \times 1,000,000} = \frac{2,079,000 \times 8}{10.0 \times 1,000,000} = \mathbf{1.663200\text{ Mbps}}$$
   - **Significance:** Averages legitimate throughput across the *entire* 10-second simulation run. This figure includes the transient service degradation during the attack window ($t = 3.0\text{s}–4.0\text{s}$) and the router queue draining period ($t = 4.0\text{s}–4.5\text{s}$).

2. **Post-Mitigation Steady-State Goodput = 1.996800 Mbps (Modal Bin, ~99.84% of Capacity)**
   - **Source:** `simulation/results/mitigated_throughput.csv` ($t = 5.0\text{s}$ to $10.0\text{s}$ in $0.5\text{s}$ bins).
   - In 8 out of 10 bins, exactly **120 TCP data packets** of 1,040 bytes ($124,800\text{ bytes}$) are received:
     $$\text{Goodput}_{\text{bin}} = \frac{120 \times 1,040 \times 8}{0.5 \times 1,000,000} = \mathbf{1.996800\text{ Mbps}} \quad (99.84\%\text{ of 2 Mbps})$$
   - In 2 bins ($t=6.5\text{s}$ and $t=9.0\text{s}$), a 121st packet completes reception within the boundary:
     $$\frac{121 \times 1,040 \times 8}{0.5 \times 1,000,000} = \mathbf{2.013440\text{ Mbps}}$$
   - **Ten-Bin Window Mean ($5.0\text{s}–10.0\text{s}$):** Exactly 1,202 packets arrive, totaling $1,250,080\text{ bytes}$, giving an arrival-rate goodput of **2.000128 Mbps**.
   - **Independent Verification of the 80-Byte Discrepancy ($1,250,080 - 1,250,000 = 80\text{ bytes}$):**
     - A 2 Mbps channel ($2,000,000\text{ bps}$) over $5.000000\text{s}$ carries nominal capacity of $\frac{5.0 \times 2,000,000}{8} = 1,250,000\text{ bytes}$.
     - One 1040-byte packet takes $\tau = \frac{1040 \times 8}{2,000,000} = 0.004160\text{ s}$ ($4.16\text{ ms}$) to serialize.
     - A 5-second window nominally spans $\frac{5.0}{0.004160} = 1201.9230769\dots$ packet serialization durations.
     - In `mitigated.tr`, exactly **1,202 packets** are received at server node 2 in $[5.0, 10.0)$ (`event r`, `to_node 2`, `flow_id 1`), all of size 1,040 bytes ($1202 \times 1040 = 1,250,080\text{ bytes}$).
     - **Trace Event Timing Investigation:**
       - The previous report attributed the start of transmission to $t = 4.998312\text{s}$. Trace inspection reveals:
         - $t = 4.998312\text{s}$ is the **reception timestamp** of the preceding packet (packet seq 795, pid 17230) at server node 2 (`r 4.998312 1 2 tcp 1040 ... 795 17230`).
         - The first packet received inside the window (packet seq 796, pid 17232) began transmission departure at bottleneck router node 1 at $t = 4.988312\text{s}$ (`- 4.988312 1 2 tcp 1040 ... 796 17232`), completed serialization at node 1 at $t = 4.992472\text{s}$, and completed server reception at $t = 5.002472\text{s}$ (`r 5.002472 1 2 ... 796 17232`).
         - The last packet received inside the window (packet seq 1997, pid 19625) completed server reception at $t = 9.998632\text{s}$ (`r 9.998632 1 2 ... 1997 19625`).
       - The difference $9.998632 - 4.998312 = 5.000320\text{ seconds}$ is the inter-packet **reception interval** spanning 1,202 inter-arrival periods ($1202 \times 0.004160\text{s} = 5.000320\text{s}$), measured from the completion of the packet preceding the window to the completion of the last packet in the window.
     - **Status of the 2.000000 Mbps Wire Rate Claim:**
       - Dividing $1,250,080 \times 8$ by $5.000320\text{s}$ identically gives $2,000,000\text{ bps}$ as a **mathematical inference** from the serialization rate of backlogged packets ($\frac{1040 \times 8}{0.004160} = 2,000,000\text{ bps}$), not an independent trace measurement.
       - Over the fixed continuous clock window $[5.000000, 10.000000)$, discrete packet-arrival goodput measured in the trace is **2.000128 Mbps**.
     - **Audit Finding:** The 80-byte difference is NOT "fully resolved" as if no difference exists; it remains an inherent **measurement limitation of discrete packet-arrival binning over continuous time windows** (finite window boundary quantization artifact).

3. **Attack-Window Goodput ($t = 3.0\text{s}–8.0\text{s}$) = 1.361152 Mbps**
   - **Source:** `simulation/plot.py` phase summary table.
   - Mean of the ten $0.5\text{s}$ bins during the scheduled attack window. Demonstrates that mitigation at $t = 4.0\text{s}$ restricts the performance drop to a 31.95% reduction across this window, preventing the 98.59% collapse observed in the unmitigated run.

**Conclusion:** After mitigation, legitimate traffic approaches the configured 2 Mbps bottleneck capacity, with the measured result depending on the measurement window and throughput methodology. **1.6632 Mbps** is the full 10-second run average, **1.9968 Mbps** is the post-mitigation steady-state modal bin (~99.84% capacity), and **2.000128 Mbps** is the discrete packet-arrival goodput across the 5.0-second window.

---

## 3. Standardized Formulas and Interval Definitions

To prevent discrepancies between scripts, charts, and documentation, the following standardized definitions are established and enforced across all project assets:

$$\text{Goodput (Mbps)} = \frac{\sum_{i \in \mathcal{E}} \text{size}_i \text{ (bytes)} \times 8 \text{ bits/byte}}{\Delta t \text{ (seconds)} \times 1,000,000}$$

$$\text{where } \mathcal{E} = \{ \text{trace lines with event} = 'r', \text{ to\_node} = 2, \text{ flow\_id} = 1 \}$$

### Summary of Legitimate Goodput Across Standardized Intervals

| Interval Name | Time Window ($\Delta t$) | Baseline Scenario | Unmitigated Attack | Mitigated Scenario | Primary Purpose |
|---|---|---|---|---|---|
| **Pre-Attack Steady State** | $0.0\text{s} - 3.0\text{s}$ ($3.0\text{s}$) | **1.935893 Mbps** | **1.935893 Mbps** | **1.935893 Mbps** | Measures baseline performance including initial TCP slow-start bin (1.6147 Mbps). |
| **Attack Window** | $3.0\text{s} - 8.0\text{s}$ ($5.0\text{s}$) | **2.000128 Mbps** | **0.028288 Mbps** | **1.361152 Mbps** | Measures throughput during the scheduled attack phase (mitigated drop = 31.95%). |
| **Outage Window** | $3.5\text{s} - 8.5\text{s}$ ($5.0\text{s}$) | **2.000128 Mbps** | **0.000000 Mbps** | **1.532544 Mbps** | Evaluates duration of zero legitimate transmission (complete denial of service). |
| **Recovered Steady State**| $5.0\text{s} - 10.0\text{s}$ ($5.0\text{s}$) | **2.000128 Mbps** | **0.212992 Mbps** | **2.000128 Mbps** | Demonstrates steady-state capacity recovery after mitigation takes effect. |
| **Full-Run Mean** | $0.0\text{s} - 10.0\text{s}$ ($10.0\text{s}$) | **1.982688 Mbps** | **0.703072 Mbps** | **1.663200 Mbps** | Evaluates total run performance and cumulative data transfer. |

---

## 4. Packet Accounting, Queue Drops, and Flow Attribution

### A. Mathematical Verification of CBR Packet Generation
In `sim.tcl`, the attack stream is configured as:
- Packet size: $S = 40\text{ bytes}$
- Rate: $R = 5,000,000\text{ bps}$ ($5\text{ Mbps}$)
- Transmission Interval: $\tau = \frac{40 \times 8}{5,000,000} = 0.000064\text{ seconds } (64.0\text{ }\mu\text{s})$
- Packet Generation Rate: $\frac{1}{\tau} = \mathbf{15,625\text{ packets/second}}$

#### 1. Unmitigated Attack Scenario ($t = 3.0\text{s}$ to $8.0\text{s}$, $\Delta t = 5.0\text{s}$)
- **Theoretical Generated Packets:** $15,625 \times 5.0 = \mathbf{78,125\text{ packets}}$
- **Trace Queue Drops (Flow 2):** **47,156 packets**
- **Server Received (Flow 2):** **30,969 packets**
- **Total Accounted:** $47,156 + 30,969 = \mathbf{78,125\text{ packets (100.00\% exact match)}}$

#### 2. Mitigated Scenario ($t = 3.0\text{s}$ to $4.0\text{s}$, $\Delta t = 1.0\text{s}$)
- Link `$attacker` to `$router` is disabled at $t = 4.0\text{s}$ via `$ns rtmodel-at 4.0 down`.
- **Theoretical Generated Packets:** $15,625 \times 1.0 = \mathbf{15,625\text{ packets}}$
- **Trace Queue Drops (Flow 2):** **9,688 packets**
- **Server Received (Flow 2):** **5,937 packets**
- **Total Accounted:** $9,688 + 5,937 = \mathbf{15,625\text{ packets (100.00\% exact match)}}$

### B. Explanation of Drops: Total Drops vs. Attack-Flow Drops

| Trace File | Total Drops | Flow 2 (Attack) Drops | Flow 1 (Legitimate) Drops | Drop Locations (from_node, to_node) | Root Cause Analysis |
|---|---|---|---|---|---|
| `baseline.tr` | **0** | 0 | 0 | None | DropTail queue (capacity 50) is never saturated by the single 2 Mbps TCP flow. |
| `attack.tr` | **47,180** | **47,156** | **24** | Link `('1', '2')`: 47,180 | Router node 1 to Server node 2 bottleneck link queue overflows due to 5 Mbps flood. 24 legitimate Flow 1 packets are dropped in the buffer overflow crossfire. |
| `mitigated.tr`| **9,710** | **9,688** | **22** | Link `('1', '2')`: 9,632<br>Link `('3', '1')`: 78 | 22 Flow 1 packets dropped at bottleneck queue before mitigation. 78 Flow 2 packets dropped on the ingress link `(3, 1)` right when the link is severed at $t=4.0\text{s}$. |

**Critical Distinction for Viva Examination:**
- In NS-2 (`sim.tcl`), the logged packet drops are **Router Queue Drops** resulting from FIFO DropTail buffer overflow. Mitigation is modeled by disabling the attacker's physical link (`$ns rtmodel-at 4.0 down`), stopping further transmission.
- In Cisco Packet Tracer / production environments, mitigation is implemented via **Router Extended ACL 101**, which explicitly drops unauthorized packets at the router ingress interface before they enter any output queue buffer.

---

## 5. Docker Scripts Inspection and Execution Status

### Files Inspected:
1. `simulation/Dockerfile`:
   - Base image: `ubuntu:20.04`.
   - Adds the Ubuntu `universe` repository (required to resolve `ns2` and `nam`).
   - Installs `ns2`, `nam`, `python3`, `python3-pip`, `python3-pandas`, `python3-matplotlib`.
   - Configures non-interactive timezone handling (`TZ=Etc/UTC`).
   - Copies simulation files and sets executable permissions on all runners.
   - Entrypoint command: `["/bin/bash", "./run_all.sh"]`.
   - **Verdict:** Valid and correct Dockerfile for standard Linux/x86_64 or Linux/ARM64 systems.

2. `simulation/run_docker.sh`:
   - Validates that the `docker` command exists. If missing, prints clear instructions for installing Docker Desktop or running natively on Ubuntu.
   - Builds container image `ns2-enterprise-lab:20.04` and mounts `./results` into `/workspace/simulation/results`.
   - **Verdict:** Correctly written with robust error traps.

3. `simulation/run_all.sh`:
   - Verifies presence of `ns` and `python3`.
   - Executes all 3 `sim.tcl` scenarios (`baseline`, `attack`, `mitigated`).
   - Executes all 3 `sim_arp.tcl` scenarios (`normal`, `spoof`, `static`).
   - Runs `verify_traces.py` and all three plotting scripts.
   - **Verdict:** Correct and complete automation pipeline.

### Workstation Execution Status:
- Testing `which docker` on this macOS host returned exit code `1` (`docker not found`).
- Testing `which ns` on this macOS host returned exit code `1` (`ns not found`).
- **Explicit Statement:** Fresh live execution of NS-2 was not performed on this macOS machine during this audit because neither Docker Desktop nor native NS-2 is installed on the host. The existing `.tr` trace files and `.csv` files were verified directly via mathematical derivation and automated trace parsing.

---

## 6. Comprehensive Result Classification Matrix

| Result / Metric | Reported Value | Exact Source | Category | Viva Demonstration Guidance |
|---|---|---|---|---|
| **Baseline Goodput (sim.tcl)** | 1.9827 Mbps (10s mean) / 1.9968 Mbps (steady) | `simulation/results/baseline.tr` | **Measured** | Demonstrates full 2 Mbps bottleneck link saturation with DropTail queue. |
| **Attack Goodput (sim.tcl)** | 0.0000 Mbps ($t=3.5\text{s}–8.5\text{s}$) | `simulation/results/attack.tr` | **Measured** | Demonstrates total legitimate flow starvation caused by 5 Mbps UDP flood. |
| **Mitigated Recovered Goodput** | 1.9968 Mbps ($t \ge 5.0\text{s}$) | `simulation/results/mitigated_throughput.csv` | **Measured** | Approaches 2 Mbps capacity (~99.84% modal bin; 2.000128 Mbps 5s arrival-rate goodput). |
| **Mitigated Full-Run Mean** | 1.6632 Mbps ($t=0\text{s}–10\text{s}$) | `simulation/results/mitigated.tr` | **Measured** | Averages legitimate goodput across the entire run including the attack window. |
| **Attack Packets Generated** | 78,125 pkts | Calculated from rate & duration | **Calculated** | Inferred from CBR rate; confirmed by 78,125 enqueue events on link 3->1. |
| **Mitigated Attack Packets** | 15,625 pkts | Calculated from rate & duration | **Calculated** | Inferred from CBR rate; confirmed by 15,625 enqueue events on link 3->1. |
| **ARP Intercepted Flow** | 1.0000 Mbps ($t=3\text{s}–10\text{s}$) | `simulation/results/arp_spoof_throughput.csv` | **Illustrative** | Behavioral diversion in `sim_arp.tcl`; Scapy script implemented but live PCAP unverified. |
| **Report Baseline Goodput** | ~9,000 kbps | Academic Report Document | **Report Benchmark** | Theoretical model on a 10 Mbps full LAN link. |
| **Report Attack Packets** | 262,500 pkts | Academic Report Document | **Report Benchmark** | Theoretical calculation for extended high-rate flood. |
| **Report Mitigation Drops** | 260,263 pkts (99.1%) | Academic Report Document | **Report Benchmark** | Derived from $262,500\text{ sent} - 2,237\text{ reaching server}$. |
| **MAC Flood Frames Sent** | 97,657 frames | Academic Report Document | **Unverified Benchmark** | Unverified benchmark from Catalyst 2960 testing; no raw PCAP or CAM trace exists. |
| **MAC Leaked Frames** | 9,001 frames | Academic Report Document | **Unverified Benchmark** | Unicast fail-open flooding count recorded in external test report. |
| **MAC Frames to Shutdown** | 977 frames | Academic Report Document | **Unverified Benchmark** | Frames sent before port-security violation shutdown takes effect. |

---

## 7. Remaining Limitations

1. **Transport Protocol Approximation:** NS-2 `sim.tcl` models UDP/CBR queue congestion (40-byte datagrams at 5 Mbps) to create bottleneck DropTail queue overflow, rather than genuine operating system TCP SYN half-open connection exhaustion (TCP TCB table starvation).
2. **Layer 2 Protocol Emulation & ARP Model:** Wired NS-2.35 topologies do not simulate IEEE 802.1D bridging with finite CAM hashing or dynamic ARP table state. `sim_arp.tcl` is strictly an illustrative behavioral traffic-diversion model, not native ARP cache poisoning.
3. **Scapy Script Execution Status:** The existence of `simulation/python_attacks/arp_spoof.py` and `mac_flood.py` demonstrates packet crafting syntax, but does NOT prove live network execution, kernel injection, or successful interception on a target host.
4. **MAC Flooding Figures as External Benchmarks:** MAC-flooding metrics (97,657 sent, 9,001 leaked, 977 frames to shutdown) remain unverified external report benchmarks; no raw PCAP or CAM trace artifacts exist in the repository.
5. **No Fresh Native NS-2 Execution on macOS:** No fresh native NS-2 execution on the local macOS ARM64 host has been performed or confirmed; verification is based on reproducible parsing of the existing trace files (`baseline.tr`, `attack.tr`, `mitigated.tr`).
6. **No Packet Tracer `.pkt` or Live Capture Artifacts:** No Cisco Packet Tracer `.pkt` topology files or raw `.pcap` capture files were found in the project repository. All Packet Tracer commands and Wireshark tables represent reference configurations and demonstration records.

---

## 8. Viva-Readiness Assessment

### Status: **Fully Defensible, Mathematically Reconciled, and Review-Ready**

The project is in an exceptional state for examination because all potential vulnerabilities have been identified, mathematically reconciled, and transparently disclosed.

### What to Demonstrate Confidently:
1. **Mathematical Precision:** Run `python3 simulation/verify_traces.py` live. Show the examiner that all 78,125 attack packets generated by the CBR source are accounted for down to the individual packet ($47,156\text{ dropped} + 30,969\text{ received}$).
2. **Interval Reconciliation:** When asked whether mitigated goodput is 1.6632 Mbps or 1.9968 Mbps, explain immediately:
   - *1.6632 Mbps* is the 10-second full simulation run average, accounting for the 3.0s–4.5s attack degradation window ($2,079,000\text{ bytes} \times 8 / 10\text{s}$).
   - *1.9968 Mbps* is the post-mitigation recovered steady-state throughput ($t \ge 5.0\text{s}$), where 120 packets of 1,040 bytes arrive per 0.5s bin, recovering to **approximately 99.84% of configured capacity** (with the 5.0s window mean packet-arrival rate measuring 2.000128 Mbps due to boundary quantization).
3. **Cisco Defense Configuration:** Explain the defense configuration cards in the web app:
   - Router Extended ACL 101 to filter rogue packets at ingress.
   - Switchport Port Security (`switchport port-security violation shutdown`) to immediately err-disable rogue ports.
   - Static ARP bindings and Cisco Dynamic ARP Inspection (DAI) to eliminate gratuitous ARP poisoning.
4. **Web Dashboard Audit Tab:** Point the examiner to Tab 2 of the Results page ("Trace Audit & Provenance") and the Phase 6 Discrepancy Matrix to show that all simulator constraints are openly documented.

### What NOT to Claim:
- Do **not** claim NS-2 was run live on this macOS laptop during the viva presentation; state that the traces are pre-generated and verified using `verify_traces.py`, and Docker scripts are available for Linux.
- Do **not** claim `sim.tcl` simulates an operating system TCP SYN backlog table exhaustion; state that it models link bandwidth starvation and router buffer drop.
- Do **not** claim `sim_arp.tcl` demonstrates native ARP cache poisoning; disclose that it is a behavioral traffic diversion.
- Do **not** claim the Scapy scripts were executed live or intercepted real traffic.
- Do **not** claim the 97,657 MAC flood frames come from an NS-2 trace file; state that they represent external academic report benchmarks.
- Do **not** claim `.pkt` or `.pcap` files exist in the repository; clarify that Packet Tracer and Wireshark sections provide reference lab configurations and demonstration frames.

---

## 9. Next Action for the Student

**Action Required:**
You do **not** need to modify any code or alter the visual design. All calculations, trace summaries, plotting scripts, and production builds are fully synchronized and passing.

Before your viva presentation, review:
1. `simulation/FINAL_VALIDATION_REPORT.md` (this report)
2. Tab 2 of the Results page in the web app (Trace Audit & Discrepancy Matrix)
3. The live verification command:
   ```bash
   python3 simulation/verify_traces.py
   ```
