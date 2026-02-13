import React, { useState } from 'react';
import { PlusCircle, Wallet, Search } from 'lucide-react';
import { PortfolioItem } from '../types';

interface Props {
  onAdd: (item: Pick<PortfolioItem, 'ticker' | 'costBasis' | 'shares'>) => void;
  cash: number;
  onUpdateCash: (val: number) => void;
}

const PortfolioForm: React.FC<Props> = ({ onAdd, cash, onUpdateCash }) => {
  const [ticker, setTicker] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [shares, setShares] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !costBasis || !shares) return;

    onAdd({
      ticker: ticker.toUpperCase(),
      costBasis: parseFloat(costBasis),
      shares: parseFloat(shares),
    });

    setTicker('');
    setCostBasis('');
    setShares('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="mb-6 pb-6 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Cash Position (USD)</span>
         </div>
         <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={cash} 
              onChange={(e) => onUpdateCash(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right font-mono"
            />
         </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-accent" />
            Quick Add
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
            AI Auto-Classification Enabled
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Ticker</label>
          <div className="relative">
            <input
              required
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="NVDA"
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none uppercase"
            />
            <Search className="absolute right-2 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Avg Cost</label>
          <input
            required
            type="number"
            step="0.01"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Shares</label>
          <input
            required
            type="number"
            step="any"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Add to Portfolio
          </button>
        </div>
      </form>
    </div>
  );
};

export default PortfolioForm;