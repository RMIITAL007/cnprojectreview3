import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: 'blue' | 'red' | 'green' | 'amber' | 'cyan' | 'purple';
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-cyber-blue/10', text: 'text-cyber-blue', border: 'border-cyber-blue/20', icon: 'text-cyber-blue' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'text-red-400' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', border: 'border-cyan-400/20', icon: 'text-cyan-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: 'text-purple-400' },
};

export default function MetricCard({ label, value, unit, icon: Icon, color = 'blue', trend, subtitle }: MetricCardProps) {
  const c = colorMap[color];

  return (
    <div className={`bg-navy-800 rounded-xl border ${c.border} p-4 card-hover`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            trend === 'up' ? 'bg-emerald-500/15 text-emerald-400' :
            trend === 'down' ? 'bg-red-500/15 text-red-400' :
            'bg-gray-500/15 text-gray-400'
          }`}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-xl font-bold ${c.text} font-mono tracking-tight`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
        {subtitle && <p className="text-[10px] text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
}
