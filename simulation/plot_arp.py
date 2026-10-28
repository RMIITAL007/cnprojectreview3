"""Plot intercepted traffic measured by the NS-2 ARP behavioural model."""

from pathlib import Path

import matplotlib

# Write a PNG without requiring a graphical desktop in the VM.
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd


RESULTS_DIR = Path(__file__).resolve().parent / "results"
MODES = ["normal", "spoof", "static"]
COLOURS = {"normal": "tab:blue", "spoof": "tab:red", "static": "tab:green"}


def load_results():
    """Load each CSV and give a clear instruction when one is missing."""
    data = {}
    for mode in MODES:
        path = RESULTS_DIR / f"arp_{mode}_throughput.csv"
        if not path.exists():
            raise FileNotFoundError(f"Missing {path}. Run: ns sim_arp.tcl {mode}")
        frame = pd.read_csv(path)
        if set(frame.columns) != {"time_s", "intercepted_mbps"}:
            raise ValueError(f"{path} must contain time_s and intercepted_mbps columns")
        data[mode] = frame
    return data


def main():
    data = load_results()
    figure, axis = plt.subplots(figsize=(10, 5))

    for mode in MODES:
        frame = data[mode]
        axis.plot(
            frame["time_s"],
            frame["intercepted_mbps"],
            label=mode.capitalize(),
            color=COLOURS[mode],
            linewidth=2,
        )

    # These markers match the scheduled spoofing and static-ARP repair times.
    axis.axvline(3.0, color="black", linestyle="--", label="Spoof begins")
    axis.axvline(5.0, color="black", linestyle=":", label="Static ARP applied")
    axis.set_title("Traffic Intercepted by Attacker: ARP Spoofing Behavioural Model")
    axis.set_xlabel("Time (seconds)")
    axis.set_ylabel("Intercepted throughput (Mbps)")
    axis.set_ylim(bottom=0)
    axis.grid(True, alpha=0.3)
    axis.legend()
    figure.tight_layout()

    output_path = RESULTS_DIR / "fig_arp_intercepted_throughput.png"
    figure.savefig(output_path, dpi=150)
    print("\nAverage intercepted throughput (Mbps):")
    for mode in MODES:
        average = data[mode]["intercepted_mbps"].mean()
        print(f"{mode.capitalize():<6} {average:.6f}")
    print(f"\nSaved graph in {output_path}")


if __name__ == "__main__":
    main()
