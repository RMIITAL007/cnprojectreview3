"""Draw a report-ready view of the topology defined in sim.tcl."""
from pathlib import Path
import re

import matplotlib
matplotlib.use("Agg")  # Allow this script to run in Docker/headless environments.
import matplotlib.pyplot as plt


SIM = Path(__file__).with_name("sim.tcl")
OUT = Path(__file__).with_name("results") / "fig_topology.png"


def parse_simulation():
    """Read node variables, duplex-link values, and application timings."""
    text = SIM.read_text()
    nodes = re.findall(r"^\s*set\s+(\w+)\s+\[\$ns node\]", text, re.M)
    links = re.findall(
        r"^\s*\$ns duplex-link\s+\$(\w+)\s+\$(\w+)\s+(\S+)\s+(\S+)", text, re.M
    )
    end = re.search(r"^\s*set\s+simulationEnd\s+([\d.]+)", text, re.M)
    times = {"ftp": ["0.0", end.group(1) if end else "end"], "flood": ["?", "?"]}
    for time, app, action in re.findall(r'\$ns at\s+([\d.]+)\s+"\$(ftp|flood)\s+(start|stop)"', text):
        slot = 0 if action == "start" else 1
        if action == "start" or times[app][slot] == "?":  # Keep the scheduled flood end.
            times[app][slot] = time
    mitigation = re.search(r"\$ns rtmodel-at\s+([\d.]+)\s+down\s+\$attacker\s+\$router", text)
    return nodes, links, times, mitigation.group(1) if mitigation else None


def draw_arrow(ax, start, end, color, label, bend):
    ax.annotate("", end, start, arrowprops={"arrowstyle": "->", "lw": 2.5,
               "color": color, "connectionstyle": f"arc3,rad={bend}"})
    mid = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + bend * 1.5)
    ax.text(*mid, label, color=color, ha="center", va="center", fontsize=9,
            bbox={"facecolor": "white", "edgecolor": color, "alpha": .9, "pad": 2})


def main():
    nodes, links, times, mitigation = parse_simulation()
    required = {"client", "attacker", "router", "server"}
    if not required.issubset(nodes) or len(links) != 3:
        raise ValueError("sim.tcl does not contain the expected four-node, three-link topology")
    pos = {"client": (-1, 1), "attacker": (-1, -1), "router": (0.5, 0), "server": (2.3, 0)}
    colors = {"client": "#2878b5", "attacker": "#d62728", "router": "#777777", "server": "#2ca02c"}
    bottleneck = min(links, key=lambda link: float(re.search(r"[\d.]+", link[2]).group()))
    fig, ax = plt.subplots(figsize=(9, 4.2))
    for left, right, bandwidth, delay in links:
        x1, y1 = pos[left]; x2, y2 = pos[right]
        is_bottleneck = (left, right, bandwidth, delay) == bottleneck
        ax.plot([x1, x2], [y1, y2], color="#555", lw=3 if is_bottleneck else 2, zorder=1)
        label = f"{bandwidth.replace('Mb', ' Mbps')}, {delay}" + ("\n(bottleneck)" if is_bottleneck else "")
        ax.text((x1+x2)/2, (y1+y2)/2 + (0.18 if y1 == y2 else 0), label, ha="center", fontsize=9)
    for node in required:
        ax.scatter(*pos[node], s=1450, color=colors[node], edgecolor="white", linewidth=2, zorder=3)
        ax.text(*pos[node], node.title(), ha="center", va="center", color="white", weight="bold", zorder=4)
    draw_arrow(ax, pos["client"], pos["server"], "#1769aa", f"Flow 1: TCP/FTP ({times['ftp'][0]}-{times['ftp'][1]} s)", -.24)
    flood_label = f"Flow 2: UDP flood ({times['flood'][0]}-{times['flood'][1]} s)"
    if mitigation: flood_label += f"; blocked at {mitigation} s when mitigated"
    draw_arrow(ax, pos["attacker"], pos["server"], "#c62828", flood_label, .24)
    ax.set(xlim=(-1.8, 3.1), ylim=(-1.7, 1.7)); ax.axis("off")
    OUT.parent.mkdir(exist_ok=True); fig.savefig(OUT, dpi=220, bbox_inches="tight"); plt.close(fig)
    print(f"Topology diagram saved to {OUT}")


if __name__ == "__main__":
    main()
