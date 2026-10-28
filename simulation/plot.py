"""Create graphs and a printed summary from NS-2 throughput CSV files."""

from pathlib import Path

import matplotlib

# Use a file-only backend so PNG graphs also work in headless VMs and WSL.
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


# Keep input and output files together with the NS-2 simulation results.
RESULTS_DIR = Path(__file__).resolve().parent / "results"
MODES = ["baseline", "attack", "mitigated"]
REQUIRED_COLUMNS = {"time_s", "throughput_mbps", "flood_mbps"}

# The phase times match the schedule in sim.tcl.
PHASES = {
    "Before attack (0-3 s)": (0.0, 3.0),
    "During attack (3-8 s)": (3.0, 8.0),
    "After attack (8-10 s)": (8.0, 10.0),
}


def load_results():
    """Read and validate one throughput CSV for each simulation mode."""
    data = {}
    for mode in MODES:
        csv_path = RESULTS_DIR / f"{mode}_throughput.csv"
        if not csv_path.exists():
            raise FileNotFoundError(
                f"Missing {csv_path}. Run ./run_all.sh or ns sim.tcl {mode} first."
            )

        frame = pd.read_csv(csv_path)
        missing_columns = REQUIRED_COLUMNS - set(frame.columns)
        if missing_columns:
            missing_text = ", ".join(sorted(missing_columns))
            raise ValueError(f"{csv_path} is missing required columns: {missing_text}")
        data[mode] = frame
    return data


def add_attack_markers(axis):
    """Mark the attack interval and the modeled mitigation time on one graph."""
    axis.axvspan(3.0, 8.0, color="lightcoral", alpha=0.25, label="Attack window")
    axis.axvline(4.0, color="black", linestyle="--", label="Mitigation time")


def plot_legitimate_throughput(data):
    """Plot FTP throughput from all three modes in one comparison figure."""
    figure, axis = plt.subplots(figsize=(10, 5))
    colours = {"baseline": "tab:blue", "attack": "tab:red", "mitigated": "tab:green"}
    # Different line styles keep overlapping scenario results distinguishable.
    styles = {"baseline": ("-", 3.0), "attack": ("-", 2.0), "mitigated": ("--", 2.0)}

    for mode in MODES:
        frame = data[mode]
        axis.plot(
            frame["time_s"],
            frame["throughput_mbps"],
            label=mode.capitalize(),
            color=colours[mode],
            linestyle=styles[mode][0],
            linewidth=styles[mode][1],
        )

    add_attack_markers(axis)
    axis.set_title("Legitimate FTP Throughput at the Server")
    axis.set_xlabel("Time (seconds)")
    axis.set_ylabel("Throughput (Mbps)")
    axis.grid(True, alpha=0.3)
    axis.legend()
    figure.tight_layout()
    figure.savefig(RESULTS_DIR / "fig_legit_throughput.png", dpi=150)
    plt.close(figure)


def plot_flood_throughput(data):
    """Plot only flood traffic that reaches the server in the two flood modes."""
    figure, axis = plt.subplots(figsize=(10, 5))

    for mode, colour in [("attack", "tab:red"), ("mitigated", "tab:green")]:
        frame = data[mode]
        axis.plot(
            frame["time_s"],
            frame["flood_mbps"],
            label=mode.capitalize(),
            color=colour,
        )

    add_attack_markers(axis)
    axis.set_title("Flood Throughput Reaching the Server")
    axis.set_xlabel("Time (seconds)")
    axis.set_ylabel("Flood throughput (Mbps)")
    axis.grid(True, alpha=0.3)
    axis.legend()
    figure.tight_layout()
    figure.savefig(RESULTS_DIR / "fig_flood_throughput.png", dpi=150)
    plt.close(figure)


def calculate_phase_summary(data):
    """Calculate mean legitimate throughput in each requested time phase."""
    rows = []
    for mode in MODES:
        frame = data[mode]
        row = {"Mode": mode.capitalize()}
        for phase_name, (start_time, end_time) in PHASES.items():
            phase_rows = frame[
                (frame["time_s"] >= start_time) & (frame["time_s"] < end_time)
            ]
            row[phase_name] = phase_rows["throughput_mbps"].mean()
        rows.append(row)

    summary = pd.DataFrame(rows)
    baseline_during = summary.loc[
        summary["Mode"] == "Baseline", "During attack (3-8 s)"
    ].iloc[0]

    # A positive percentage means the mode has less FTP throughput than baseline.
    if baseline_during == 0:
        summary["FTP drop vs baseline during attack (%)"] = np.nan
    else:
        summary["FTP drop vs baseline during attack (%)"] = (
            (baseline_during - summary["During attack (3-8 s)"])
            / baseline_during
            * 100.0
        )
    return summary


def plot_phase_bars(summary):
    """Create grouped bars for the three modes in each legitimate-traffic phase."""
    phase_names = list(PHASES.keys())
    positions = np.arange(len(phase_names))
    bar_width = 0.24
    offsets = [-bar_width, 0.0, bar_width]
    colours = ["tab:blue", "tab:red", "tab:green"]

    figure, axis = plt.subplots(figsize=(11, 5))
    for index, mode in enumerate(MODES):
        mode_row = summary[summary["Mode"] == mode.capitalize()].iloc[0]
        values = [mode_row[phase_name] for phase_name in phase_names]
        axis.bar(
            positions + offsets[index],
            values,
            width=bar_width,
            label=mode.capitalize(),
            color=colours[index],
        )

    axis.set_title("Average Legitimate FTP Throughput by Phase")
    axis.set_xlabel("Simulation phase")
    axis.set_ylabel("Average throughput (Mbps)")
    axis.set_xticks(positions)
    axis.set_xticklabels(phase_names)
    axis.set_ylim(0, 2.4)
    axis.grid(True, axis="y", alpha=0.3)
    axis.legend(loc="upper center", ncol=3)
    figure.tight_layout()
    figure.savefig(RESULTS_DIR / "fig_phase_bars.png", dpi=150)
    plt.close(figure)


def main():
    """Load CSVs, create three figures, and print the numerical summary."""
    RESULTS_DIR.mkdir(exist_ok=True)
    data = load_results()
    plot_legitimate_throughput(data)
    plot_flood_throughput(data)
    summary = calculate_phase_summary(data)
    plot_phase_bars(summary)

    print("\nAverage legitimate FTP throughput (Mbps):")
    print(summary.to_string(index=False, float_format=lambda value: f"{value:.6f}"))
    print("\nSaved graphs in results/")


if __name__ == "__main__":
    main()
