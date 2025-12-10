
// import fetch from 'node-fetch'; // Native fetch in Node 18+

const API_URL = 'https://api.tushare.pro';
const TUSHARE_TOKEN = '05a92403c3c2178fedbe68494724e9336f80869fd1875f4354920958';

async function queryTushare(api_name, params = {}) {
  try {
    console.log(`Querying ${api_name}...`);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_name,
        token: TUSHARE_TOKEN,
        params,
      }),
    });

    const json = await response.json();
    console.log(`Response code for ${api_name}:`, json.code);
    if (json.code !== 0) {
        console.error(`Error msg:`, json.msg);
    }
    
    if (json.data) {
        console.log(`Response data keys for ${api_name}:`, Object.keys(json.data));
        if (json.data.items) {
             console.log(`Items count: ${json.data.items.length}`);
             if (json.data.items.length > 0) {
                 console.log(`First item sample:`, json.data.items[0]);
             }
        } else {
            console.log(`No items array in data! Data content:`, json.data);
        }
    } else {
        console.log(`No data field in response!`);
    }
    return json;
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

async function run() {
  // 1. Test trade_cal
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  await queryTushare('trade_cal', {
    exchange: 'SSE',
    end_date: today,
    is_open: '1'
  });

  // 2. Test fund_basic
  const fundsRes = await queryTushare('fund_basic', {
    market: 'E',
    status: 'L'
  });

  // 3. Test fund_daily
  // Get a sample code from funds if possible
  let sampleCode = '508001.SH'; // Default fallback
  if (fundsRes && fundsRes.data && fundsRes.data.items && fundsRes.data.items.length > 0) {
      // Find index of ts_code
      const codeIdx = fundsRes.data.fields.indexOf('ts_code');
      if (codeIdx >= 0) {
          sampleCode = fundsRes.data.items[0][codeIdx];
      }
  }

  await queryTushare('fund_daily', {
    ts_code: sampleCode,
    trade_date: today // Might be empty if today is not trading day or data not updated
  });
  
  // Try previous date for daily quote to ensure we get data
  await queryTushare('fund_daily', {
    ts_code: sampleCode,
    start_date: '20240101',
    end_date: today,
    limit: 5
  });
}

run();
