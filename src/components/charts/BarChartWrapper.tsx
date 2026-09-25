'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface BarChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  bars: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
}

export const BarChartWrapper: React.FC<BarChartProps> = ({ data, xKey, bars, height = 280 }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ width: '100%', height }} className="flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
        <span className="text-xs text-textMuted font-medium">Loading chart...</span>
      </div>
    );
  }

  const formatTooltipValue = (val: any) => {
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return val;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: '#64748B', fontSize: 12 }} stroke="#E2E8F0" />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            stroke="#E2E8F0"
            tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
          />
          <Tooltip
            formatter={(value: any) => [formatTooltipValue(value), '']}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#FED7AA',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.08)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          {bars.map((bar, idx) => (
            <Bar
              key={idx}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || (idx === 0 ? '#F97316' : '#374151')}
              radius={[6, 6, 0, 0]}
              barSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartWrapper;