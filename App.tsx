
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, RefreshCcw, ExternalLink, FolderPlus, Trash2, CheckCircle2, Download, Upload } from 'lucide-react';
import { AppState, PortfolioItem, WatchlistItem, MarketData, StockType, PortfolioGroup } from './types';
import { fetchStockData } from './services/stockService';
import PortfolioForm from './components/PortfolioForm';
import PortfolioList from './components/PortfolioList';
import Watchlist from './components/Watchlist';
import DashboardCharts from './components/DashboardCharts';

const STORAGE_KEY = 'smartinvest_v3';

const App: React.FC = () => {
  const [portfolios, setPortfolios] = useState<PortfolioGroup[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string>('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{current: number, total: number} | null>(null);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        setPortfolios(parsed.portfolios || []);
        setActivePortfolioId(parsed.activePortfolioId || (parsed.portfolios?.[0]?.id || ''));
        setWatchlist(parsed.watchlist || []);
        setMarketData(parsed.marketData || {});
      } catch (e) {
        console.error("Failed to load state", e);
      }
    } else {
      const defaultId = crypto.randomUUID();
      const defaultGroup: PortfolioGroup = { id: defaultId, name: 'Main Portfolio', cash: 0, items: [] };
      setPortfolios([defaultGroup]);
      setActivePortfolioId(defaultId);
    }
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      const state: AppState = { portfolios, activePortfolioId, watchlist, marketData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [portfolios, activePortfolioId, watchlist, marketData]);

  const activePortfolio = useMemo(() => 
    portfolios.find(p => p.id === activePortfolioId) || portfolios[0], 
  [portfolios, activePortfolioId]);

  const refreshAllData = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const allTickers = new Set<string>();
    portfolios.forEach(p => p.items.forEach(item => allTickers.add(item.ticker)));
    watchlist.forEach(w => allTickers.add(w.ticker));
    
    const tickersToFetch = Array.from(allTickers);
    setSyncProgress({ current: 0, total: tickersToFetch.length });

    const newMarketData = { ...marketData };
    
    for (let i = 0; i < tickersToFetch.length; i++) {
        const ticker = tickersToFetch[i];
        setSyncProgress({ current: i + 1, total: tickersToFetch.length });
        if (i > 0) await sleep(30000);
        const data = await fetchStockData(ticker);
        newMarketData[ticker] = data;
        
        setPortfolios(prev => prev.map(p => ({
            ...p,
            items: p.items.map(item => 
                item.ticker === ticker ? { ...item, sector: data.sector, type: data.type } : item
            )
        })));
        setMarketData({ ...newMarketData });
    }

    setIsLoading(false);
    setSyncProgress(null);
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ portfolios, watchlist, cash: 0, activePortfolioId }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `smartinvest_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.portfolios) {
          setPortfolios(parsed.portfolios);
          setActivePortfolioId(parsed.activePortfolioId || parsed.portfolios[0].id);
          setWatchlist(parsed.watchlist || []);
          alert("Import successful! Please refresh data to get latest prices.");
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    fileReader.readAsText(file);
  };

  const createNewPortfolio = () => {
    const name = prompt('Enter Portfolio Name:');
    if (!name) return;
    const newId = crypto.randomUUID();
    setPortfolios([...portfolios, { id: newId, name, cash: 0, items: [] }]);
    setActivePortfolioId(newId);
  };

  const deleteActivePortfolio = () => {
    if (portfolios.length <= 1) return alert("Must keep at least one portfolio");
    if (!confirm(`Delete "${activePortfolio?.name}"?`)) return;
    const remaining = portfolios.filter(p => p.id !== activePortfolioId);
    setPortfolios(remaining);
    setActivePortfolioId(remaining[0].id);
  };

  const updateCash = (newCash: number) => {
    setPortfolios(portfolios.map(p => p.id === activePortfolioId ? { ...p, cash: newCash } : p));
  };

  const addPortfolioItem = (basicInfo: Pick<PortfolioItem, 'ticker' | 'costBasis' | 'shares'>) => {
    const newItem: PortfolioItem = {
      ...basicInfo,
      id: crypto.randomUUID(),
      type: StockType.UNKNOWN,
      sector: 'Pending Sync...',
      dcaChecked: [false, false, false, false, false]
    };
    setPortfolios(portfolios.map(p => p.id === activePortfolioId ? { ...p, items: [...p.items, newItem] } : p));
  };

  const removePortfolioItem = (id: string) => {
    setPortfolios(portfolios.map(p => ({ ...p, items: p.items.filter(item => item.id !== id) })));
  };

  const updateDCA = (itemId: string, index: number, checked: boolean) => {
    setPortfolios(portfolios.map(p => ({
        ...p,
        items: p.items.map(item => {
            if (item.id !== itemId) return item;
            const newChecks = [...item.dcaChecked];
            newChecks[index] = checked;
            return { ...item, dcaChecked: newChecks };
        })
    })));
  };

  const addWatchlistItem = (ticker: string) => {
    if (watchlist.some(w => w.ticker === ticker)) return;
    setWatchlist([...watchlist, { id: crypto.randomUUID(), ticker }]);
  };

  const removeWatchlistItem = (id: string) => {
    setWatchlist(watchlist.filter(w => w.id !== id));
  };

  const currentStockValue = activePortfolio?.items.reduce((acc, item) => {
    const price = marketData[item.ticker]?.price || item.costBasis;
    return acc + (price * item.shares);
  }, 0) || 0;
  
  const totalValue = currentStockValue + (activePortfolio?.cash || 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2 rounded-xl">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
               <span className="font-bold text-lg">SmartInvest AI</span>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] text-slate-400 font-bold uppercase">Static Cloud Protected</span>
               </div>
            </div>
          </div>

          {syncProgress && (
             <div className="flex-1 max-w-xs mx-4">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} />
                </div>
             </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Value</div>
              <div className="font-mono font-bold text-lg text-emerald-600">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <button 
              onClick={refreshAllData}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border border-slate-200 ${isLoading ? 'animate-spin text-slate-400' : 'text-accent hover:bg-slate-50'}`}
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Portfolio Selection & Utilities */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200 pb-4">
           {portfolios.map(p => (
              <button
                 key={p.id}
                 onClick={() => setActivePortfolioId(p.id)}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activePortfolioId === p.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                 {p.name}
              </button>
           ))}
           <button onClick={createNewPortfolio} title="New Portfolio" className="p-2 text-slate-400 hover:text-slate-600"><FolderPlus className="w-5 h-5" /></button>
           
           <div className="ml-auto flex items-center gap-2">
              <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Upload className="w-3.5 h-3.5 rotate-180" /> Backup
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Restore
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section><PortfolioForm onAdd={addPortfolioItem} cash={activePortfolio?.cash || 0} onUpdateCash={updateCash} /></section>
            <section><PortfolioList items={activePortfolio?.items || []} marketData={marketData} onDelete={removePortfolioItem} onUpdateDCA={updateDCA} /></section>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <DashboardCharts portfolio={activePortfolio?.items || []} marketData={marketData} />
             <Watchlist items={watchlist} marketData={marketData} onAdd={addWatchlistItem} onRemove={removeWatchlistItem} />

             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Research Intelligence</h4>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-2">
                   {(Object.values(marketData) as MarketData[]).filter(d => d.sources && d.sources.length > 0).slice(-4).reverse().map((data, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-800 ml-1">{data.ticker} Sources:</div>
                        {data.sources?.map((s, sIdx) => (
                            <a key={sIdx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                              <span className="text-[11px] text-slate-600 truncate mr-2">{s.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                        ))}
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
