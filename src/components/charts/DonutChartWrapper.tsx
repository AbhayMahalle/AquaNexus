import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
}

const DEFAULT_COLORS = ['#0F4C81', '#1597D4', '#22B8CF', '#F59E0B', '#16A34A', '#DC2626'];

export const DonutChartWrapper: React.FC<DonutChartProps> = ({ data, height = 260 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
