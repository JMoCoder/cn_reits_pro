import { ReitData, AssetType, TushareDailyQuote, ReitDetail } from '../types';
import { getLatestTradingDate, fetchREITsList, fetchDailyQuotes, fetchFundBasicInfo, fetchFundManager, fetchFundNav, fetchFundDiv } from './tushare';
import reitMeta from './reit_meta.json';

// --- HELPERS ---

const isSubsequence = (s: string, t: string): boolean => {
  let i = 0, j = 0;
  while (i < s.length && j < t.length) {
      if (s[i] === t[j]) {
          i++;
      }
      j++;
  }
  return i === s.length;
};

const getSimilarity = (s: string, t: string): number => {
  const setS = new Set(s.split(''));
  const setT = new Set(t.split(''));
  let intersection = 0;
  setS.forEach(char => {
      if (setT.has(char)) intersection++;
  });
  // Jaccard-like or Overlap coefficient
  // Using overlap coefficient relative to the shorter string to handle abbreviations
  const minLen = Math.min(s.length, t.length);
  if (minLen === 0) return 0;
  return intersection / minLen;
};

const findMeta = (tushareName: string): { sector: string, assetType: AssetType } => {
  // Strategy: 
  // 1. Exact/Includes match
  // 2. Subsequence match (Tushare name is a subsequence of Excel name)
  // 3. Similarity match (Character overlap > 70%)
  
  const cleanTsName = tushareName.replace(/REIT/i, '').trim();
  
  // 1. Exact / Includes
  let match = reitMeta.find(meta => {
      const cleanMetaName = meta.name.replace(/REIT/i, '').trim();
      return cleanMetaName.includes(cleanTsName) || cleanTsName.includes(cleanMetaName);
  });

  // 2. Subsequence
  if (!match) {
      match = reitMeta.find(meta => {
          const cleanMetaName = meta.name.replace(/REIT/i, '').trim();
          return isSubsequence(cleanTsName, cleanMetaName);
      });
  }

  // 3. Similarity Fallback (for complex mismatches like "山东高速" vs "山高")
  if (!match) {
      let bestScore = 0;
      let bestMatch = null;
      
      reitMeta.forEach(meta => {
          const cleanMetaName = meta.name.replace(/REIT/i, '').trim();
          const score = getSimilarity(cleanTsName, cleanMetaName);
          if (score > bestScore) {
              bestScore = score;
              bestMatch = meta;
          }
      });
      
      // Threshold: 0.7 (70% overlap)
      if (bestScore > 0.7 && bestMatch) {
          match = bestMatch;
          // console.debug(`[Fuzzy Match] ${tushareName} ~= ${match.name} (Score: ${bestScore.toFixed(2)})`);
      }
  }

  if (match) {
      return {
          sector: match.sector,
          assetType: match.assetType === '产权类' ? AssetType.PROPERTY : AssetType.FRANCHISE
      };
  }

  // Fallback: If not matched, DO NOT guess. Use placeholder to ensure rigor.
  return {
      sector: '未分类',
      assetType: AssetType.FRANCHISE // Default fallback, but sector marks it as unclassified
  };
};

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
      // Use Metadata Matcher
      const { sector, assetType } = findMeta(fund.name);

      return {
        id: index + 1,
        code: fund.ts_code, // Display full code
        ts_code: fund.ts_code,
        name: fund.name,
        sector,
        assetType,
        prevClose: 0,
        open: 0,
        high: 0,
        low: 0,
        currentPrice: 0,
        change: 0,
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
    // Use ts_code directly as it contains the full code with suffix (e.g., 508001.SH)
    const codes = currentData.map(item => item.ts_code);

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
      // item.ts_code is already the full code (e.g., 508001.SH)
      const quote = quoteMap.get(item.ts_code);

      if (!quote) return item; // Keep existing if no quote

      return {
        ...item,
        prevClose: quote.pre_close,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        currentPrice: quote.close,
        change: quote.change,
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

export const getReitDetail = async (code: string): Promise<ReitDetail> => {
  try {
    // 1. Fetch Basic Info (Critical)
    const base = await fetchFundBasicInfo(code);

    if (!base) {
      throw new Error(`Fund info not found for ${code}`);
    }

    // 2. Fetch Supplementary Data (Non-Critical, Parallel)
    // We catch errors individually so one failure doesn't block the whole modal
    const [managers, nav, dividend] = await Promise.all([
      fetchFundManager(code).catch(e => {
        console.warn(`Failed to fetch managers for ${code}`, e);
        return [];
      }),
      fetchFundNav(code).catch(e => {
        console.warn(`Failed to fetch NAV for ${code}`, e);
        return [];
      }),
      fetchFundDiv(code).catch(e => {
        console.warn(`Failed to fetch dividends for ${code}`, e);
        return [];
      })
    ]);

    return {
      base,
      managers,
      nav,
      dividend
    };
  } catch (error) {
    console.error("Failed to fetch REIT detail:", error);
    throw error;
  }
};
