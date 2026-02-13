export enum StockType {
  ETF = 'ETF',
  GROWTH = 'Growth',
  SPECULATIVE = 'Speculative',
  DIVIDEND = 'Dividend',
  UNKNOWN = 'Pending Sync',
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MarketData {
  ticker: string;
  price: number;
  changePercent: number;
  ath: number;
  rsi: number;
  ma200: number; 
  peRatio: number;
  pegRatio: number;
  sector: string;
  type: StockType;
  lastUpdated: number;
  sources?: GroundingSource[];
  isFetching?: boolean; // 新增：正在抓取標記
}

export interface PortfolioGroup {
  id: string;
  name: string;
  cash: number;
  items: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  ticker: string;
  costBasis: number;
  shares: number;
  type: StockType;
  sector: string;
  dcaChecked: boolean[];
}

export interface WatchlistItem {
  id: string;
  ticker: string;
}

export interface AppState {
  portfolios: PortfolioGroup[]; // 改為陣列支持多組合
  activePortfolioId: string;
  watchlist: WatchlistItem[];
  marketData: Record<string, MarketData>;
}