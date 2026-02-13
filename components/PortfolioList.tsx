
import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { PortfolioItem, MarketData, StockType } from '../types';

interface Props {
  items: PortfolioItem[];
  marketData: Record<string, MarketData>;
  onDelete: (id: string) => void;
  onUpdateDCA: (id: string, index: number, checked: boolean) => void;
}

const PortfolioList: React.FC<Props> = ({ items, marketData, onDelete, onUpdateDCA }) => {
  if (items.length === 0) {
    return (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="text-slate-400 mb-2 font-medium">No assets in this portfolio</div>
            <p className="text-xs text-slate-300">Add tickers using the form above to start tracking</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Asset</th>
              <th className="p-4 font-semibold text-slate-600">Position</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Value</th>
              <th className="p-4 font-semibold text-slate-600 text-center">DCA Ladder</th>
              <th className="p-4 font-semibold text-slate-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const data = marketData[item.ticker];
              const isPending = !data || item.type === StockType.UNKNOWN;
              const currentPrice = data?.price || item.costBasis;
              const currentValue = currentPrice * item.shares;
              const costValue = item.costBasis * item.shares;
              const gainLoss = currentValue - costValue;
              const gainLossPercent = ((currentPrice - item.costBasis) / item.costBasis) * 100;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{item.ticker}</div>
                        {/* Wrap Lucide icon in a span to provide title tooltip, resolving TS error */}
                        {isPending && <span title="Pending AI Sync"><Clock className="w-3 h-3 text-amber-500" /></span>}
                    </div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isPending ? 'Sync Required' : `${item.type} • ${item.sector}`}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-700 font-medium">{item.shares} <span className="text-[10px] text-slate-400">units</span></div>
                    <div className="text-xs text-slate-500">Avg: ${item.costBasis.toFixed(2)}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-mono font-bold text-slate-800">
                        ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-xs flex items-center justify-end gap-1 font-semibold ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                      {gainLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {gainLossPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {[10, 20, 30, 40, 50].map((drop, idx) => {
                        const targetPrice = item.costBasis * (1 - drop / 100);
                        const isHit = currentPrice <= targetPrice;
                        const isChecked = item.dcaChecked?.[idx] || false;
                        
                        return (
                          <div key={idx} className="flex flex-col items-center group/dca relative">
                            <label 
                                className={`
                                    w-8 h-8 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
                                    ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : ''}
                                    ${!isChecked && isHit ? 'border-amber-500 bg-amber-50 animate-pulse' : ''}
                                    ${!isChecked && !isHit ? 'border-slate-100 bg-slate-50 text-slate-300' : ''}
                                    hover:scale-110 active:scale-95
                                `}
                                title={`Target Buy at -${drop}% ($${targetPrice.toFixed(2)})`}
                            >
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={isChecked}
                                onChange={(e) => onUpdateDCA(item.id, idx, e.target.checked)}
                              />
                              <span className="text-[9px] font-black">{drop}</span>
                            </label>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/dca:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-opacity font-mono">
                                ${targetPrice.toFixed(1)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-slate-300 hover:text-danger hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioList;
