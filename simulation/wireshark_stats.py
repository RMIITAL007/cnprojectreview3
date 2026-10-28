"""Summarize a real, authorized lab PCAP with tshark.

This is supplementary evidence only.  NS-2 .tr files are text traces, not
PCAP files, and must be analyzed by sim.tcl rather than by this script.
"""

import argparse
import csv
import math
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path


def read_pcap_with_tshark(pcap_path):
    """Return selected packet fields from a real PCAP using tshark."""
    tshark_path = shutil.which("tshark")
    if tshark_path is None:
        raise RuntimeError("tshark was not found. Install Wireshark/tshark and try again.")

    # Each output row has timestamp, IPv4 source, IPv6 source, SYN flag, ACK flag.
    command = [
        tshark_path,
        "-n",
        "-r",
        str(pcap_path),
        "-T",
        "fields",
        "-E",
        "separator=,",
        "-E",
        "quote=d",
        "-E",
        "occurrence=f",
        "-e",
        "frame.time_epoch",
        "-e",
        "ip.src",
        "-e",
        "ipv6.src",
        "-e",
        "tcp.flags.syn",
        "-e",
        "tcp.flags.ack",
    ]

    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        error_text = completed.stderr.strip() or "tshark could not read this capture."
        raise RuntimeError(error_text)
    return csv.reader(completed.stdout.splitlines())


def calculate_statistics(rows):
    """Count packets, per-second bins, source IPs, SYNs, and SYN-ACKs."""
    total_packets = 0
    packets_by_second = Counter()
    source_ips = Counter()
    syn_count = 0
    syn_ack_count = 0
    first_second = None

    for row in rows:
        # tshark writes five requested fields. Ignore an unexpected incomplete row.
        if len(row) < 5 or not row[0]:
            continue

        timestamp = float(row[0])
        second = math.floor(timestamp)
        if first_second is None:
            first_second = second

        total_packets += 1
        packets_by_second[second] += 1

        # Use IPv4 when present; otherwise use the IPv6 source. Non-IP packets
        # still count in total_packets but do not have a source IP to list.
        source_ip = row[1] or row[2]
        if source_ip:
            source_ips[source_ip] += 1

        syn_flag = row[3] == "1"
        ack_flag = row[4] == "1"
        if syn_flag and ack_flag:
            syn_ack_count += 1
        elif syn_flag:
            syn_count += 1

    return total_packets, packets_by_second, source_ips, syn_count, syn_ack_count, first_second


def write_packets_per_second_csv(packets_by_second, first_second, output_path):
    """Write every one-second interval, including zero-packet gaps, for plotting."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(["time_s", "packets_per_second"])

        if first_second is None:
            return

        last_second = max(packets_by_second)
        for second in range(first_second, last_second + 1):
            relative_time = second - first_second
            writer.writerow([relative_time, packets_by_second[second]])


def main():
    """Parse command-line input, call tshark, print statistics, and save CSV."""
    parser = argparse.ArgumentParser(
        description="Summarize a real PCAP from an authorized isolated lab."
    )
    parser.add_argument("pcap", type=Path, help="real .pcap or .pcapng capture file")
    parser.add_argument(
        "--output",
        type=Path,
        help="output packets-per-second CSV (default: results/<capture>_packets_per_second.csv)",
    )
    arguments = parser.parse_args()

    if not arguments.pcap.is_file():
        print(f"Error: PCAP file not found: {arguments.pcap}", file=sys.stderr)
        return 1

    if arguments.output is None:
        output_path = Path("results") / f"{arguments.pcap.stem}_packets_per_second.csv"
    else:
        output_path = arguments.output

    try:
        rows = read_pcap_with_tshark(arguments.pcap)
        total, per_second, sources, syns, syn_acks, first_second = calculate_statistics(rows)
        write_packets_per_second_csv(per_second, first_second, output_path)
    except (RuntimeError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Total packets: {total}")
    print("Packets per second:")
    if first_second is None:
        print("  No packets in this capture.")
    else:
        for second in range(first_second, max(per_second) + 1):
            print(f"  {second - first_second} s: {per_second[second]}")
    print(f"Packets per second CSV: {output_path}")
    print(f"TCP SYN packets (without ACK): {syns}")
    print(f"TCP SYN-ACK packets: {syn_acks}")
    print("Top source IPs:")
    if sources:
        for source_ip, count in sources.most_common(10):
            print(f"  {source_ip}: {count}")
    else:
        print("  No IPv4 or IPv6 source addresses were present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
