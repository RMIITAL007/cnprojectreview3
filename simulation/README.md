# DoS Attack and Mitigation in an Enterprise Network (NS-2.35)

This Computer Networks project compares normal TCP/FTP traffic with a UDP flood
and a simple mitigation in an NS-2.35 wired enterprise-network model. NS-2 Tcl
is the core simulator; Python makes graphs from NS-2 CSV output. Wireshark and
`tshark` are optional, separate supporting evidence from an authorized VM lab.

## Topology and experiment

The simulation has four nodes: `client`, `router`, `server`, and `attacker`.
The router represents the enterprise switch/gateway.

```text
client   -- 10 Mbps, 5 ms --\
                            router -- 2 Mbps, 10 ms -- server
attacker -- 10 Mbps, 5 ms --/
```

- Flow 1 is TCP with an FTP application from client to server from 0 to 10 s.
- Flow 2 is 40-byte UDP CBR traffic at 5 Mbps from attacker to server from 3 to 8 s.
- `baseline` has no attack traffic.
- `attack` enables the UDP flood.
- `mitigated` enables the flood, then disables the attacker--router link at 4 s.

The UDP CBR flood approximates the congestion caused by a SYN flood; it is not
a real TCP SYN flood. The link-down event approximates an ACL block and is not
how a real ACL works internally.

## Installation on Ubuntu 20.04

First try the Ubuntu packages for NS-2 and NAM:

```bash
sudo apt update
sudo apt install ns2 nam
```

Install the Python graph dependencies:

```bash
sudo apt install python3 python3-pandas python3-matplotlib
```

For the optional real-PCAP helper, also install `tshark`:

```bash
sudo apt install tshark
```

Check the core tools:

```bash
ns -v
python3 --version
```

If `ns` is unavailable after installation, use an Ubuntu 20.04 environment
with the NS-2.35 package installed, then run the project there.

## Run the NS-2 experiment

From this project directory, run all scenarios and create graphs:

```bash
chmod +x run_all.sh
./run_all.sh
```

The script runs these commands in order:

```bash
ns sim.tcl baseline
ns sim.tcl attack
ns sim.tcl mitigated
python3 plot.py
```

To run just one scenario, use for example:

```bash
ns sim.tcl attack
```

## Troubleshooting

- If `./run_all.sh` reports a permissions error, run `chmod +x run_all.sh` once,
  or use `bash run_all.sh`.
- If a script edited on Windows reports `bad interpreter` or `\r` errors, run
  `sed -i 's/\r$//' run_all.sh` on Ubuntu.
- To avoid accidentally using old CSVs after an interrupted run, manually remove
  old generated output before a fresh experiment: `rm -rf results/`. Only run
  this command when you are sure the previous generated results are no longer needed.

NAM does not launch automatically. To inspect a completed animation manually:

```bash
nam results/attack.nam
```

## Generated results

Each simulation mode creates these files in `results/`:

- `<mode>.tr`: NS-2 text trace.
- `<mode>.nam`: NAM animation trace.
- `<mode>_throughput.csv`: 0.5-second received throughput bins with
  `time_s`, legitimate `throughput_mbps`, and `flood_mbps`.

`plot.py` reads all three CSVs and saves:

- `fig_legit_throughput.png`: legitimate FTP throughput for all modes.
- `fig_flood_throughput.png`: flood throughput reaching the server.
- `fig_phase_bars.png`: average legitimate throughput before, during, and after attack.

It also prints a table of phase averages and the percentage FTP throughput drop
during the attack window compared with the baseline attack-window average. The
values are calculated only after the simulation runs; this project does not
hardcode expected throughput numbers.

In the line graphs, the shaded 3--8 s window shows when the flood is scheduled
in the attack scenario. The dashed 4 s line shows when mitigation begins; in the
mitigated scenario, flood traffic is stopped at that point.

## Expected behavior

The baseline FTP flow should approach the 2 Mbps router--server bottleneck after
TCP ramps up. During the attack, the UDP flood competes for that bottleneck, so
legitimate FTP throughput should drop. In the mitigated case, the attacker link
is disabled at 4 s, so the flood reaching the server should stop and FTP should
recover after queued traffic clears. Exact values depend on the NS-2 run and are
shown only in the generated CSVs and graphs.

## Optional Wireshark/tshark supporting evidence

This step is separate from the NS-2 results. NS-2 `.tr` files are text traces,
not PCAP files, so do **not** give them to Wireshark or `wireshark_stats.py`.

Use only an isolated VM lab that you own or are explicitly authorized to test.
For example, capture traffic from the lab interface while running the lab:

```bash
sudo tshark -i <iface> -w capture.pcap
```

Then summarize that real capture:

```bash
python3 wireshark_stats.py capture.pcap
```

The helper calls `tshark` through Python, prints total packets, per-second
packet counts, top source IPs, TCP SYN counts, and TCP SYN-ACK counts. It writes
`results/capture_packets_per_second.csv` for a packets-per-second graph. Use
`--output path/to/file.csv` to choose another CSV path.

## File guide

| File | Purpose |
| --- | --- |
| `sim.tcl` | NS-2 topology, traffic, mitigation, trace analysis, and CSV output. |
| `run_all.sh` | Checks tools, runs all three modes, then runs plotting. |
| `plot.py` | Reads NS-2 CSVs, creates PNG charts, and prints a summary table. |
| `wireshark_stats.py` | Optional summary of a real authorized-lab PCAP using tshark. |
| `results/` | Generated traces, CSV files, NAM files, and PNG graphs. |

## Limitations

- The attack is a UDP flood, not a real TCP SYN flood.
- The ACL is modeled by taking the attacker link down, which is a simplification.
- NS-2 does not model ARP or MAC learning in this wired setup, so Layer 2 attacks
  are out of scope.
