
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
  // Always use process.env.API_KEY directly.
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is missing! Ensure process.env.API_KEY is defined.");
    return createEmptyData(ticker, "Config Error");
  }

  try {
    // Instantiate right before usage to ensure up-to-date configuration.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Search for real-time market data for "${ticker}". 
      Also identify its "sector" (e.g. Technology, Healthcare) and "type" (choose one: ETF, Growth, Speculative, Dividend).
      
      Return ONLY a strict JSON object with these keys:
      "price": number,
      "changePercent": number,
      "ath": number,
      "rsi": number,
      "ma200": number,
      "peRatio": number,
      "pegRatio": number,
      "sector": string,
      "type": string (must be one of: ETF, Growth, Speculative, Dividend)
    `;

    // Use gemini-3-flash-preview for general text and search tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract text from response (property, not a method).
    const text = response.text || "";
    const data = parseGeminiJson(text);
    
    // Extract website URLs from groundingChunks as required when using googleSearch.
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

    if (!data) throw new Error("Could not parse data from AI response");

    return {
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
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return createEmptyData(ticker, "Sync Failed");
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
