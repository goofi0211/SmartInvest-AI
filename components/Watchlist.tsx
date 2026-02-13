import React, { useState } from 'react';
import { X, Plus, AlertTriangle, ArrowDown } from 'lucide-react';
import { WatchlistItem, MarketData } from '../types';

interface Props {
  items: WatchlistItem[];
  marketData: Record<string, MarketData>;
  onAdd: (ticker: string) => void;
  onRemove: (id: string) => void;
}

const Watchlist: React.FC<Props> = ({ items, marketData, onAdd, onRemove }) => {
  const [newTicker, setNewTicker] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicker) {
      onAdd(newTicker.toUpperCase());
      setNewTicker('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Watchlist</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="Symbol..."
            className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none uppercase"
          />
          <button type="submit" className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const data = marketData[item.ticker];
          if (!data) return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse">
               <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
               <div className="h-8 bg-slate-100 rounded w-1/2"></div>
            </div>
          );

          // Logic for indicators
          const dropFromAth = ((data.ath - data.price) / data.ath) * 100;
          const isDeepDrop = dropFromAth >= 10 && dropFromAth <= 50;
          const isOversold = data.rsi < 30;
          const isUndervaluedPeg = data.pegRatio > 0 && data.pegRatio < 1;
          const isBelowMA200 = data.price < data.ma200;

          return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
              <button 
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2 text-slate-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-slate-900">{item.ticker}</div>
                  <div className="text-2xl font-mono font-medium text-slate-700">
                    ${data.price.toFixed(2)}
                  </div>
                </div>
                <div className={`text-sm font-medium px-2 py-1 rounded ${data.changePercent >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {data.changePercent > 0 ? '+' : ''}{data.changePercent}%
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* ATH Indicator */}
                <div className={`flex justify-between items-center p-1.5 rounded ${isDeepDrop ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                   <span className="text-slate-500">Drawdown (ATH)</span>
                   <div className="flex items-center gap-1 font-medium">
                      {isDeepDrop && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      <span className={isDeepDrop ? 'text-amber-700' : 'text-slate-700'}>
                        -{dropFromAth.toFixed(1)}%
                      </span>
                   </div>
                </div>

                {/* Technical Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">RSI</span>
                        <span className={`font-medium ${isOversold ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>
                            {data.rsi?.toFixed(0) || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">PEG</span>
                        <span className={`font-medium ${isUndervaluedPeg ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {data.pegRatio?.toFixed(2) || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">MA200</span>
                        <span className={`font-medium ${isBelowMA200 ? 'text-indigo-600' : 'text-slate-600'}`}>
                            ${data.ma200?.toFixed(0) || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">P/E</span>
                        <span className="text-slate-600 font-medium">{data.peRatio?.toFixed(1) || '-'}</span>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Watchlist;