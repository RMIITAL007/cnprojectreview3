#!/usr/bin/env python3
"""Small MAC address table learning pressure demonstration for an authorized lab."""

import argparse
import random

from scapy.all import Ether, Raw, sendp  # type: ignore

from common import (
    abort, add_lab_arguments, log, require_capture_privileges, run_plan,
    validate_common, validate_mac,
)


def random_lab_mac() -> str:
    """Return a locally administered unicast MAC so no vendor MAC is impersonated."""
    octets = [0x02] + [random.randint(0, 255) for _ in range(5)]
    return ":".join(f"{octet:02x}" for octet in octets)


def make_frame(destination_mac: str) -> Ether:
    """Create one Ethernet frame with a fresh synthetic source MAC address."""
    return Ether(src=random_lab_mac(), dst=destination_mac, type=0x88B5) / Raw(load=b"LAB-MAC-TABLE-DEMO")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bounded MAC table flooding demonstration for an isolated private LAN.")
    add_lab_arguments(parser)
    parser.add_argument("--destination-mac", required=True, help="Explicit frame destination; ff:ff:ff:ff:ff:ff is allowed for this demo.")
    args = parser.parse_args()
    network = None
    try:
        network = validate_common(args)
        args.destination_mac = validate_mac(args.destination_mac, "destination MAC", allow_broadcast=True)
    except ValueError as exc:
        abort(str(exc))

    log("MAC-table demonstration: each frame has a new locally administered source MAC address.")
    log(f"Declared lab: {network}; interface: {args.interface}; destination MAC: {args.destination_mac}")
    log(f"Plan: {args.count} frames at {args.interval:.2f}s intervals (maximum {args.max_duration:.2f}s).")
    if not args.send:
        log("Dry run complete. Add --send only after confirming this interface reaches the isolated lab switch.")
        return
    try:
        require_capture_privileges()
    except PermissionError as exc:
        abort(str(exc))

    sent, elapsed, _ = run_plan(
        lambda: sendp(make_frame(args.destination_mac), iface=args.interface, verbose=False),
        count=args.count, interval=args.interval, max_duration=args.max_duration,
    )
    log(f"Stopped after {sent} Ethernet frames in {elapsed:.2f}s.")


if __name__ == "__main__":
    main()
