import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  lines: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
}

export const LineChartWrapper: React.FC<LineChartProps> = ({
  data,
  xKey,
  lines,
  height = 280,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
          {lines.map((line, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || (idx === 0 ? '#0F4C81' : '#1597D4')}
              strokeWidth={2.5}
              dot={{ r: 3, fill: line.color || '#0F4C81' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
