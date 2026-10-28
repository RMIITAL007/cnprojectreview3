#!/usr/bin/env python3
"""Rate-limited TCP SYN traffic demonstration for an authorized lab server."""

import argparse
import random

from scapy.all import Ether, IP, TCP, get_if_addr, get_if_hwaddr, sendp  # type: ignore

from common import (
    abort, add_lab_arguments, log, require_capture_privileges, run_plan,
    validate_common, validate_lab_ip, validate_mac,
)


def make_syn(source_ip: str, source_mac: str, server_ip: str, next_hop_mac: str, destination_port: int, source_port: int):
    """Build one ordinary TCP SYN packet sent through the configured lab next hop."""
    return Ether(src=source_mac, dst=next_hop_mac) / IP(src=source_ip, dst=server_ip) / TCP(
        sport=source_port, dport=destination_port, flags="S", seq=random.randint(0, 0xFFFFFFFF)
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Bounded TCP SYN traffic demonstration for an isolated private LAN.")
    add_lab_arguments(parser, needs_port=True)
    parser.add_argument("--server-ip", required=True, help="Designated private lab server IPv4 address.")
    parser.add_argument("--source-ip", required=True, help="IPv4 address actually configured on the selected attacker lab interface.")
    parser.add_argument("--next-hop-mac", required=True, help="Unicast MAC of the local router gateway, or the server MAC for a same-subnet server.")
    parser.add_argument("--source-port-start", type=int, default=40000, help="First source port, 1024-65535 (default: 40000).")
    args = parser.parse_args()
    network = None
    try:
        network = validate_common(args)
        args.server_ip = validate_lab_ip(args.server_ip, network, "server IP")
        args.source_ip = validate_lab_ip(args.source_ip, network, "source IP")
        args.next_hop_mac = validate_mac(args.next_hop_mac, "next-hop MAC")
        if args.source_ip == args.server_ip:
            raise ValueError("source IP and server IP must be different.")
        interface_ip = get_if_addr(args.interface)
        if interface_ip != args.source_ip:
            raise ValueError(f"--source-ip must equal the selected interface address ({interface_ip}).")
        if not 1024 <= args.source_port_start <= 65535:
            raise ValueError("--source-port-start must be between 1024 and 65535.")
    except ValueError as exc:
        abort(str(exc))

    log("TCP SYN demonstration: rate-limited SYN packets will be sent only to the designated lab server.")
    log(f"Lab: {network}; interface: {args.interface}; source: {args.source_ip}; server: {args.server_ip}:{args.destination_port}")
    log(f"Plan: {args.count} SYN packets at {args.interval:.2f}s intervals (maximum {args.max_duration:.2f}s).")
    if not args.send:
        log("Dry run complete. Add --send only after confirming the server is an authorized lab host.")
        return
    try:
        require_capture_privileges()
    except PermissionError as exc:
        abort(str(exc))

    next_port = args.source_port_start

    def send_one() -> None:
        nonlocal next_port
        sendp(make_syn(args.source_ip, get_if_hwaddr(args.interface), args.server_ip, args.next_hop_mac,
                       args.destination_port, next_port), iface=args.interface, verbose=False)
        next_port = 1024 if next_port >= 65535 else next_port + 1

    sent, elapsed, _ = run_plan(send_one, count=args.count, interval=args.interval, max_duration=args.max_duration)
    log(f"Stopped after {sent} TCP SYN packets in {elapsed:.2f}s.")


if __name__ == "__main__":
    main()
