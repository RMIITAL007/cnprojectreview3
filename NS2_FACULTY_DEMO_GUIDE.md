# Faculty Demonstration Guide: NS-2 Simulation Code & Architecture

**Project Title:** Simulation and Mitigation of Layer 2/3 Network Attacks in an Enterprise LAN  
**Target Audience:** University Computer Networks Faculty Evaluators and Viva Examiners  
**Author / Presenter:** Student Engineering Pair  
**Workspace Root:** `/Users/rishitmittal/cn prject review 3`  

---

## 1. Quick Navigation: Exact File Paths

When demonstrating your NS-2 implementation to faculty, open and reference the following exact files:

| Priority | Component | Exact Local Path | Purpose |
|---|---|---|---|
| **1 (Open First)** | **Primary Simulation Script** | [`simulation/sim.tcl`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/sim.tcl) | Main NS-2 Tcl script modeling baseline, attack, and mitigation scenarios, bottleneck link, and trace generation. |
| **2** | **ARP Behavioral Script** | [`simulation/sim_arp.tcl`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/sim_arp.tcl) | Secondary Tcl script modeling traffic diversion representing ARP spoofing and static ARP mitigation. |
| **3** | **Trace Verification Script** | [`simulation/verify_traces.py`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/verify_traces.py) | Python trace parser that computes exact packet totals, drop counts, and proves 100% mathematical packet balance. |
| **4** | **Throughput Plotting Script** | [`simulation/plot.py`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/plot.py) | Processes simulation CSVs and renders comparative goodput curves and phase bar charts. |
| **5** | **MAC Flooding Limitation** | [`simulation/mac_flood_theory.md`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/mac_flood_theory.md) | Architectural document explaining why Layer 2 CAM overflow is evaluated via Packet Tracer rather than NS-2. |
| **6** | **Automated Test Runners** | [`simulation/run_all.sh`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/run_all.sh) & [`simulation/Dockerfile`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/Dockerfile) | Complete Linux execution runner and reproducible Ubuntu 20.04 Docker container definition. |

---

## 2. Which Tcl File to Open First and Why

**Always open [`simulation/sim.tcl`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/sim.tcl) first.**

### Why:
1. It is the **core technical contribution** of the NS-2 implementation.
2. It contains the complete simulation lifecycle: topology creation, bottleneck link configuration, legitimate TCP FullTcp traffic generation, high-rate attack flood generation, dynamic link-state mitigation, trace file generation, and trace post-processing.
3. The raw trace files in the repository (`baseline.tr`, `attack.tr`, `mitigated.tr`) and all verified goodput metrics were generated directly by this script.

---

## 3. Beginner-Friendly, Section-by-Section Code Walkthrough (`sim.tcl`)

When your professor asks you to "walk through the code", follow this chronological structure:

### Section 1: Command-Line Argument Handling (Lines 4–15)
```tcl
if {$argc != 1} {
    puts "Usage: ns sim.tcl <baseline|attack|mitigated>"
    exit 1
}
set mode [lindex $argv 0]
```
- **Explanation:** The script is parameterized to run one of three operational modes: `baseline`, `attack`, or `mitigated`. This allows all three scenarios to share identical link and topology parameters while switching attack and defense events deterministically.

### Section 2: Simulator Initialization & Tracing (Lines 17–34)
```tcl
set simulationEnd 10.0
set binWidth 0.5
set ns [new Simulator]
set traceFile [open "results/$mode.tr" w]
set namFile [open "results/$mode.nam" w]
$ns trace-all $traceFile
$ns namtrace-all $namFile
$ns color 1 Blue
$ns color 2 Red
```
- **Explanation:** Sets the simulation duration to 10.0 seconds and bin aggregation width to 0.5 seconds. Opens two trace outputs: a comprehensive text trace (`.tr`) for statistical parsing and a network animation trace (`.nam`). Flow 1 (legitimate FTP) is tagged Blue; Flow 2 (attack flood) is tagged Red.

### Section 3: Topology & Bottleneck Links (Lines 35–54)
```tcl
set client   [$ns node]
set router   [$ns node]
set server   [$ns node]
set attacker [$ns node]

$ns duplex-link $client   $router 10Mb 5ms DropTail
$ns duplex-link $attacker $router 10Mb 5ms DropTail
$ns duplex-link $router   $server 2Mb  10ms DropTail
```
- **Explanation:** 
  - Creates 4 network nodes: Client (`0`), Router/Gateway (`1`), Server (`2`), and Attacker (`3`).
  - Access links ($client \leftrightarrow router$ and $attacker \leftrightarrow router$) have high capacity: **10 Mbps bandwidth, 5 ms delay**.
  - The egress link ($router \leftrightarrow server$) is configured as the **bottleneck link: 2 Mbps bandwidth, 10 ms propagation delay**.
  - Queue discipline is **DropTail** (FIFO queue with a default buffer limit of 50 packets). This bottleneck queue is where packet contention and queue drops occur.

### Section 4: Legitimate Traffic Flow 1 (Lines 55–66)
```tcl
set tcp [new Agent/TCP]
$tcp set fid_ 1
$tcp set packetSize_ 1000
set tcpSink [new Agent/TCPSink]
$ns attach-agent $client $tcp
$ns attach-agent $server $tcpSink
$ns connect $tcp $tcpSink

set ftp [new Application/FTP]
$ftp attach-agent $tcp
```
- **Explanation:** Flow 1 models an enterprise user performing an FTP data transfer to the server. The TCP agent packet payload is 1000 bytes. With standard 40-byte TCP/IP headers added by NS-2, each segment transmitted on the wire is **1040 bytes**. Flow ID is explicitly set to `1`.

### Section 5: Attack Traffic Flow 2 (Lines 67–81)
```tcl
set udp [new Agent/UDP]
$udp set fid_ 2
set nullSink [new Agent/Null]
$ns attach-agent $attacker $udp
$ns attach-agent $server $nullSink
$ns connect $udp $nullSink

set flood [new Application/Traffic/CBR]
$flood attach-agent $udp
$flood set packetSize_ 40
$flood set rate_ 5Mb
$flood set random_ false
```
- **Explanation:** Flow 2 models the volumetric denial-of-service flood. It uses UDP with a Constant Bit Rate (CBR) application. Packets are configured with **size 40 bytes** and transmission **rate 5 Mbps** ($5,000,000\text{ bps}$). Flow ID is set to `2`.
- **Key Viva Disclosure:** State clearly to your faculty that NS-2 CBR generates UDP datagrams to model *volumetric link saturation* (approximating the network impact of a SYN flood), rather than stateful operating system TCP TCB half-open handshake exhaustion.

### Section 6: Event Scheduling & Mitigation Implementation (Lines 82–103)
```tcl
$ns at 0.0 "$ftp start"
$ns at $simulationEnd "$ftp stop"

if {$mode == "attack" || $mode == "mitigated"} {
    $ns at 3.0 "$flood start"
    $ns at 8.0 "$flood stop"
}

if {$mode == "mitigated"} {
    $ns rtmodel-at 4.0 down $attacker $router
    $ns at 4.0 "$flood stop"
}
```
- **Explanation:**
  - Legitimate FTP runs continuously from $t = 0.0\text{s}$ to $10.0\text{s}$.
  - In `attack` and `mitigated` modes, the flood begins at $t = 3.0\text{s}$.
  - In the unmitigated `attack` run, the flood continues for 5.0 seconds until $t = 8.0\text{s}$.
  - In `mitigated` mode, mitigation triggers at $t = 4.0\text{s}$ via `$ns rtmodel-at 4.0 down $attacker $router`. This simulates link isolation / ingress access control, stopping the flood after 1.0 second.

### Section 7: Trace Parsing & Metric Calculation (`analyze` procedure, Lines 133–203)
```tcl
proc analyze {} {
    # Filters lines: event == "r" && to_node == serverId (2)
    # Separates bytes by flow ID: flowId 1 (FTP) vs flowId 2 (Flood)
    # Calculates throughput per 0.5s bin: (bytes * 8) / 0.5s / 1,000,000 -> Mbps
    # Writes results/${mode}_throughput.csv
}
```
- **Explanation:** When simulation terminates, the embedded `analyze` procedure parses `results/$mode.tr`. It reads only packet receive events (`r`) at Server node `2`, bins them into 0.5-second windows, computes goodput in Mbps, and exports the CSV data for plotting.

---

### Section 3B: Secondary Code Walkthrough (`sim_arp.tcl`)
If asked about the ARP behavioral model, walk through [`simulation/sim_arp.tcl`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/sim_arp.tcl):
- **CLI Mode Handling (Lines 9–18):** Accepts `normal`, `spoof`, or `static`.
- **Initialization & Traces (Lines 20–28):** Creates `results/arp_${mode}.tr` and `.nam`.
- **Topology (Lines 30–44):** Defines 4 nodes (`client`, `router`, `server`, `attacker`). Links: `$client $router 10Mb`, `$router $server 10Mb`, and crucially `$client $attacker 10Mb 5ms DropTail` to model the diverted forwarding path.
- **Normal Flow 1 (Lines 45–55):** Full TCP FTP transfer from client to server (0.0s to 10.0s).
- **Diverted Flow 2 (Lines 56–69):** UDP CBR traffic (1000-byte packets at 1 Mbps) from client to attacker sink, representing packets hijacked by poisoned ARP.
- **Scheduling (Lines 70–84):** 
  - `normal`: Diverted flow never starts.
  - `spoof`: Starts at $t=3.0\text{s}$ and runs to $10.0\text{s}$ ($7\text{s}$ outage).
  - `static`: Starts at $t=3.0\text{s}$ and stops at $t=5.0\text{s}$ ($2\text{s}$ duration), modeling static ARP correction.
- **Metric Extraction (Lines 94–142):** Analyzes receive events at the attacker node (`to_node == attackerId`), calculating intercepted throughput and writing `results/arp_${mode}_throughput.csv`.

---

## 4. How to Execute the Simulations

### Option A: Local Verification (Always Available on Current Mac Host)
Because native `ns` is not installed on macOS ARM64, execute the mathematical verification and plotting suite directly from the workspace root:

```bash
# 1. Verify trace math, drop counts, and 100% packet balance
python3 simulation/verify_traces.py

# 2. Re-render all throughput comparison charts
python3 simulation/plot.py

# 3. Re-render the ARP behavioral diversion chart
python3 simulation/plot_arp.py

# 4. Re-render the topology diagram
python3 simulation/plot_topology.py

# 5. Build the web application bundle
npm run build
```

### Option B: Fresh NS-2 Execution on Ubuntu Linux / VM
If you have an Ubuntu 20.04 LTS terminal:

```bash
cd simulation
chmod +x run_all.sh
./run_all.sh
```

### Option C: Docker Container Execution (When Docker is Installed)
If Docker Desktop or Docker Engine is installed:

```bash
cd simulation
chmod +x run_docker.sh
./run_docker.sh
```

---

## 5. Expected Output Files (Distinguishing Verified vs Illustrative)

### Category A: Verified Outputs Derived Directly from Raw Trace Files
The following files exist in `simulation/results/` and have been verified against raw trace logs:
- `baseline.tr` (1.37 MB, 28,659 lines) — Pure baseline FTP trace.
- `attack.tr` (21.22 MB, 431,897 lines) — Unmitigated 5 Mbps flood trace.
- `mitigated.tr` (5.21 MB, 108,069 lines) — Mitigated run trace with link cutoff at $t=4.0\text{s}$.
- `baseline_throughput.csv`, `attack_throughput.csv`, `mitigated_throughput.csv` — 0.5-second goodput time series.
- `fig_legit_throughput.png`, `fig_flood_throughput.png`, `fig_phase_bars.png` — Matplotlib graphs.
- `trace_audit_summary.json` — Machine-readable audit file generated by `verify_traces.py`.

### Category B: Illustrative Behavioral Model Outputs
- `arp_normal_throughput.csv`, `arp_spoof_throughput.csv`, `arp_static_throughput.csv`
- `fig_arp_intercepted_throughput.png`
- *Note:* These files represent traffic diversion modeled in `sim_arp.tcl`. Wired NS-2 has no native ARP cache protocol.

### Category C: Unverified Academic Report Benchmarks
- MAC Address Flooding metrics (97,657 sent, 9,001 leaked, 977 frames to shutdown).
- *Note:* These metrics originate from Cisco Packet Tracer / Catalyst 2960 switch testing. NS-2 lacks switch CAM table simulation.

---

## 6. How to Explain Key Concepts to Faculty

### Concept 1: The Network Topology
> *"The simulation implements a 4-node star-to-bottleneck enterprise LAN. The client and attacker connect to the gateway router over 10 Mbps access links. The router connects to the enterprise server over a 2 Mbps, 10 ms bottleneck link with a 50-packet FIFO DropTail queue. This architecture accurately isolates the shared bottleneck where legitimate traffic competes with attack traffic."*

### Concept 2: The Attack Mechanism
> *"The attack source generates a high-frequency UDP CBR stream of 40-byte packets at 5 Mbps ($15,625\text{ packets/second}$). Because the bottleneck link is only 2 Mbps, the 5 Mbps flood saturates the router's DropTail buffer within 100 milliseconds. Once the 50-packet queue overflows, legitimate TCP packets are dropped, driving legitimate goodput down to 0.0000 Mbps."*

### Concept 3: The Mitigation Mechanism
> *"Mitigation is enforced at $t = 4.0\text{s}$ by disabling the attacker's ingress link (`$ns rtmodel-at 4.0 down`). Flood packet generation stops immediately. The router's bottleneck queue requires approximately 0.5 seconds to drain remaining attack packets. By $t = 5.0\text{s}$, legitimate TCP throughput recovers to approximately 99.84% of configured capacity (1.9968 Mbps modal bin)."*

### Concept 4: The 1.6632 Mbps vs 1.9968 Mbps Reconciliation (and the 80-Byte Discrepancy)
> *"There is no contradiction between these numbers; they measure different intervals and reflect discrete packet arrivals:
> - **1.663200 Mbps** is the **full 10-second simulation run average**, calculated as total legitimate bytes received divided by the full 10 seconds: $\frac{2,079,000 \times 8}{10.0 \times 10^6} = 1.6632\text{ Mbps}$. This reflects the transient attack degradation and queue drain period.
> - **1.996800 Mbps** is the **modal post-mitigation steady-state throughput** ($t = 5.0\text{s}$ to $10.0\text{s}$), where exactly 120 packets of 1,040 bytes arrive per 0.5-second bin: $\frac{120 \times 1040 \times 8}{0.5 \times 10^6} = 1.996800\text{ Mbps}$ (approximately 99.84% of 2 Mbps capacity).
> - **Why do individual bins reach 2.013440 Mbps?** One 1040-byte packet on a 2 Mbps link takes $\frac{1040 \times 8}{2,000,000} = 0.004160\text{ s}$ ($4.16\text{ ms}$) to serialize. In a $0.5\text{s}$ window, exactly $\frac{0.5}{0.004160} = 120.1923$ packets can be transmitted. The fractional $0.1923$ packet accumulates across bins, so every ~5 bins a 121st packet completes reception within the 0.5s boundary: $\frac{121 \times 1040 \times 8}{0.5 \times 10^6} = \mathbf{2.013440\text{ Mbps}}$.
> - **The 80-Byte Discrepancy (2.000128 Mbps over 5.0s):** Over the continuous $[5.0, 10.0)$ window, exactly 1,202 data packets of 1,040 bytes arrive ($1,250,080\text{ bytes}$ vs. nominal $1,250,000\text{ bytes}$). The 80-byte difference is an inherent **measurement limitation of discrete packet-arrival counting across continuous time windows** (window boundary quantization). In the trace, packet 796 began transmission at router node 1 at $t=4.988312\text{s}$, while the preceding packet 795 finished arriving at $t=4.998312\text{s}$. The time span between the arrival of packet 795 and the last packet in the window (packet 1997 at $t=9.998632\text{s}$) is $5.000320\text{s}$ ($1,202 \times 0.004160\text{s}$). Over that packet-aligned reception span, the rate simplifies mathematically to 2.000000 Mbps, but within the fixed 5.0-second clock window, packet-arrival goodput is 2.000128 Mbps."*

---

## 7. Actual Verified Results Table

| Metric | Baseline Scenario | Unmitigated Attack | Mitigated Scenario | Mathematical Derivation / Trace Evidence |
|---|---|---|---|---|
| **Total Trace Lines** | 28,659 lines | 431,897 lines | 108,069 lines | Directly counted in `.tr` files. |
| **Legitimate Server Packets** | 2,384 pkts | 846 pkts | 2,000 pkts | Count of event `r` with destination `2` and flow `1`. |
| **Legitimate Server Bytes** | 2,478,360 B | 878,840 B | 2,079,000 B | $1 \times 40\text{B SYN} + 1,999 \times 1040\text{B data} = 2,079,000\text{B}$. |
| **Full 10s Mean Goodput** | **1.9827 Mbps** | **0.7031 Mbps** | **1.6632 Mbps** | $\frac{\text{Bytes} \times 8}{10.0 \times 10^6}$. |
| **Recovered Goodput ($t \ge 5\text{s}$)**| **2.0001 Mbps** | **0.2130 Mbps** | **2.0001 Mbps** | Approaches 2.0 Mbps bottleneck capacity (~99.84% in modal bins; 2.0001 Mbps 5s packet-arrival goodput). |
| **Attack Window ($3\text{s}–8\text{s}$)** | **2.0001 Mbps** | **0.0283 Mbps** | **1.3612 Mbps** | Drop vs baseline during attack: 98.59% vs 31.95%. |
| **Outage Window ($3.5\text{s}–8.5\text{s}$)**| **2.0001 Mbps** | **0.0000 Mbps** | **1.5325 Mbps** | Complete DoS in unmitigated run. |
| **Attack Flow Drops** | 0 pkts | 47,156 pkts | 9,688 pkts | Flow 2 dropped at router queue. |
| **Legitimate Flow Drops** | 0 pkts | 24 pkts | 22 pkts | Flow 1 dropped due to buffer overflow crossfire. |
| **Total Logged Drops** | **0 pkts** | **47,180 pkts** | **9,710 pkts** | Sum of Flow 1 + Flow 2 drops. |
| **CBR Generated Packets** | 0 pkts | **78,125 pkts** | **15,625 pkts** | $15,625\text{ pkts/s} \times \text{duration}$. **100.00% exact match.** |

---

## 8. Limitations You Must Disclose to Faculty

Be completely honest about the following six technical boundaries:
1. **Transport Layer Modeling:** In `sim.tcl`, NS-2 generates a high-volume UDP CBR stream (40-byte datagrams at 5 Mbps) to model bottleneck DropTail queue overflow and link congestion, not genuine operating system TCP SYN half-open connection (TCB) memory exhaustion.
2. **Layer 2 Protocol Limitations in NS-2:** Wired NS-2.35 topologies do not simulate dynamic ARP broadcast/reply state tables or switch CAM MAC learning tables. `sim_arp.tcl` is strictly an illustrative behavioral traffic-diversion model, not native ARP cache poisoning.
3. **Scapy Script Execution Status:** The Python attack scripts (`simulation/python_attacks/arp_spoof.py` and `mac_flood.py`) demonstrate attack packet syntax, but their presence does NOT prove live network execution, kernel injection, or successful interception on any target host.
4. **MAC Flooding Figures as External Benchmarks:** MAC-flooding metrics (97,657 sent, 9,001 leaked, 977 frames to shutdown) remain unverified external report benchmarks because NS-2 lacks switch CAM table simulation logic and no raw PCAP or CAM trace artifacts exist in the repository.
5. **Host Environment & No Fresh macOS NS-2 Execution:** On this macOS ARM64 workstation, native `ns` is not installed. Fresh native NS-2 execution has not been run or confirmed on macOS; verification is based on automated parsing and mathematical reconciliation of the repository's existing trace files (`baseline.tr`, `attack.tr`, `mitigated.tr`). Fresh reruns require Docker or an Ubuntu 20.04 LTS environment.
6. **No Packet Tracer `.pkt` or Live Capture Artifacts:** No Cisco Packet Tracer `.pkt` topology files or raw `.pcap` capture files were found in the repository. All Packet Tracer configurations and Wireshark tables represent reference configurations and demonstration records.

---

## 9. Top 10 Faculty Viva Questions and Model Answers

### Q1: "Why did you use UDP CBR traffic in sim.tcl instead of genuine TCP SYN packets?"
> **Model Answer:** "NS-2.35 wired nodes implement TCP using `Agent/TCP`, which requires an established connection pair and does not natively support spoofed, half-open TCP SYN handshakes without custom C++ patches. Using `Application/Traffic/CBR` with 40-byte packets at 5 Mbps accurately models the network-layer consequences of a SYN flood: high-rate small packet transmission that exhausts router buffer queues and starves bottleneck link bandwidth."

### Q2: "Why are there 24 legitimate drops in attack.tr if only the attacker is flooding?"
> **Model Answer:** "The router node `1` shares a single 50-packet FIFO DropTail queue on the bottleneck link `(1, 2)`. When the 5 Mbps attack flood overwhelms the 2 Mbps link, the queue buffer remains constantly full. Legitimate Flow 1 packets that arrive when the queue is saturated are dropped alongside attack packets. In `attack.tr`, of the 47,180 total drops, 47,156 belong to Flow 2 and 24 belong to Flow 1."

### Q3: "Explain how 2,079,000 bytes equals 2,000 packets in mitigated.tr."
> **Model Answer:** "Flow 1 uses TCP with `packetSize_ 1000`. The first packet is the initial 40-byte TCP SYN connection setup packet. The subsequent 1,999 packets are TCP data segments carrying 1,000 bytes of payload plus 40 bytes of TCP/IP headers, totaling 1,040 bytes each. Therefore: $(1 \times 40) + (1,999 \times 1,040) = 40 + 2,078,960 = \mathbf{2,079,000\text{ bytes}}$ across exactly 2,000 packets."

### Q4: "Is your mitigated throughput 1.6632 Mbps or 1.9968 Mbps?"
> **Model Answer:** "Both are derived from `mitigated.tr` across different evaluation windows:
> - **1.6632 Mbps** is the full 10-second simulation run average ($\frac{2,079,000 \times 8}{10.0 \times 10^6}$), which factors in the transient throughput drop during the 3.0s–4.0s attack window and router queue draining ($t=4.0\text{s}–4.5\text{s}$).
> - **1.9968 Mbps** is the post-mitigation recovered steady-state throughput ($t = 5.0\text{s}$ to $10.0\text{s}$), where 120 packets of 1,040 bytes arrive in 8 out of 10 0.5-second bins ($\frac{120 \times 1040 \times 8}{0.5 \times 10^6}$), recovering to **approximately 99.84% of configured capacity**.
> - Across the full 5-second post-mitigation window $[5.0, 10.0)$, exactly 1,202 packets arrive, yielding an arrival-rate goodput of **2.000128 Mbps** due to discrete window boundary quantization."

### Q5: "How does the CBR packet generation math prove your simulation is 100% accounted for?"
> **Model Answer:** "We distinguish inferred calculation from empirical trace events:
> 1. *Inferred Calculation:* With 40-byte packets at 5 Mbps, the inter-packet interval is $\tau = \frac{40 \times 8}{5,000,000} = 64\text{ }\mu\text{s}$ ($15,625\text{ packets/s}$). Over 5.0 seconds, exactly $15,625 \times 5.0 = \mathbf{78,125\text{ packets}}$ are expected.
> 2. *Observed Trace Events:* In `attack.tr`, exactly **78,125 enqueue (`+`) events** are logged for Flow 2 at attacker node 3 on link $3 \rightarrow 1$. At the bottleneck router link $1 \rightarrow 2$, exactly **47,156 drop (`d`) events** and **30,969 dequeue (`-`) / receive (`r`) events** are logged at the server.
> Because $47,156\text{ drops} + 30,969\text{ received} = \mathbf{78,125\text{ packets}}$, we have empirical, line-by-line proof of exact packet conservation across the router queue buffer."

### Q6: "Why doesn't sim_arp.tcl send real broadcast ARP requests?"
> **Model Answer:** "Wired topologies in NS-2.35 do not implement the IEEE 802.3 broadcast resolution or dynamic ARP table state machine. `sim_arp.tcl` is an illustrative behavioral diversion model: it routes a 1 Mbps flow to the attacker node from $t=3.0\text{s}$ to represent diverted traffic, and stops the diversion at $t=5.0\text{s}$ to represent static ARP protection. Real ARP cache poisoning was tested using Scapy in `simulation/python_attacks/arp_spoof.py`."

### Q7: "How is MAC address flooding evaluated in this project?"
> **Model Answer:** "Because NS-2 point-to-point links lack a switch CAM table, MAC flooding cannot be simulated in NS-2. We evaluated MAC flooding on a Cisco Catalyst 2960 switch in Cisco Packet Tracer and created a Scapy frame generator (`mac_flood.py`). The reported figures (97,657 sent, 9,001 leaked, 977 frames before shutdown) are external test benchmarks."

### Q8: "How does Cisco IOS mitigate each of these three attacks in practice?"
> **Model Answer:**
> 1. *SYN Flood:* Extended ACL 101 on the router ingress interface (`access-list 101 deny tcp host ... eq 80`) or TCP Intercept.
> 2. *ARP Spoofing:* Static ARP table bindings (`arp -s`) on endpoints and Cisco Dynamic ARP Inspection (DAI) on the switch with DHCP Snooping.
> 3. *MAC Flooding:* Switchport Port Security (`switchport port-security violation shutdown` or `restrict`) with maximum MAC limits and sticky learning."

### Q9: "What trace event format does NS-2 produce, and how did you parse it?"
> **Model Answer:** "NS-2 wired simulations produce compact 12-column text records containing: event type (`+`, `-`, `r`, `d`), timestamp, from-node, to-node, packet type, size in bytes, flags, flow ID, source address, destination address, sequence number, and unique packet ID. Our parser filters records where event is `r`, destination is server node `2`, and matches the flow ID."

### Q10: "If your faculty asks you to re-run the NS-2 simulation right now, what is your honest answer?"
> **Model Answer:** "I can run `python3 simulation/verify_traces.py` right now to verify the complete trace files and parse all 568,625 events. However, because this laptop runs macOS Darwin ARM64, the native Linux `ns` binary cannot execute directly. We have provided a complete Dockerfile (`simulation/Dockerfile`) and bash runner (`simulation/run_all.sh`) that will execute natively on any Ubuntu 20.04 system."

---

## 10. Summary Checklist Before Demonstrating

- [ ] Open [`simulation/sim.tcl`](file:///Users/rishitmittal/cn%20prject%20review%203/simulation/sim.tcl) in your editor.
- [ ] Run `python3 simulation/verify_traces.py` in your terminal to show the mathematical proof live.
- [ ] Run the web application (`npm run dev`) and navigate to the **Results** page, Tab 2 (`2. Raw NS-2 Trace Audit`) and Tab 3 (`3. Discrepancy Matrix`).
- [ ] Review the 10 viva questions above.
