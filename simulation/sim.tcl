# DoS attack and mitigation experiment for NS-2.35.
# Run with: ns sim.tcl baseline|attack|mitigated

# Check the single command-line argument before creating any simulation files.
if {$argc != 1} {
    puts "Usage: ns sim.tcl <baseline|attack|mitigated>"
    exit 1
}

set mode [lindex $argv 0]
if {$mode != "baseline" && $mode != "attack" && $mode != "mitigated"} {
    puts "Error: mode must be baseline, attack, or mitigated"
    puts "Usage: ns sim.tcl <baseline|attack|mitigated>"
    exit 1
}

# These constants make the measurement intervals easy to see and change.
set simulationEnd 10.0
set binWidth 0.5

# Create the output directory if it does not already exist.
file mkdir results

# Create the NS-2 simulator and open one text trace and one NAM trace.
set ns [new Simulator]
set traceFile [open "results/$mode.tr" w]
set namFile [open "results/$mode.nam" w]
$ns trace-all $traceFile
$ns namtrace-all $namFile

# Give the two data flows distinct NAM colours: FTP is blue and flood is red.
$ns color 1 Blue
$ns color 2 Red

# Create the four hosts used in the enterprise-network model.
set client   [$ns node]
set router   [$ns node]
set server   [$ns node]
set attacker [$ns node]

# Save the numeric server ID.  The trace records node IDs, not Tcl node names.
set serverId [$server id]

# Create the three required duplex links.  The router-to-server link is the
# 2 Mbps bottleneck shared by legitimate and attack traffic.
$ns duplex-link $client   $router 10Mb 5ms DropTail
$ns duplex-link $attacker $router 10Mb 5ms DropTail
$ns duplex-link $router   $server 2Mb  10ms DropTail

# These orientations only make the optional NAM animation easier to read.
$ns duplex-link-op $client   $router   orient right-down
$ns duplex-link-op $attacker $router   orient right-up
$ns duplex-link-op $router   $server   orient right

# Flow 1: a long-lived TCP FTP transfer from the client to the server.
set tcp [new Agent/TCP]
$tcp set fid_ 1
$tcp set packetSize_ 1000
set tcpSink [new Agent/TCPSink]
$ns attach-agent $client $tcp
$ns attach-agent $server $tcpSink
$ns connect $tcp $tcpSink

set ftp [new Application/FTP]
$ftp attach-agent $tcp

# Flow 2: a small-packet UDP CBR flood.  This approximates the load caused by
# a SYN flood; it is not a real TCP SYN flood because NS-2 CBR sends UDP data.
set udp [new Agent/UDP]
$udp set fid_ 2
set nullSink [new Agent/Null]
$ns attach-agent $attacker $udp
$ns attach-agent $server $nullSink
$ns connect $udp $nullSink

set flood [new Application/Traffic/CBR]
$flood attach-agent $udp
$flood set packetSize_ 40
$flood set rate_ 5Mb
$flood set random_ false

# The legitimate FTP application spans the full measured 0--10 second period.
$ns at 0.0 "$ftp start"
$ns at $simulationEnd "$ftp stop"

# Only the attack and mitigated modes schedule the UDP flood from 3 to 8 s.
if {$mode == "attack" || $mode == "mitigated"} {
    $ns at 3.0 "$flood start"
    $ns at 8.0 "$flood stop"
}

# In mitigated mode, this route-model event cuts the attacker link at 4 s.
# It models an ACL block; a real ACL drops selected packets without a link down.
if {$mode == "mitigated"} {
    # Modeled ACL block: cut the attacker's link at 4 s (a simplification).
    $ns rtmodel-at 4.0 down $attacker $router
}

# Stop generating flood packets when the modeled ACL block is applied.
if {$mode == "mitigated"} {
    $ns at 4.0 "$flood stop"
}

# Return the value immediately after a named field in an NS-2 new-format trace.
proc traceValue {fields fieldName} {
    set position [lsearch -exact $fields $fieldName]
    if {$position < 0 || $position >= [expr {[llength $fields] - 1}]} {
        return ""
    }
    return [lindex $fields [expr {$position + 1}]]
}

# Average one column of already-calculated throughput values over a time phase.
proc phaseAverage {values startTime endTime binWidth} {
    set total 0.0
    set count 0
    foreach value $values {
        set binStart [expr {$count * $binWidth}]
        if {$binStart >= $startTime && $binStart < $endTime} {
            set total [expr {$total + $value}]
        }
        incr count
    }
    if {$count == 0} {
        return 0.0
    }
    # Each phase uses complete, equal-width bins, so their mean is its average.
    set phaseBins [expr {int(($endTime - $startTime) / $binWidth)}]
    return [expr {$total / $phaseBins}]
}

# Read the completed trace and calculate received goodput for both flow IDs.
proc analyze {} {
    global mode simulationEnd binWidth serverId

    set numberOfBins [expr {int($simulationEnd / $binWidth)}]
    for {set i 0} {$i < $numberOfBins} {incr i} {
        set legitBytes($i) 0
        set floodBytes($i) 0
    }

    # Count only packets received at the server, avoiding router events.  NS-2.35
    # wired simulations normally use its compact (old) trace format.  The second
    # branch also accepts tagged/new-format traces if a local NS-2 build enables it.
    set input [open "results/$mode.tr" r]
    while {[gets $input line] >= 0} {
        set fields [split $line]
        if {[lindex $fields 0] != "r"} {
            continue
        }

        if {[lsearch -exact $fields "-t"] >= 0} {
            # Tagged/new format: check an AGT-level receive at the server.
            if {[traceValue $fields "-Nl"] != "AGT" || [traceValue $fields "-Hd"] != $serverId} {
                continue
            }
            set flowId [traceValue $fields "-If"]
            set packetBytes [traceValue $fields "-Il"]
            set packetTime [traceValue $fields "-t"]
        } else {
            # Compact/old format: columns are event, time, from, to, type,
            # size, flags, flow ID, source, destination, sequence, packet ID.
            if {[lindex $fields 3] != $serverId} {
                continue
            }
            set packetTime [lindex $fields 1]
            set packetBytes [lindex $fields 5]
            set flowId [lindex $fields 7]
        }
        if {$packetBytes == "" || $packetTime == "" || $packetTime < 0.0 || $packetTime >= $simulationEnd} {
            continue
        }

        set bin [expr {int($packetTime / $binWidth)}]
        if {$flowId == 1} {
            set legitBytes($bin) [expr {$legitBytes($bin) + $packetBytes}]
        } elseif {$flowId == 2} {
            set floodBytes($bin) [expr {$floodBytes($bin) + $packetBytes}]
        }
    }
    close $input

    # Write each 0.5-second bin as Mbps: bytes * 8 / seconds / 1,000,000.
    set output [open "results/${mode}_throughput.csv" w]
    puts $output "time_s,throughput_mbps,flood_mbps"
    set legitThroughputs {}
    for {set i 0} {$i < $numberOfBins} {incr i} {
        set time [expr {$i * $binWidth}]
        set legitMbps [expr {$legitBytes($i) * 8.0 / $binWidth / 1000000.0}]
        set floodMbps [expr {$floodBytes($i) * 8.0 / $binWidth / 1000000.0}]
        puts $output [format "%.1f,%.6f,%.6f" $time $legitMbps $floodMbps]
        lappend legitThroughputs $legitMbps
    }
    close $output

    # Print the three legitimate-traffic phase averages for run_all.sh and viva.
    set before [phaseAverage $legitThroughputs 0.0 3.0 $binWidth]
    set during [phaseAverage $legitThroughputs 3.0 8.0 $binWidth]
    set after  [phaseAverage $legitThroughputs 8.0 10.0 $binWidth]
    puts [format "%s - average legitimate throughput before attack (0-3 s): %.6f Mbps" $mode $before]
    puts [format "%s - average legitimate throughput during attack (3-8 s): %.6f Mbps" $mode $during]
    puts [format "%s - average legitimate throughput after attack (8-10 s): %.6f Mbps" $mode $after]
}

# Flush and close trace files first, then analyze the finished trace.  NAM is
# deliberately not launched automatically so batch runs do not open a window.
proc finish {} {
    global ns traceFile namFile
    $ns flush-trace
    close $traceFile
    close $namFile
    analyze
    exit 0
}

# End shortly after traffic stops so all events up to exactly 10 s are processed.
$ns at 10.01 "finish"
$ns run
