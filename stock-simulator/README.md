# Market Terminal Simulator

A professional-grade stock market simulator designed to teach young adults the end-to-end workflow of investing. The interface is intentionally complex, mimicking real trading platforms like Thinkorswim, Interactive Brokers, and Bloomberg Terminal.

## 🎯 Educational Objectives

1. **Secondary Market Trading** - Understanding order types, execution, and price discovery
2. **Primary Markets (IPOs)** - Analyzing prospectuses and understanding allocation mechanics
3. **Hidden Costs** - Learning about taxes, slippage, and the true cost of trading

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Seed market data (generates static JSON files)
npm run seed

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
stock-simulator/
├── public/
│   └── data/                    # Seeded market data (JSON)
│       ├── tickers/             # Historical OHLCV data
│       ├── intraday/            # Minute-level tick data
│       ├── ipos/                # Simulated IPO prospectuses
│       └── market_events.json   # Earnings, dividends, splits
├── scripts/
│   └── data_seeder.js           # Data generation script
├── src/
│   ├── components/
│   │   └── terminal/            # Trading interface components
│   ├── hooks/
│   │   └── useMarketReplay.js   # Core simulation engine
│   ├── stores/
│   │   ├── marketStore.js       # Global market state
│   │   └── playerStore.js       # Player portfolio & progression
│   ├── utils/
│   │   ├── taxCalculator.js     # Capital gains logic
│   │   └── slippage.js          # Execution simulation
│   ├── App.jsx                  # Main application
│   └── main.jsx                 # Entry point
└── development_plan.md          # Full GDD & implementation plan
```

## 🎮 Stage 1 Features (Current)

- **Professional Chart** - Candlestick charts with TradingView's Lightweight Charts
- **Order Entry** - Market orders (Limit/Stop unlock with progression)
- **Order Book** - Simulated bid/ask depth visualization
- **Watchlist** - Monitor multiple securities
- **Portfolio Tracking** - Real-time P&L calculation
- **Market Replay** - Historical data playback at 1x-50x speed

## 🔧 Technology Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| Framework | React 18 + Vite | Fast builds, modern DX |
| State | Zustand | Lightweight, performant |
| Charts | Lightweight Charts | Professional financial charts |
| UI | Radix UI + Tailwind | Accessible, customizable |
| Tables | TanStack Table | Virtualized data tables |
| Layout | React-Grid-Layout | Draggable terminal panels |

## 📊 Data Architecture

**No Live API Dependency** - The simulator uses pre-seeded historical data:

1. `npm run seed` fetches data from Alpha Vantage (or generates synthetic data)
2. Data is saved as static JSON in `/public/data/`
3. The Market Replay Engine "plays" this data forward at runtime
4. Users experience realistic market conditions without API costs

### Environment Variables (for seeding)

```env
ALPHA_VANTAGE_KEY=your_api_key  # Optional - falls back to synthetic data
```

## 🎓 Progression System

Players start with limited capabilities and unlock features through gameplay:

| Achievement | Unlock |
|-------------|--------|
| 10 trades executed | Limit Orders |
| 20 trades executed | Stop Orders |
| 5% portfolio gain | 5 additional tickers |
| Hold position 1+ year | Long-term tax rate visibility |

## 📈 Roadmap

### Stage 1: Secondary Market ✅
- [x] Terminal layout with draggable panels
- [x] Candlestick charting
- [x] Market order execution
- [x] Portfolio P&L tracking
- [x] Market replay engine

### Stage 2: Primary Market (Planned)
- [ ] IPO calendar
- [ ] S-1 prospectus analyzer
- [ ] Indication of Interest submission
- [ ] Allocation engine
- [ ] Lock-up period tracking

### Stage 3: Reality Layer (Planned)
- [ ] Tax lot tracking (FIFO/LIFO/Specific ID)
- [ ] Wash sale detection
- [ ] Capital gains calculator
- [ ] 1099-B report generation
- [ ] Fee transparency dashboard

## 🖥️ Deployment

Optimized for **Cloudflare Pages** (static hosting):

```bash
npm run build
# Deploy /dist folder to Cloudflare Pages
```

## 🤝 Contributing

This is an educational project. Contributions that enhance the learning experience are welcome.

## 📄 License

MIT License - Educational use encouraged.

---

*"The goal is to acclimate users to the complexity, data density, and decision-making processes of the real financial world."*
