"""Shared validation and output helpers for the isolated LAN demonstrations."""

from __future__ import annotations

import ipaddress
import os
import sys
import time
from datetime import datetime

from typing import NoReturn

from scapy.all import get_if_list  # type: ignore


MAX_PACKETS = 200
MAX_DURATION_SECONDS = 60.0
MAX_INTERVAL_SECONDS = 5.0


def add_lab_arguments(parser, *, needs_port: bool = False) -> None:
    """Add the common, deliberately explicit lab configuration arguments."""
    parser.add_argument("--interface", required=True, help="Lab NIC used to send frames (for example en0 or eth0)")
    parser.add_argument("--lab-cidr", required=True, help="Private CIDR that contains every IP used, for example 192.168.56.0/24")
    parser.add_argument("--count", type=int, default=10, help="Packets or frames to send (1-200; default: 10)")
    parser.add_argument("--interval", type=float, default=0.5, help="Seconds between sends (0.01-5; default: 0.5)")
    parser.add_argument("--max-duration", type=float, default=15.0, help="Safety limit in seconds (0.01-60; default: 15)")
    parser.add_argument("--send", action="store_true", help="Actually transmit. Without this flag the script validates and shows its plan only.")
    if needs_port:
        parser.add_argument("--destination-port", required=True, type=int, help="Lab server TCP port (1-65535)")


def log(message: str) -> None:
    """Print a timestamped message suitable for screenshots and lab records."""
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] {message}")


def parse_lab_network(cidr: str) -> ipaddress.IPv4Network:
    """Return a private IPv4 network, rejecting public and IPv6 ranges."""
    try:
        network = ipaddress.ip_network(cidr, strict=False)
    except ValueError as exc:
        raise ValueError(f"Invalid lab CIDR: {cidr}") from exc
    if network.version != 4 or not network.is_private:
        raise ValueError("--lab-cidr must be a private IPv4 network.")
    return network


def validate_lab_ip(value: str, network: ipaddress.IPv4Network, label: str) -> str:
    """Ensure an IPv4 host address is private and belongs to the declared lab."""
    try:
        address = ipaddress.ip_address(value)
    except ValueError as exc:
        raise ValueError(f"{label} is not a valid IPv4 address: {value}") from exc
    if address.version != 4 or not address.is_private or address not in network:
        raise ValueError(f"{label} must be a private IPv4 address inside {network}.")
    if address in (network.network_address, network.broadcast_address):
        raise ValueError(f"{label} must be a host address, not the network or broadcast address.")
    return str(address)


def validate_mac(value: str, label: str, *, allow_broadcast: bool = False) -> str:
    """Validate a colon-separated MAC and reject multicast target addresses."""
    value = value.lower()
    parts = value.split(":")
    try:
        valid = len(parts) == 6 and all(len(part) == 2 and 0 <= int(part, 16) <= 255 for part in parts)
    except ValueError:
        valid = False
    if not valid:
        raise ValueError(f"{label} must be a MAC such as 02:00:00:00:00:10.")
    if value == "ff:ff:ff:ff:ff:ff" and allow_broadcast:
        return value
    if value == "ff:ff:ff:ff:ff:ff" or int(parts[0], 16) & 1:
        raise ValueError(f"{label} must be a unicast MAC address.")
    return value


def validate_interface(name: str) -> str:
    """Require an existing non-loopback interface; it remains the student's responsibility to select the lab NIC."""
    interfaces = get_if_list()
    if name not in interfaces:
        raise ValueError(f"Interface {name!r} was not found. Available interfaces: {', '.join(interfaces)}")
    if name.lower() in {"lo", "lo0", "loopback"}:
        raise ValueError("A loopback interface cannot be used as a lab Ethernet interface.")
    return name


def validate_bounds(count: int, interval: float, max_duration: float) -> tuple[int, float, float]:
    """Enforce small fixed limits and ensure the plan ends before its time limit."""
    if not 1 <= count <= MAX_PACKETS:
        raise ValueError(f"--count must be between 1 and {MAX_PACKETS}.")
    if not 0.01 <= interval <= MAX_INTERVAL_SECONDS:
        raise ValueError(f"--interval must be between 0.01 and {MAX_INTERVAL_SECONDS} seconds.")
    if not 0.01 <= max_duration <= MAX_DURATION_SECONDS:
        raise ValueError(f"--max-duration must be between 0.01 and {MAX_DURATION_SECONDS} seconds.")
    planned_duration = count * interval
    if planned_duration > max_duration:
        raise ValueError("count × interval exceeds --max-duration; reduce count/interval or increase the limit.")
    return count, interval, max_duration


def validate_port(port: int) -> int:
    if not 1 <= port <= 65535:
        raise ValueError("--destination-port must be between 1 and 65535.")
    return port


def validate_common(args) -> ipaddress.IPv4Network:
    """Validate settings shared by all three programs and return the lab subnet."""
    network = parse_lab_network(args.lab_cidr)
    args.interface = validate_interface(args.interface)
    args.count, args.interval, args.max_duration = validate_bounds(args.count, args.interval, args.max_duration)
    if hasattr(args, "destination_port"):
        args.destination_port = validate_port(args.destination_port)
    return network


def require_capture_privileges() -> None:
    """Stop before transmission when raw-packet privileges are unavailable."""
    if os.name == "nt":
        # Npcap plus an elevated Command Prompt is required on Windows.
        return
    if os.geteuid() != 0:
        raise PermissionError("Raw packet transmission requires root privileges. Re-run with sudo in this lab only.")


def run_plan(send_one, *, count: int, interval: float, max_duration: float) -> tuple[int, float, bool]:
    """Call send_one at a fixed rate until count, the time limit, or Ctrl+C."""
    started = time.monotonic()
    sent = 0
    interrupted = False
    try:
        for _ in range(count):
            if time.monotonic() - started >= max_duration:
                log("Safety time limit reached; stopping transmission.")
                break
            send_one()
            sent += 1
            if sent < count:
                time.sleep(interval)
    except KeyboardInterrupt:
        interrupted = True
        log("Ctrl+C received; stopping safely.")
    return sent, time.monotonic() - started, interrupted


def abort(message: str) -> NoReturn:
    """Show a uniform validation error and exit without sending traffic."""
    log(f"Configuration error: {message}")
    sys.exit(2)
