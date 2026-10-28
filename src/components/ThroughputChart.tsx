import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ThroughputChartProps {
  data: ChartDataPoint[];
  title: string;
  yLabel?: string;
  yUnit?: string;
  showArea?: boolean;
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-navy-800 border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-500 mb-1.5 font-mono">Time: {label}s</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-mono font-semibold">
            {entry.value.toLocaleString()} kbps
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ThroughputChart({ data, title, yLabel = 'Throughput (kbps)', showArea = false, height = 300 }: ThroughputChartProps) {
  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div className="bg-navy-800 rounded-xl border border-white/5 p-4">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            label={{ value: 'Time (s)', position: 'bottom', offset: -5, style: { fill: '#64748b', fontSize: 10 } }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 15, style: { fill: '#64748b', fontSize: 10 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value: string) => (
              <span className="text-xs text-gray-400">{value}</span>
            )}
          />
          {showArea ? (
            <>
              <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#00b4d8" fill="#00b4d8" fillOpacity={0.1} strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="attack" name="Under Attack" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="mitigation" name="With Mitigation" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} dot={false} />
            </>
          ) : (
            <>
              <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#00b4d8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00b4d8' }} />
              <Line type="monotone" dataKey="attack" name="Under Attack" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="mitigation" name="With Mitigation" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
