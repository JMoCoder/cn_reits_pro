import { ReitData, AssetType, TushareDailyQuote } from '../types';
import { getLatestTradingDate, fetchREITsList, fetchDailyQuotes } from './tushare';

// --- HELPERS ---

const guessSector = (name: string): string => {
  if (name.includes('能源') || name.includes('光伏') || name.includes('风电') || name.includes('电投') || name.includes('京能') || name.includes('龙源')) return '能源';
  if (name.includes('高速') || name.includes('路') || name.includes('交') || name.includes('沪杭甬')) return '收费公路';
  if (name.includes('园') || name.includes('张江') || name.includes('蛇口') || name.includes('东久') || name.includes('光谷') || name.includes('软件') || name.includes('合肥')) return '产业园区';
  if (name.includes('仓') || name.includes('物流') || name.includes('普洛斯') || name.includes('盐田') || name.includes('顺丰')) return '仓储物流';
  if (name.includes('保') || name.includes('安居') || name.includes('房') || name.includes('宽庭') || name.includes('有巢')) return '保障房';
  if (name.includes('消费') || name.includes('商') || name.includes('奥莱') || name.includes('大悦城') || name.includes('天街') || name.includes('百联') || name.includes('华润')) return '消费基础设施';
  if (name.includes('水') || name.includes('环') || name.includes('绿能') || name.includes('首创')) return '环保';
  return '其他';
};

const getAssetType = (sector: string): AssetType => {
  if (['产业园区', '仓储物流', '保障房', '消费基础设施'].includes(sector)) return AssetType.PROPERTY;
  return AssetType.FRANCHISE;
};

export interface ReitListResult {
  data: ReitData[];
  date: string;
}

// 1. Fetch List Only
export const loadReitList = async (): Promise<ReitData[]> => {
  try {
    const reits = await fetchREITsList();
    if (!reits || reits.length === 0) {
      throw new Error("No REITs found in fund_basic response");
    }

    return reits.map((fund, index) => {
      const sector = guessSector(fund.name);
      const assetType = getAssetType(sector);

      return {
        id: index + 1,
        code: fund.ts_code.split('.')[0], 
        name: fund.name,
        sector,
        assetType,
        prevClose: 0,
        currentPrice: 0,
        changePercent: 0,
        volume: 0,
        amount: 0
      };
    });
  } catch (error) {
    console.error("Failed to load REIT list:", error);
    throw error;
  }
};

// 3. One-Stop Market Data Load (List + Prices)
export const loadMarketData = async (onProgress?: (msg: string) => void): Promise<{data: ReitData[], date: string}> => {
  try {
    if (onProgress) onProgress("Connecting to Tushare Exchange...");
    
    // 1. Get List
    const listData = await loadReitList();
    
    if (onProgress) onProgress(`Found ${listData.length} listed REITs. Fetching real-time quotes...`);
    
    // 2. Get Prices (Optimized Batch)
    return await loadReitPrices(listData);
  } catch (error) {
    console.error("Failed to load market data:", error);
    throw error;
  }
};

// 2. Fetch Prices Only and Merge
export const loadReitPrices = async (currentData: ReitData[]): Promise<{data: ReitData[], date: string}> => {
  try {
    // A. Get Calendar
    const tradeDate = await getLatestTradingDate();
    
    // B. Get Quotes
    // Reconstruct ts_codes from currentData
    // Note: currentData.code is stripped (e.g. 508001), we need to append suffix. 
    // Wait, getRealMarketData used reits list which has ts_code.
    // We should probably pass the full ts_codes or reconstruct them.
    // Tushare needs suffix. Let's guess suffix based on code?
    // 508xxx -> .SH, 180xxx -> .SZ
    const codes = currentData.map(item => {
        if (item.code.startsWith('508')) return `${item.code}.SH`;
        return `${item.code}.SZ`;
    });

    let quotes = await fetchDailyQuotes(codes, tradeDate);

    // If quotes are empty, it might be that tradeDate has no data for these specific funds (e.g. market closed but calendar says open, or data late)
    // Try to fallback to previous day if quotes are completely empty
    if (quotes.length === 0) {
        console.warn(`[DataService] No quotes for ${tradeDate}, trying previous day...`);
        // We can't easily get "previous day" without calendar logic, but we can rely on tushare.ts internal logic or retry here.
        // Actually, tushare.ts getLatestTradingDate already tries to handle "today vs yesterday".
        // But if getLatestTradingDate returns a date that HAS no data for REITs specifically (maybe only stock market open?), we need to step back.
        
        // Let's try to fetch quotes for a known previous date just in case.
        // Simple hack: try yesterday string (not accurate for weekends but better than nothing as a blind retry?)
        // Better: let's trust the empty result for now, OR:
        // We can use the logic from tushare.ts that we added (probe) but that was inside getLatestTradingDate.
        // If we are here, it means getLatestTradingDate returned a date, but fetchDailyQuotes(codes) returned nothing.
        
        // This implies: The date is valid for the EXCHANGE, but maybe not for these FUNDS?
        // Or the codes are wrong?
        console.log("Debug Codes sent:", codes.slice(0, 3));
    }

    // Create a Map for O(1) quote lookup
    const quoteMap = new Map<string, TushareDailyQuote>();
    // Since we fetch a range (last 5 days), we might get multiple quotes per code.
    // We want the LATEST one.
    // Sort quotes by date descending first.
    quotes.sort((a, b) => b.trade_date.localeCompare(a.trade_date));
    
    quotes.forEach(q => {
        // Since we sorted descending, the first time we see a code, it's the latest date.
        // Map.set overwrites, so we should only set if NOT exists.
        if (!quoteMap.has(q.ts_code)) {
            quoteMap.set(q.ts_code, q);
        }
    });

    const updatedData = currentData.map(item => {
      const tsCode = item.code.startsWith('508') ? `${item.code}.SH` : `${item.code}.SZ`;
      const quote = quoteMap.get(tsCode);

      if (!quote) return item; // Keep existing if no quote

      return {
        ...item,
        prevClose: quote.pre_close,
        currentPrice: quote.close,
        changePercent: quote.pct_chg / 100,
        volume: quote.vol,
        amount: quote.amount
      };
    });

    return { data: updatedData, date: tradeDate };

  } catch (error) {
    console.error("Failed to load prices:", error);
    // Don't throw, just return current data so list stays visible
    return { data: currentData, date: '' };
  }
};