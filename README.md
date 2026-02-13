# 🚀 SmartInvest AI Dashboard

SmartInvest AI 是一個基於 React 的個人金融資產管理儀表板。它結合了 Google Gemini AI 的強大搜尋與分析能力，能自動追蹤投資組合、視覺化資產分配，並提供專業級的技術指標觀察清單。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61dafb.svg)
![Tailwind](https://img.shields.io/badge/styles-TailwindCSS-38bdf8.svg)
![AI](https://img.shields.io/badge/AI-Gemini%20Flash-orange.svg)

## ✨ 核心特色

- **🤖 AI 自動分類**：只需輸入股票代碼，系統會自動抓取板塊、價格、P/E、PEG 等資訊，並自動將標的分為「ETF、成長、股息或投機」。
- **📁 多重投資組合**：支援建立多個獨立組合（如：長線存股、波段操作），各組合擁有獨立的現金水位。
- **📊 數據視覺化**：透過 Recharts 提供資產權重、板塊曝險與類型分佈的圖形化分析。
- **🧗 DCA 階梯管理**：獨創的「微笑曲線」補倉階梯，自動計算跌幅價格並追蹤是否達成補倉目標。
- **🔍 深度自選清單**：即時監控 RSI 超賣、ATH 回撤與 MA200 支撐等關鍵技術指標。
- **💾 離線優先與備份**：資料儲存於本地瀏覽器，並支援 JSON 導出/導入，確保數據不丟失。

## 🛠️ 技術棧

- **Core**: React 19 (ESM Mode)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Intelligence**: Google Gemini API (@google/genai)
- **Deployment**: GitHub Pages

## 🚀 部署指引 (GitHub Pages)

### 1. 環境變數設定
本專案需要 **Gemini API Key** 才能運作。在部署至 GitHub Pages 時：
- 請在 GitHub Repo 的 `Settings > Secrets and variables > Actions` 中新增名為 `API_KEY` 的 Secret。
- 在你的 `workflow.yml` 構建步驟中注入此變數。

### 2. 構建命令
```bash
npm install
npm run build
