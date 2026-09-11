import React from 'react';
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

export const BarChartWrapper: React.FC<BarChartProps> = ({
  data,
  xKey,
  bars,
  height = 280,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: '#64748B', fontSize: 12 }} stroke="#CBD5E1" />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} stroke="#CBD5E1" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          {bars.map((bar, idx) => (
            <Bar
              key={idx}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || (idx === 0 ? '#0F4C81' : '#1597D4')}
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
