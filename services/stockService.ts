import * as GenerativeAI from "@google/genai";
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

export const fetchStockData = async (ticker: string): Promise<MarketData> => {
  // 從環境變數讀取 API Key
  const apiKey = import.meta.env.VITE_API_KEY;
  const CACHE_KEY = `stock_cache_${ticker.toUpperCase()}`;
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 小時快取

  // 1. 檢查快取邏輯
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
    // --- 關鍵修正點：確保實例化方式能讓 TS 正確辨識方法 ---
    const genAI = new GenerativeAI.GoogleGenAI(apiKey);
    
    // 取得模型實例
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ googleSearch: {} }] as any 
    });

    const prompt = `
      Search for real-time market data for "${ticker}". 
      Return ONLY a strict JSON object with price, changePercent, ath, rsi, ma200, peRatio, pegRatio, sector, type.
    `;

    // 呼叫 API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const data = parseGeminiJson(text);
    
    // 處理來源資料
    const sources: GroundingSource[] = [];
    const metadata = response.candidates?.[0]?.groundingMetadata;
    if (metadata?.groundingChunks) {
      metadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    if (!data) throw new Error("AI 回傳格式無法解析");

    const finalResult: MarketData = {
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

    // 存入快取
    localStorage.setItem(CACHE_KEY, JSON.stringify(finalResult));
    return finalResult;

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
