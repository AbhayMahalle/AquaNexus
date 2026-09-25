'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
}

const DEFAULT_COLORS = ['#F97316', '#374151', '#EA580C', '#6B7280', '#FB923C', '#1F2937', '#F59E0B'];

export const DonutChartWrapper: React.FC<DonutChartProps> = ({ data, height = 260 }) => {
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
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChartWrapper;