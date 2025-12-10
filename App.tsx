import React, { useState, useEffect } from 'react';
import { Activity, Search, ListFilter, Clock, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { loadMarketData } from './services/dataService';
import { MarketTable } from './components/MarketTable';
import { ReitData, SortConfig, SortField } from './types';

function App() {
  const [data, setData] = useState<ReitData[]>([]);
  const [filteredData, setFilteredData] = useState<ReitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'changePercent', direction: 'desc' });
  
  // App State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [marketDate, setMarketDate] = useState<string>('');
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Initial Data Load
  const fetchData = async () => {
    setIsLoading(true);
    setLoadingStatus('Connecting to Exchange...');
    setErrorMsg('');
    
    try {
      // One-Stop Load
      const { data: marketData, date } = await loadMarketData((msg) => setLoadingStatus(msg));
      
      setData(marketData);
      setMarketDate(date);
      setIsFallback(false);
      
      if (!date) {
         // This means list loaded but prices failed (handled by service)
         setErrorMsg('Pricing data unavailable');
         setIsFallback(true);
      }

    } catch (err) {
      console.error("Market data fetch failed:", err);
      setErrorMsg('Failed to load market data');
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = data;
    
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerTerm) || 
        item.code.includes(lowerTerm) ||
        item.sector.includes(searchTerm)
      );
    }
    
    if (selectedSector !== 'All') {
      result = result.filter(item => item.sector === selectedSector);
    }

    setFilteredData(result);
  }, [data, searchTerm, selectedSector]);

  // Sort Handler
  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sectors = ['All', ...Array.from(new Set(data.map(d => d.sector))).filter(Boolean)];
  
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return '---';
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-market-bg text-market-text font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex-none h-14 border-b border-market-border bg-market-bg/95 backdrop-blur supports-[backdrop-filter]:bg-market-bg/60 flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded shadow-lg shadow-indigo-500/20">
            <Activity size={18} className="text-white" />
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold tracking-tight text-white">CN-REITs Pro</h1>
            {isFallback && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/30" title={errorMsg}>
                OFFLINE DEMO {errorMsg ? `(${errorMsg})` : ''}
              </span>
            )}
            <span className="text-[10px] text-market-muted uppercase tracking-wider font-medium hidden sm:inline-block">China Real Estate Investment Trust Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-market-card/50 border border-market-border rounded-full px-3 py-1">
            <Clock size={13} className="text-market-muted" />
            <span className="text-xs font-mono text-market-muted font-medium">
              DATA DATE: {formatDate(marketDate)} (CLOSE)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Toolbar & Filter Section */}
        <div className="flex-none px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-market-muted group-focus-within:text-indigo-400 transition-colors" size={15} />
            <input 
              type="text" 
              placeholder="Search code, name..." 
              className="w-full pl-9 pr-4 py-2 bg-market-card border border-market-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-market-text placeholder-market-muted/70 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Sector Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar mask-linear-fade">
            <ListFilter size={15} className="text-market-muted mr-1 flex-none" />
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all border
                  ${selectedSector === sector 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20' 
                    : 'bg-market-card border-market-border text-market-muted hover:border-market-muted hover:text-white'}
                `}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Data Grid Area */}
        <div className="flex-1 px-6 pb-6 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-market-muted">
               <RefreshCw className="animate-spin mb-3 text-indigo-500" size={32} />
               <p className="text-sm">Connecting to Exchange...</p>
               <p className="text-xs opacity-50 mt-1">{loadingStatus}</p>
            </div>
          ) : (
            <>
              {isFallback && (
                <div className="flex-none mb-2 px-3 py-2 bg-amber-900/20 border border-amber-900/40 rounded flex items-center gap-2 text-amber-200 text-xs">
                  <WifiOff size={14} />
                  <span>
                    {errorMsg && errorMsg.includes('CORS') 
                      ? "Connection to Tushare API failed (Browser CORS Restricted). Showing simulated offline data."
                      : `Offline Demo Mode: ${errorMsg || 'Data unavailable'}. Showing simulated data.`}
                  </span>
                </div>
              )}
              
              <MarketTable 
                data={filteredData} 
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <div className="flex-none mt-2 flex justify-between items-center text-[10px] text-market-muted uppercase tracking-wider">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                   {isFallback ? 'Offline Mode' : 'Tushare Pro Connection Active'}
                 </div>
                 <div className="flex gap-4">
                   <span>Total Listed: {data.length}</span>
                   <span>CNY Currency</span>
                 </div>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;