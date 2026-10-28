import React, { useState } from 'react';
import { NetworkDevice, NetworkLink, SimulationMode } from '../types';
import { networkDevices, networkLinks } from '../data/simulationData';
import { X, Wifi, Server, Monitor, Globe, Router, AlertTriangle, Eye } from 'lucide-react';

interface TopologyMapProps {
  mode?: SimulationMode;
  attackType?: 'syn-flood' | 'arp-spoof' | 'mac-flood' | 'none';
  compact?: boolean;
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'internet': return Globe;
    case 'router': return Router;
    case 'switch': return Wifi;
    case 'pc': return Monitor;
    case 'attacker': return AlertTriangle;
    case 'server': return Server;
    case 'monitor': return Eye;
    default: return Monitor;
  }
}

function getDeviceColor(device: NetworkDevice, attackType: string, mode: SimulationMode) {
  if (device.type === 'attacker') {
    return mode === 'attack' ? '#ef4444' : '#6b7280';
  }
  if (device.type === 'server' && mode === 'attack' && attackType === 'syn-flood') {
    return '#f59e0b';
  }
  if (device.type === 'monitor') return '#8b5cf6';
  if (mode === 'mitigation') return '#10b981';
  return '#00b4d8';
}

function getLinkStyle(link: NetworkLink, attackType: string, mode: SimulationMode) {
  if (mode === 'baseline' || attackType === 'none') {
    return { stroke: '#00b4d8', opacity: 0.4, animated: true, className: 'packet-flow-normal' };
  }

  if (mode === 'attack') {
    // SYN Flood: attacker → switch → server path is attack
    if (attackType === 'syn-flood') {
      if ((link.from === 'attacker' && link.to === 'switch') || (link.from === 'switch' && link.to === 'server')) {
        return { stroke: '#ef4444', opacity: 0.8, animated: true, className: 'packet-flow-attack' };
      }
    }
    // ARP Spoof: traffic redirected through attacker
    if (attackType === 'arp-spoof') {
      if (link.from === 'switch' && link.to === 'attacker') {
        return { stroke: '#f59e0b', opacity: 0.8, animated: true, className: 'packet-flow-attack' };
      }
    }
    // MAC Flood: attacker flooding the switch
    if (attackType === 'mac-flood') {
      if (link.from === 'switch' && link.to === 'attacker') {
        return { stroke: '#ef4444', opacity: 0.8, animated: true, className: 'packet-flow-attack' };
      }
    }
    return { stroke: '#00b4d8', opacity: 0.25, animated: true, className: 'packet-flow-normal' };
  }

  if (mode === 'mitigation') {
    if (link.from === 'switch' && link.to === 'attacker') {
      return { stroke: '#ef4444', opacity: 0.15, animated: false, className: 'packet-flow-blocked' };
    }
    if (link.from === 'attacker') {
      return { stroke: '#ef4444', opacity: 0.15, animated: false, className: 'packet-flow-blocked' };
    }
    return { stroke: '#10b981', opacity: 0.5, animated: true, className: 'packet-flow-mitigation' };
  }

  return { stroke: '#00b4d8', opacity: 0.3, animated: true, className: 'packet-flow-normal' };
}

export default function TopologyMap({ mode = 'baseline', attackType = 'none', compact = false }: TopologyMapProps) {
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);

  const viewBox = compact ? '50 0 700 480' : '0 0 800 500';
  const width = compact ? '100%' : '100%';

  const devicePositions = networkDevices.reduce((acc, d) => {
    acc[d.id] = { x: d.x, y: d.y };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  return (
    <div className="relative">
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ maxHeight: compact ? '300px' : '500px' }}
      >
        <defs>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Links */}
        {networkLinks.map((link) => {
          const from = devicePositions[link.from];
          const to = devicePositions[link.to];
          if (!from || !to) return null;
          const style = getLinkStyle(link, attackType, mode);

          return (
            <g key={link.id}>
              {/* Background line */}
              <line
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={style.stroke}
                strokeWidth={1.5}
                opacity={style.opacity * 0.3}
              />
              {/* Animated flow line */}
              <line
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={style.stroke}
                strokeWidth={2}
                opacity={style.opacity}
                className={style.animated ? style.className : ''}
                strokeDasharray={style.animated ? undefined : '4,8'}
              />
            </g>
          );
        })}

        {/* ARP Spoof extra path: PC1 → Switch → Attacker → (back to) Server */}
        {mode === 'attack' && attackType === 'arp-spoof' && (
          <>
            <line
              x1={devicePositions.pc1.x} y1={devicePositions.pc1.y}
              x2={devicePositions.switch.x} y2={devicePositions.switch.y}
              stroke="#f59e0b" strokeWidth={2.5} opacity={0.7}
              className="packet-flow-attack"
            />
            <line
              x1={devicePositions.switch.x} y1={devicePositions.switch.y}
              x2={devicePositions.attacker.x} y2={devicePositions.attacker.y}
              stroke="#ef4444" strokeWidth={2.5} opacity={0.8}
              className="packet-flow-attack"
            />
            <line
              x1={devicePositions.attacker.x} y1={devicePositions.attacker.y}
              x2={devicePositions.server.x} y2={devicePositions.server.y}
              stroke="#f59e0b" strokeWidth={2} opacity={0.6}
              strokeDasharray="6,4"
              className="packet-flow-attack"
            />
          </>
        )}

        {/* Devices */}
        {networkDevices.map((device) => {
          const color = getDeviceColor(device, attackType, mode);
          const Icon = getDeviceIcon(device.type);
          const isSelected = selectedDevice?.id === device.id;

          return (
            <g
              key={device.id}
              className="topo-node"
              onClick={() => setSelectedDevice(isSelected ? null : device)}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={device.x} cy={device.y} r={28}
                  fill="none" stroke={color} strokeWidth={1.5}
                  opacity={0.5} strokeDasharray="4,4"
                />
              )}
              {/* Outer glow */}
              <circle
                cx={device.x} cy={device.y} r={22}
                fill={color} opacity={0.08}
              />
              {/* Device circle */}
              <circle
                cx={device.x} cy={device.y} r={18}
                fill="#0f1528" stroke={color} strokeWidth={1.5}
                opacity={0.95}
              />
              {/* Icon placeholder (text fallback since SVG can't embed React icons) */}
              <text
                x={device.x} y={device.y}
                textAnchor="middle" dominantBaseline="central"
                fill={color} fontSize={device.type === 'internet' ? 14 : 12}
                fontWeight="bold" fontFamily="Inter, sans-serif"
              >
                {device.type === 'internet' ? '🌐' :
                 device.type === 'router' ? 'R' :
                 device.type === 'switch' ? 'SW' :
                 device.type === 'pc' ? '💻' :
                 device.type === 'attacker' ? '⚠' :
                 device.type === 'server' ? 'SRV' :
                 '👁'}
              </text>
              {/* Label */}
              <text
                x={device.x}
                y={device.y + 32}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {device.name.length > 18 ? device.name.substring(0, 18) + '…' : device.name}
              </text>
              {/* IP Label */}
              <text
                x={device.x}
                y={device.y + 43}
                textAnchor="middle"
                fill="#475569"
                fontSize={8}
                fontFamily="JetBrains Mono, monospace"
              >
                {device.ip}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Device Info Panel */}
      {selectedDevice && (
        <div className="absolute top-2 right-2 w-72 bg-navy-800 rounded-xl border border-white/10 p-4 shadow-2xl z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">{selectedDevice.name}</h3>
            <button onClick={() => setSelectedDevice(null)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">IP Address</span>
              <span className="text-cyber-cyan font-mono">{selectedDevice.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MAC Address</span>
              <span className="text-gray-300 font-mono text-[11px]">{selectedDevice.mac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold ${
                selectedDevice.status === 'online' ? 'text-cyber-green' :
                selectedDevice.status === 'compromised' ? 'text-red-400' :
                selectedDevice.status === 'protected' ? 'text-emerald-400' :
                'text-gray-500'
              }`}>
                {selectedDevice.status.charAt(0).toUpperCase() + selectedDevice.status.slice(1)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-gray-400 leading-relaxed">{selectedDevice.role}</p>
            </div>
            {selectedDevice.securityConfig && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-gray-500 font-medium mb-1">Security Configuration</p>
                {selectedDevice.securityConfig.map((cfg, i) => (
                  <p key={i} className="text-gray-400 text-[11px] font-mono">• {cfg}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
