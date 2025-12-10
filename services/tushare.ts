import { TushareResponse, TushareFundBasic, TushareDailyQuote, TushareFundManager, TushareFundNav, TushareFundDiv } from '../types';

// Always use proxy to avoid CORS in browser environment
// Requires server-side proxy configuration (Vite 'server.proxy' or Nginx)
const API_URL = '/tushare_api';
const TUSHARE_TOKEN = '05a92403c3c2178fedbe68494724e9336f80869fd1875f4354920958';

// Generic Tushare Request Handler
async function queryTushare<T>(api_name: string, params: Record<string, any> = {}): Promise<T[]> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_name,
        token: TUSHARE_TOKEN,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    let json: TushareResponse<any>;
    try {
      json = await response.json();
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response from Tushare API: ${parseError}`);
    }

    if (json.code !== 0) {
      console.error(`Tushare API Error [${api_name}]: ${json.msg}`);
      throw new Error(`Tushare API: ${json.msg}`);
    }

    if (!json.data || !json.data.items) {
      console.warn(`[Tushare API] No data items found for ${api_name}`, json);
      return [];
    }

    // Map fields array and items array to objects
    const { fields, items } = json.data;
    const result: T[] = items.map((item) => {
      const obj: any = {};
      fields.forEach((field, index) => {
        obj[field] = item[index];
      });
      return obj;
    });

    console.debug(`[Tushare API] ${api_name} returned ${result.length} items.`);
    return result;
  } catch (error) {
    // Suppress stack trace for expected CORS errors in browser environment
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.warn(`[Tushare API] Network request failed (CORS or Network). Switching to offline demo mode. URL: ${API_URL}`);
        throw new Error('CORS_BLOCK');
    }
    
    console.error(`Failed to fetch ${api_name}:`, error);
    throw error;
  }
}

// 1. Get the latest trading date (Market Open)
export const getLatestTradingDate = async (): Promise<string> => {

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  
  try {
    const cal = await queryTushare<any>('trade_cal', {
      exchange: 'SSE',
      end_date: dateStr,
      is_open: '1'
    });

    // Sort descending by date just in case, though API usually handles it
    if (cal && cal.length > 0) {
      // Sort by cal_date descending to get the latest one
      cal.sort((a, b) => b.cal_date.localeCompare(a.cal_date));
      let latestDate = cal[0].cal_date;

      // Logic to check if today is "too early" for End-Of-Day data
      // If latestDate is TODAY, and current time is before 16:00 (4 PM), 
      // it's very likely Tushare hasn't updated fund_daily yet.
      // But relying on client time is risky.
      // Better strategy: Probe for data availability using a sample REIT.
      const sampleCode = '508001.SH'; // 浙商沪杭甬REIT
      console.log(`[Tushare API] Probing data availability for ${sampleCode} around ${latestDate}...`);
      
      try {
          // Ask for last 5 days of data for this sample
          // We don't specify trade_date to get range
          const sampleQuotes = await queryTushare<TushareDailyQuote>('fund_daily', {
              ts_code: sampleCode,
              start_date: '20200101', // Look back enough, but trade_cal already gave us recent
              limit: 5 // Just need latest few
          });
          
          if (sampleQuotes && sampleQuotes.length > 0) {
              // Sort descending by trade_date just to be safe
              sampleQuotes.sort((a, b) => b.trade_date.localeCompare(a.trade_date));
              const availableLatestDate = sampleQuotes[0].trade_date;
              console.log(`[Tushare API] Probe found latest available data date: ${availableLatestDate}`);
              
              if (availableLatestDate) {
                  return availableLatestDate;
              }
          } else {
              console.warn(`[Tushare API] Probe returned no data for ${sampleCode}.`);
          }
      } catch (probeError) {
          console.warn(`[Tushare API] Probe failed:`, probeError);
      }

      // If probe fails, fallback to previous logic (but use safer fallback)
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().split('T')[0].replace(/-/g, '');
      
      // If we got today as latest date, but we don't trust it (e.g. probe failed or we want to be safe)
      if (latestDate === todayStr) {
         // Force fallback if after 16:00 but data might still be missing (based on probe failure)
         // Or if before 16:00
         if (currentHour < 16) {
             console.log(`[Tushare API] Today is ${todayStr} and time is ${currentHour}:00, assuming data not ready. Using previous trading day.`);
             if (cal.length > 1) latestDate = cal[1].cal_date;
         } else {
             // Probe failed logic: if we are here, it means probe failed to find data for today
             // So we should probably trust the probe failure and use yesterday
             console.warn(`[Tushare API] Probe failed for today (${todayStr}), falling back to previous trading day just in case.`);
             if (cal.length > 1) latestDate = cal[1].cal_date;
         }
      }

      console.log(`[Tushare API] Latest trading date used: ${latestDate}`);
      return latestDate;
    } else {
        console.warn("[Tushare API] No trading calendar found, using system date.");
    }
  } catch (e: any) {
    if (e.message !== 'CORS_BLOCK') {
        console.warn("Could not fetch trade calendar, using local date.", e);
    }
    throw e;
  }
  return dateStr; // Fallback
};

// 2. Fetch all Listed Funds and Filter for REITs
export const fetchREITsList = async (): Promise<TushareFundBasic[]> => {
  // Fetch Exchange traded funds
  // Note: 'fund_basic' might require specific permissions or might be empty without correct params.
  // Using market: 'E' and status: 'L'
  const funds = await queryTushare<TushareFundBasic>('fund_basic', {
    market: 'E', 
    status: 'L'
  });

  const reitKeywords = ['REIT'];
  
  return funds.filter(fund => {
    const nameUpper = fund.name.toUpperCase();
    const hasKeyword = reitKeywords.some(k => nameUpper.includes(k));
    // Filter for C-REITs: Must be SSE (508xxx) or SZSE (180xxx)
    // Exclude QDII/LOF like "美国REIT" which starts with 16xxxx
    const isMainlandREIT = fund.ts_code.startsWith('508') || fund.ts_code.startsWith('180');
    
    return hasKeyword && isMainlandREIT;
  });
};

// 3. Fetch Daily Quotes for specific codes
export const fetchDailyQuotes = async (ts_codes: string[], trade_date: string): Promise<TushareDailyQuote[]> => {
  if (ts_codes.length === 0) return [];

  const results: TushareDailyQuote[] = [];
  
  // Strategy: Batch fetch using date range with Fallback
  // We use a smaller chunk size (10) to avoid API issues.
  // If batch fails (returns 0 items), we fall back to single-code fetching for that chunk.
  
  const CHUNK_SIZE = 10;
  console.log(`[Tushare API] Fetching quotes for ${ts_codes.length} codes on ${trade_date} using HYBRID BATCH requests...`);

  // Calculate start date for range query (last 5 days)
  const d = new Date(trade_date.substring(0,4)+'-'+trade_date.substring(4,6)+'-'+trade_date.substring(6,8));
  d.setDate(d.getDate() - 5);
  const startDateStr = d.toISOString().split('T')[0].replace(/-/g, '');

  for (let i = 0; i < ts_codes.length; i += CHUNK_SIZE) {
    const chunk = ts_codes.slice(i, i + CHUNK_SIZE);
    const codesStr = chunk.join(',');
    
    try {
        // Attempt Batch
        console.log(`[Tushare API] Requesting batch ${i/CHUNK_SIZE + 1} (${chunk.length} codes)...`);
        const quotes = await queryTushare<TushareDailyQuote>('fund_daily', {
            ts_code: codesStr,
            start_date: startDateStr,
            end_date: trade_date,
            limit: 100 // Sufficient for 10 codes * 5 days = 50 items
        });
        
        if (quotes.length > 0) {
            results.push(...quotes);
            console.debug(`[Tushare API] Batch success, got ${quotes.length} items.`);
        } else {
            // Batch returned 0. Fallback to single requests for this chunk.
            console.warn(`[Tushare API] Batch returned 0 items for chunk ${i}. Falling back to single requests.`);
            
            const singlePromises = chunk.map(async (code) => {
                try {
                    const singleQuotes = await queryTushare<TushareDailyQuote>('fund_daily', {
                        ts_code: code,
                        start_date: startDateStr,
                        end_date: trade_date,
                        limit: 5
                    });
                    return singleQuotes;
                } catch (e) {
                    console.warn(`[Tushare API] Single fetch failed for ${code}`, e);
                    return [];
                }
            });
            
            const singleResults = await Promise.all(singlePromises);
            singleResults.forEach(res => results.push(...res));
            
            // Add a small delay to respect rate limits during fallback burst
            await new Promise(r => setTimeout(r, 500));
        }
    } catch (e) {
        console.warn(`Failed to fetch batch quotes for chunk ${i}`, e);
    }
  }

  console.log(`[Tushare API] Batch fetch complete. Total quotes found: ${results.length}`);
  return results;
};

export const getRealMarketData = async () => {
  try {
    // A. Get Calendar
    const tradeDate = await getLatestTradingDate();
    
    // B. Get List
    const reits = await fetchREITsList();
    
    // Check if we actually got REITs, if not, might be permission issue or API limit
    if (!reits || reits.length === 0) {
      throw new Error("No REITs found in fund_basic response");
    }

    // C. Get Quotes
    let codes = reits.map(r => r.ts_code);
    let quotes = await fetchDailyQuotes(codes, tradeDate);

    // Backup: If quotes are empty (e.g. maybe it IS after 16:00 but data still not ready, or holiday adjustment issue)
    // Try previous trading day if we haven't already switched? 
    // This is complex because we need the cal again. 
    // Let's just trust getLatestTradingDate logic for now, or add a simple retry with explicit date logic if empty.
    
    if (quotes.length === 0) {
        console.warn(`[Tushare API] No quotes found for date ${tradeDate}. Trying to find previous available date...`);
        // Fetch calendar again to find previous date
        const cal = await queryTushare<any>('trade_cal', {
            exchange: 'SSE',
            end_date: tradeDate,
            is_open: '1'
        });
        
        if (cal && cal.length > 1) {
            // Sort desc
            cal.sort((a, b) => b.cal_date.localeCompare(a.cal_date));
            // cal[0] is tradeDate (or close to it), cal[1] is previous
            // Make sure we don't pick tradeDate again
            const prevDate = cal.find(d => d.cal_date < tradeDate)?.cal_date;
            
            if (prevDate) {
                console.log(`[Tushare API] Retrying with previous date: ${prevDate}`);
                quotes = await fetchDailyQuotes(codes, prevDate);
                // Update return date
                return { reits, quotes, date: prevDate };
            }
        }
    }

    return { reits, quotes, date: tradeDate };
  } catch (e) {
    // Only log if it's NOT a handled CORS block
    if ((e as Error).message !== 'CORS_BLOCK') {
        console.error("Workflow failed", e);
    }
    throw e; // Re-throw to trigger fallback in dataService
  }
};

// 4. Fetch Fund Manager Info
export const fetchFundManager = async (ts_code: string): Promise<TushareFundManager[]> => {
  return await queryTushare<TushareFundManager>('fund_manager', { ts_code });
};

// 5. Fetch Fund NAV
export const fetchFundNav = async (ts_code: string): Promise<TushareFundNav[]> => {
  // Get latest 30 NAV points
  return await queryTushare<TushareFundNav>('fund_nav', { 
    ts_code,
    limit: 30
  });
};

// 6. Fetch Fund Dividend
export const fetchFundDiv = async (ts_code: string): Promise<TushareFundDiv[]> => {
  return await queryTushare<TushareFundDiv>('fund_div', { ts_code });
};

// 7. Fetch Full Fund Basic Info (Single)
export const fetchFundBasicInfo = async (ts_code: string): Promise<TushareFundBasic | null> => {
  // Remove market: 'E' to be safer for single code lookup, rely on ts_code uniqueness
  const result = await queryTushare<TushareFundBasic>('fund_basic', { ts_code });
  return result.length > 0 ? result[0] : null;
};
