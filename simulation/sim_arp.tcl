# ARP-spoofing behavioural model for NS-2.35.
# Run with: ns sim_arp.tcl normal|spoof|static
#
# NS-2 has no ARP protocol or ARP cache.  Therefore, this script models the
# *effect* of ARP spoofing: from 3 s, traffic that should stay on the normal
# client-to-router path is represented by a flow delivered to the attacker.
# In static mode, the static-ARP correction stops that delivery at 5 s.

if {$argc != 1} {
    puts "Usage: ns sim_arp.tcl <normal|spoof|static>"
    exit 1
}

set mode [lindex $argv 0]
if {$mode != "normal" && $mode != "spoof" && $mode != "static"} {
    puts "Error: mode must be normal, spoof, or static"
    exit 1
}

set simulationEnd 10.0
set binWidth 0.5
file mkdir results

set ns [new Simulator]
set traceFile [open "results/arp_${mode}.tr" w]
set namFile [open "results/arp_${mode}.nam" w]
$ns trace-all $traceFile
$ns namtrace-all $namFile

# Nodes are intentionally named like an enterprise LAN: client, gateway/router,
# server, and attacker.
set client   [$ns node]
set router   [$ns node]
set server   [$ns node]
set attacker [$ns node]
set attackerId [$attacker id]

$ns duplex-link $client $router 10Mb 5ms DropTail
$ns duplex-link $router $server 10Mb 5ms DropTail
$ns duplex-link $client $attacker 10Mb 5ms DropTail
$ns duplex-link-op $client $router orient right
$ns duplex-link-op $router $server orient right
$ns duplex-link-op $client $attacker orient right-down

# Normal user traffic continues to the server throughout every scenario.
set tcp [new Agent/TCP]
$tcp set fid_ 1
$tcp set packetSize_ 1000
set tcpSink [new Agent/TCPSink]
$ns attach-agent $client $tcp
$ns attach-agent $server $tcpSink
$ns connect $tcp $tcpSink
set ftp [new Application/FTP]
$ftp attach-agent $tcp

# This UDP flow is not an attack packet generator.  It is a small, measurable
# representation of packets redirected to the attacker by a poisoned ARP entry.
set divertedUdp [new Agent/UDP]
$divertedUdp set fid_ 2
set attackerSink [new Agent/Null]
$ns attach-agent $client $divertedUdp
$ns attach-agent $attacker $attackerSink
$ns connect $divertedUdp $attackerSink
set divertedTraffic [new Application/Traffic/CBR]
$divertedTraffic attach-agent $divertedUdp
$divertedTraffic set packetSize_ 1000
$divertedTraffic set rate_ 1Mb
$divertedTraffic set random_ false

$ns at 0.0 "$ftp start"
$ns at $simulationEnd "$ftp stop"

# At 3 s ARP spoofing begins.  In static mode the corrected static ARP entry
# takes effect at 5 s, so packets stop reaching the attacker.
if {$mode == "spoof" || $mode == "static"} {
    $ns at 3.0 "$divertedTraffic start"
}
if {$mode == "spoof"} {
    $ns at $simulationEnd "$divertedTraffic stop"
}
if {$mode == "static"} {
    $ns at 5.0 "$divertedTraffic stop"
}

proc traceValue {fields fieldName} {
    set position [lsearch -exact $fields $fieldName]
    if {$position < 0 || $position >= [expr {[llength $fields] - 1}]} {
        return ""
    }
    return [lindex $fields [expr {$position + 1}]]
}

# Count only flow 2 packets received by the attacker, never router/link events.
proc analyze {} {
    global mode simulationEnd binWidth attackerId

    set numberOfBins [expr {int($simulationEnd / $binWidth)}]
    for {set i 0} {$i < $numberOfBins} {incr i} {
        set interceptedBytes($i) 0
    }

    set input [open "results/arp_${mode}.tr" r]
    while {[gets $input line] >= 0} {
        set fields [split $line]
        if {[lindex $fields 0] != "r"} {
            continue
        }
        if {[lsearch -exact $fields "-t"] >= 0} {
            if {[traceValue $fields "-Nl"] != "AGT" || [traceValue $fields "-Hd"] != $attackerId} {
                continue
            }
            set packetTime [traceValue $fields "-t"]
            set packetBytes [traceValue $fields "-Il"]
            set flowId [traceValue $fields "-If"]
        } else {
            if {[lindex $fields 3] != $attackerId} {
                continue
            }
            set packetTime [lindex $fields 1]
            set packetBytes [lindex $fields 5]
            set flowId [lindex $fields 7]
        }
        if {$flowId != 2 || $packetTime < 0.0 || $packetTime >= $simulationEnd} {
            continue
        }
        set bin [expr {int($packetTime / $binWidth)}]
        set interceptedBytes($bin) [expr {$interceptedBytes($bin) + $packetBytes}]
    }
    close $input

    set output [open "results/arp_${mode}_throughput.csv" w]
    puts $output "time_s,intercepted_mbps"
    set totalMegabits 0.0
    for {set i 0} {$i < $numberOfBins} {incr i} {
        set time [expr {$i * $binWidth}]
        set mbps [expr {$interceptedBytes($i) * 8.0 / $binWidth / 1000000.0}]
        puts $output [format "%.1f,%.6f" $time $mbps]
        set totalMegabits [expr {$totalMegabits + $interceptedBytes($i) * 8.0 / 1000000.0}]
    }
    close $output
    puts [format "%s - total intercepted data: %.6f Mbits" $mode $totalMegabits]
}

proc finish {} {
    global ns traceFile namFile
    $ns flush-trace
    close $traceFile
    close $namFile
    analyze
    exit 0
}

$ns at 10.01 "finish"
$ns run
