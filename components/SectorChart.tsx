import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { ReitData } from '../types';

interface SectorChartProps {
  data: ReitData[];
}

export const SectorChart: React.FC<SectorChartProps> = ({ data }) => {
  // Aggregate data by sector
  const sectorMap = new Map<string, { totalYield: number; count: number; totalChange: number }>();
  
  data.forEach(item => {
    const existing = sectorMap.get(item.sector) || { totalYield: 0, count: 0, totalChange: 0 };
    sectorMap.set(item.sector, {
      totalYield: existing.totalYield + item.yieldForecast2025,
      totalChange: existing.totalChange + item.changePercent,
      count: existing.count + 1
    });
  });

  const chartData = Array.from(sectorMap.entries()).map(([name, stats]) => ({
    name,
    avgYield: (stats.totalYield / stats.count) * 100,
    avgChange: (stats.totalChange / stats.count) * 100
  })).sort((a, b) => b.avgYield - a.avgYield);

  return (
    <div className="h-64 w-full">
      <h3 className="text-xs font-semibold text-market-muted uppercase mb-4 tracking-wider">板块平均分派率 (Sector Avg Yield)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            interval={0} 
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip 
            cursor={{ fill: '#334155', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '4px', color: '#f1f5f9' }}
            itemStyle={{ color: '#fbbf24' }}
            formatter={(value: number) => [value.toFixed(2) + '%', '平均分派率']}
          />
          <Bar dataKey="avgYield" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.avgYield > 5 ? '#f59e0b' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};