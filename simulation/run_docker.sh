#!/usr/bin/env bash
# Build and run NS-2 simulations inside an isolated Ubuntu 20.04 Docker container.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
    echo "======================================================================" >&2
    echo "ERROR: 'docker' command was not found on this system." >&2
    echo "Host OS: $(uname -s) $(uname -m)" >&2
    echo "To run this containerized simulation workflow:" >&2
    echo "  1. Install Docker Desktop for macOS (or Docker Engine on Linux)." >&2
    echo "  2. Ensure the Docker daemon is running." >&2
    echo "  3. Re-run this script: ./run_docker.sh" >&2
    echo "" >&2
    echo "Alternatively, execute natively on any Ubuntu 20.04 LTS host/VM:" >&2
    echo "  sudo apt update && sudo apt install -y ns2 nam python3-pandas python3-matplotlib" >&2
    echo "  ./run_all.sh" >&2
    echo "======================================================================" >&2
    exit 1
fi

echo "======================================================================"
echo "Step 1: Building reproducible NS-2.35 container (Ubuntu 20.04)..."
echo "======================================================================"
docker build -t ns2-enterprise-lab:20.04 .

echo ""
echo "======================================================================"
echo "Step 2: Executing simulations & trace verification inside container..."
echo "======================================================================"
docker run --rm \
    -v "$(pwd)/results":/workspace/simulation/results \
    ns2-enterprise-lab:20.04

echo ""
echo "======================================================================"
echo "SUCCESS: Trace files and verification graphs generated in results/."
echo "======================================================================"
