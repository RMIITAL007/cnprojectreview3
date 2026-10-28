# MAC Address Table Flooding: Theory and Project Limitation

## What happens on a real switch

An Ethernet switch keeps a MAC address table, also called a CAM table. It learns
the source MAC address and incoming port for each received frame. When the
destination MAC is known, the switch forwards the frame only to that port.

In a MAC address table flooding attack, a large number of frames with different,
usually fake, source MAC addresses are sent to a switch. If the CAM table becomes
full, the switch can no longer learn new MAC-to-port mappings. Traffic for an
unknown destination MAC may then be flooded out of multiple ports, except the
incoming port. This is often called "fail-open to broadcast," but it is more
accurately unknown-unicast flooding. It can expose traffic to hosts that would
normally not receive it and can reduce switch performance.

## Why it is not simulated here

NS-2.35 in this project uses nodes and point-to-point links. It does not provide
a Layer 2 switch with a finite CAM table, source-MAC learning, ageing entries, or
unknown-unicast flooding. An NS-2 trace therefore cannot truthfully measure CAM
overflow. MAC flooding is documented as a limitation rather than simulated.

## Real-switch mitigation: port security

On a real managed switch, port security limits the number of MAC addresses on an
access port. Sticky MAC learning can learn the first approved MAC address and
keep it as the expected address. If too many new addresses appear, the switch can
restrict traffic, log the violation, or shut the port down. These are real-switch
controls, not NS-2 Tcl commands, so they are documented instead of simulated.
