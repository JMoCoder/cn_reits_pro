export enum AssetType {
  PROPERTY = '产权类',
  FRANCHISE = '特许经营权'
}

export interface ReitData {
  id: number;
  code: string; // Stock code (short)
  ts_code: string; // Tushare code (with suffix)
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
  custodian: string;
  fund_type: string;
  found_date: string;
  due_date: string;
  list_date: string;
  issue_date: string;
  delist_date: string;
  issue_amount: number;
  m_fee: number;
  c_fee: number;
  duration_year: number;
  p_value: number;
  min_amount: number;
  benchmark: string;
  invest_type: string;
  type: string;
  trustee: string;
  purc_startdate: string;
  redm_startdate: string;
  market: string;
}

export interface TushareFundManager {
  ts_code: string;
  ann_date: string;
  name: string;
  gender: string;
  birth_year: string;
  edu: string;
  nationality: string;
  begin_date: string;
  end_date: string;
  resume: string;
}

export interface TushareFundNav {
  ts_code: string;
  ann_date: string;
  nav_date: string;
  unit_nav: number; // Unit Net Asset Value
  accum_nav: number; // Accumulated NAV
  accum_div: number;
  net_asset: number;
  total_netasset: number;
  adj_nav: number;
}

export interface TushareFundDiv {
  ts_code: string;
  ann_date: string;
  div_proc: string; // Dividend progress
  record_date: string;
  ex_date: string;
  pay_date: string;
  div_cash: number; // Dividend per share
  base_unit: number; // Base shares for dividend
  ear_distr: number; // Earnings distributed
  div_memo?: string;
}

export interface ReitDetail {
  base: TushareFundBasic;
  managers: TushareFundManager[];
  nav: TushareFundNav[]; // History of NAV (maybe last 30 days or just latest?) Let's keep latest few.
  dividend: TushareFundDiv[]; // Dividend history
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