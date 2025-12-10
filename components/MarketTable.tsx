import React, { useMemo } from 'react';
import { ReitData, SortConfig, SortField } from '../types';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

interface MarketTableProps {
  data: ReitData[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

// Utility for Chinese Market Coloring (Red = Up, Green = Down)
const getTrendColor = (val: number) => {
  if (val > 0) return 'text-market-red';
  if (val < 0) return 'text-market-green';
  return 'text-market-muted';
};

const getTrendBg = (val: number) => {
    if (val > 0.01) return 'bg-market-red/10';
    if (val < -0.01) return 'bg-market-green/10';
    return '';
}

const formatPct = (val: number) => (val * 100).toFixed(2) + '%';
const formatNumber = (val: number, digits = 3) => val.toFixed(digits);

interface HeaderCellProps {
  field: SortField;
  label: string;
  width: string;
  align?: 'left' | 'right' | 'center';
  stickyLeft?: number;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

const HeaderCell: React.FC<HeaderCellProps> = ({ 
  field, 
  label, 
  width, 
  align = 'right', 
  stickyLeft, 
  sortConfig, 
  onSort 
}) => {
  const renderSortIcon = () => {
    if (sortConfig.field !== field) return <ChevronsUpDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-market-text" /> 
      : <ArrowDown size={14} className="text-market-text" />;
  };

  return (
    <th 
      className={`
        p-3 text-xs font-semibold text-market-muted uppercase tracking-wider 
        cursor-pointer hover:bg-market-card hover:text-white transition-colors
        border-b border-market-border bg-market-bg
        ${stickyLeft !== undefined ? 'sticky z-20 bg-market-bg shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]' : ''}
        ${width}
      `}
      style={{ left: stickyLeft !== undefined ? stickyLeft : undefined }}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        {field !== 'id' && renderSortIcon()}
      </div>
    </th>
  );
};

export const MarketTable: React.FC<MarketTableProps> = ({ data, sortConfig, onSort }) => {
  
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      // Handle potential undefined values safely
      const valA = a[sortConfig.field];
      const valB = b[sortConfig.field];
      
      // String sorting (Sector, Name, AssetType) - Use Chinese Pinyin Locale Compare
      if (typeof valA === 'string' && typeof valB === 'string') {
          const comparison = valA.localeCompare(valB, 'zh-CN');
          return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      // Numeric sorting (Price, Change, Volume, Amount)
      const numA = (typeof valA === 'number') ? valA : -Infinity;
      const numB = (typeof valB === 'number') ? valB : -Infinity;

      if (numA < numB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (numA > numB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  return (
    <div className="flex-1 overflow-auto bg-market-bg relative rounded-lg border border-market-border shadow-xl">
      <table className="min-w-full border-collapse">
        <thead className="sticky top-0 z-30 bg-market-bg shadow-md h-12">
          <tr>
            <HeaderCell 
              field="code" 
              label="代码" 
              width="w-[90px]" 
              align="left" 
              stickyLeft={0} 
              sortConfig={sortConfig} 
              onSort={onSort} 
            />
            <HeaderCell 
              field="name" 
              label="项目名称" 
              width="w-[140px]" 
              align="left" 
              stickyLeft={90} 
              sortConfig={sortConfig} 
              onSort={onSort} 
            />
            <HeaderCell 
              field="sector" 
              label="行业板块" 
              width="w-[100px]" 
              align="left" 
              stickyLeft={230} 
              sortConfig={sortConfig} 
              onSort={onSort} 
            />
            <HeaderCell 
              field="assetType" 
              label="资产类别" 
              width="w-[100px]" 
              align="center" 
              stickyLeft={330}
              sortConfig={sortConfig} 
              onSort={onSort} 
            />
            <HeaderCell field="currentPrice" label="最新价" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="changePercent" label="涨跌幅" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="change" label="涨跌额" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="volume" label="成交量(手)" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="amount" label="成交额(千元)" width="w-32" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="open" label="开盘" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="high" label="最高" width="w-24" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell field="low" label="最低" width="w-24" sortConfig={sortConfig} onSort={onSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-market-border">
          {sortedData.map((row) => (
            <tr key={row.id} className="hover:bg-market-card/50 transition-colors group">
              {/* Sticky Columns - Matched widths with Header */}
              <td className="p-3 text-sm font-mono text-market-muted sticky left-0 z-10 bg-market-bg group-hover:bg-market-card/50 border-r border-market-border/30 w-[90px] truncate">
                {row.code}
              </td>
              <td className="p-3 text-sm font-medium text-blue-400 sticky left-[90px] z-10 bg-market-bg group-hover:bg-market-card/50 border-r border-market-border/30 w-[140px] truncate" title={row.name}>
                {row.name}
              </td>
              <td className="p-3 text-sm font-medium text-market-text sticky left-[230px] z-10 bg-market-bg group-hover:bg-market-card/50 border-r border-market-border/30 w-[100px] truncate">
                {row.sector}
              </td>
              <td className="p-3 text-xs text-center text-market-muted sticky left-[330px] z-10 bg-market-bg group-hover:bg-market-card/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] w-[100px]">
                <span className={`px-2 py-1 rounded-full ${row.assetType === '产权类' ? 'bg-indigo-900/30 text-indigo-300' : 'bg-amber-900/30 text-amber-300'}`}>
                  {row.assetType}
                </span>
              </td>

              <td className={`p-3 text-sm text-right font-mono font-medium ${getTrendColor(row.changePercent)}`}>
                {row.currentPrice > 0 ? formatNumber(row.currentPrice) : <span className="text-market-muted">---</span>}
              </td>
              
              <td className={`p-3 text-sm text-right font-mono font-bold ${getTrendBg(row.changePercent)}`}>
                 {row.currentPrice > 0 ? (
                    <span className={getTrendColor(row.changePercent)}>
                      {row.changePercent > 0 ? '+' : ''}{formatPct(row.changePercent)}
                    </span>
                 ) : <span className="text-market-muted">---</span>}
              </td>

              <td className={`p-3 text-sm text-right font-mono font-medium ${getTrendColor(row.change)}`}>
                {row.currentPrice > 0 ? formatNumber(row.change) : '---'}
              </td>

              <td className="p-3 text-sm text-right font-mono text-market-muted">
                {row.currentPrice > 0 ? formatNumber(row.volume, 0) : '---'}
              </td>

              <td className="p-3 text-sm text-right font-mono text-market-text">
                {row.currentPrice > 0 ? formatNumber(row.amount, 2) : '---'}
              </td>

              <td className="p-3 text-sm text-right font-mono text-market-text">
                {row.currentPrice > 0 ? formatNumber(row.open) : '---'}
              </td>
              <td className="p-3 text-sm text-right font-mono text-market-text">
                {row.currentPrice > 0 ? formatNumber(row.high) : '---'}
              </td>
              <td className="p-3 text-sm text-right font-mono text-market-text">
                {row.currentPrice > 0 ? formatNumber(row.low) : '---'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};