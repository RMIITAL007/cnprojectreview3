#!/usr/bin/env bash
# Run every NS-2 scenario, parse trace metrics, and generate verification graphs.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v ns >/dev/null 2>&1; then
    echo "======================================================================" >&2
    echo "Error: NS-2 command 'ns' was not found in PATH." >&2
    echo "NS-2.35 requires an Ubuntu/Debian Linux environment." >&2
    echo "To run this in Docker, use: ./run_docker.sh" >&2
    echo "======================================================================" >&2
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: command 'python3' was not found. Install Python 3 and try again." >&2
    exit 1
fi

mkdir -p results

echo "======================================================================"
echo "Phase 1: Running TCP SYN Flood (UDP/CBR Congestion Model) via sim.tcl"
echo "======================================================================"
for mode in baseline attack mitigated; do
    echo ""
    echo ">>> Running sim.tcl ($mode) <<<"
    ns sim.tcl "$mode"
done

echo ""
echo "======================================================================"
echo "Phase 2: Running ARP Spoofing Behavioral Model via sim_arp.tcl"
echo "======================================================================"
for mode in normal spoof static; do
    echo ""
    echo ">>> Running sim_arp.tcl ($mode) <<<"
    ns sim_arp.tcl "$mode"
done

echo ""
echo "======================================================================"
echo "Phase 3: Parsing Raw NS-2 Traces & Verifying Drop Metrics"
echo "======================================================================"
python3 verify_traces.py

echo ""
echo "======================================================================"
echo "Phase 4: Generating Matplotlib Verification Graphs"
echo "======================================================================"
python3 plot.py
python3 plot_arp.py
python3 plot_topology.py

echo ""
echo "======================================================================"
echo "All NS-2 simulations, trace parsing, and graph generations completed!"
echo "Outputs stored in results/ directory."
echo "======================================================================"
