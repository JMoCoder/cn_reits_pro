export enum AssetType {
  PROPERTY = '产权类',
  FRANCHISE = '特许经营权'
}

export interface ReitData {
  id: number;
  code: string; // Stock code
  name: string;
  sector: string; // e.g., 产业园区, 能源
  assetType: AssetType;
  
  // Price Data
  prevClose: number;
  open: number;
  high: number;
  low: number;
  currentPrice: number;
  change: number; // Price Change Amount
  changePercent: number; // Daily change
  
  // Volume/Turnover
  volume: number; // Volume (Hands)
  amount: number; // Amount (1000 CNY)
}

export type SortField = keyof ReitData;
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Tushare API Interfaces
export interface TushareResponse<T> {
  request_id: string;
  code: number;
  msg: string;
  data: {
    fields: string[];
    items: T[][];
  };
}

export interface TushareFundBasic {
  ts_code: string;
  name: string;
  management: string;
  fund_type: string;
  list_date: string;
  delist_date: string;
}

export interface TushareDailyQuote {
  ts_code: string;
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
}