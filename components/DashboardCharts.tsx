
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { PortfolioItem, MarketData } from '../types';

interface Props {
  portfolio: PortfolioItem[];
  marketData: Record<string, MarketData>;
}

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

// Moved ChartWrapper outside to fix TS issues with local components and children property inference
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
    <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">{title}</h4>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

const DashboardCharts: React.FC<Props> = ({ portfolio, marketData }) => {
  if (portfolio.length === 0) {
    return (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
            Add assets to see analytics
        </div>
    )
  }

  // Calculate Values
  const portfolioWithValue = portfolio.map(item => ({
    ...item,
    currentValue: (marketData[item.ticker]?.price || item.costBasis) * item.shares
  }));

  // 1. Stock Weighting
  const stockData = portfolioWithValue.map(p => ({ name: p.ticker, value: p.currentValue }));

  // 2. Type Distribution
  const typeMap = new Map<string, number>();
  portfolioWithValue.forEach(p => {
    typeMap.set(p.type, (typeMap.get(p.type) || 0) + p.currentValue);
  });
  const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

  // 3. Sector Distribution
  const sectorMap = new Map<string, number>();
  portfolioWithValue.forEach(p => {
    sectorMap.set(p.sector, (sectorMap.get(p.sector) || 0) + p.currentValue);
  });
  const sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <ChartWrapper title="Allocation by Asset">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stockData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {stockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Allocation by Type">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Sector Exposure">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
};

export default DashboardCharts;
