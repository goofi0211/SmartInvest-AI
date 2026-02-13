
import { GoogleGenAI } from "@google/genai";
import { MarketData, StockType, GroundingSource } from '../types';

/**
 * Utility to parse JSON from the model's text response.
 */
const parseGeminiJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Fetches real-time market data using Gemini 3 and Google Search grounding.
 */
export const fetchStockData = async (ticker: string): Promise<MarketData> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const CACHE_KEY = `stock_cache_${ticker.toUpperCase()}`;
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 小時快取時間

  // --- 1. 檢查快取 ---
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsedCache = JSON.parse(cached);
    if (Date.now() - parsedCache.lastUpdated < CACHE_EXPIRY) {
      console.log(`[Cache] 讀取快取資料: ${ticker}`);
      return parsedCache;
    }
  }

  if (!apiKey) {
    console.error("Gemini API Key 遺失！");
    return createEmptyData(ticker, "Config Error");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const prompt = `
      Search for real-time market data for "${ticker}". 
      Also identify its "sector" (e.g. Technology, Healthcare) and "type" (choose one: ETF, Growth, Speculative, Dividend).
      Return ONLY a strict JSON object with price, changePercent, ath, rsi, ma200, peRatio, pegRatio, sector, type.
    `;

    // 建議改用穩定的 gemini-1.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const data = parseGeminiJson(text);
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    if (!data) throw new Error("AI 回傳格式錯誤");

    const result: MarketData = {
      ticker: ticker.toUpperCase(),
      price: data.price || 0,
      changePercent: data.changePercent || 0,
      ath: data.ath || 0,
      rsi: data.rsi || 50,
      ma200: data.ma200 || 0,
      peRatio: data.peRatio || 0,
      pegRatio: data.pegRatio || 0,
      sector: data.sector || "General",
      type: (data.type as StockType) || StockType.GROWTH,
      lastUpdated: Date.now(),
      sources: sources.slice(0, 3),
    };

    // --- 2. 存入快取 ---
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;

  } catch (error: any) {
    console.error(`Error fetching ${ticker}:`, error);
    return createEmptyData(ticker, error.status === 429 ? "Rate Limited" : "Sync Failed");
  }
};

const createEmptyData = (ticker: string, sector: string): MarketData => ({
  ticker: ticker.toUpperCase(),
  price: 0,
  changePercent: 0,
  ath: 0,
  rsi: 0,
  ma200: 0,
  peRatio: 0,
  pegRatio: 0,
  sector: sector,
  type: StockType.UNKNOWN,
  lastUpdated: Date.now(),
});
