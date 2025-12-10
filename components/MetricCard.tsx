import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, trend = 'neutral', color = 'text-market-text' }) => {
  return (
    <div className="bg-market-card rounded-lg p-4 border border-market-border hover:border-market-muted/50 transition-colors">
      <div className="text-xs text-market-muted mb-1">{label}</div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
      {subValue && (
        <div className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-market-red' : trend === 'down' ? 'text-market-green' : 'text-market-muted'}`}>
          {subValue}
        </div>
      )}
    </div>
  );
};