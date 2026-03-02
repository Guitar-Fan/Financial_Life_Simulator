# Market Terminal Simulator - Game Design Document & Development Plan

## Executive Summary

**Project Codename:** MarketTerminal  
**Target Audience:** Young adults (18-30) seeking to understand professional investing workflows  
**Core Philosophy:** No training wheels. Users learn by immersion in a high-fidelity trading environment.

This document outlines the complete architecture for a web-based stock market simulator that replicates the complexity and data density of professional trading platforms like Thinkorswim, Interactive Brokers, and Bloomberg Terminal.

---

## Part 1: Technical Architecture

### 1.1 Technology Stack Decisions

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | React 18 + Vite | Fast HMR, optimized builds for Cloudflare Pages |
| **State Management** | Zustand | Lightweight, no boilerplate, perfect for real-time tick updates |
| **Charting** | Lightweight Charts (TradingView) | Professional-grade financial charts, MIT licensed, 40KB gzipped |
| **UI Components** | Radix UI + Tailwind CSS | Unstyled primitives for terminal aesthetic, full accessibility |
| **Data Tables** | TanStack Table | Virtualized rendering for order books, watchlists |
| **Layout** | React-Grid-Layout | Draggable, resizable panels like professional terminals |
| **Date Handling** | date-fns | Tree-shakeable, immutable date operations |
| **Number Formatting** | Intl.NumberFormat (native) | Locale-aware currency/percentage formatting |

### 1.2 Data Seeding Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT PHASE                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Alpha Vantage│───▶│ data_seeder  │───▶│ Static JSON  │       │
│  │ Polygon.io   │    │    .js       │    │   Assets     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME PHASE                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Static JSON  │───▶│ Market       │───▶│ React        │       │
│  │ /public/data │    │ Replay Engine│    │ Components   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight:** The Market Replay Engine reads historical tick data and "plays" it forward at configurable speeds (1x, 5x, 50x real-time). Users experience what feels like live market conditions without any API calls.

### 1.3 Directory Structure

```
stock-simulator/
├── public/
│   └── data/
│       ├── tickers/
│       │   ├── AAPL.json        # OHLCV + metadata
│       │   ├── MSFT.json
│       │   └── ...
│       ├── ipos/
│       │   ├── IPO_2024_Q1.json # Simulated S-1 data
│       │   └── ...
│       └── market_events.json   # Earnings, splits, dividends
├── scripts/
│   └── data_seeder.js
├── src/
│   ├── components/
│   │   ├── terminal/           # Core trading interface
│   │   ├── charts/             # Charting components
│   │   ├── orderbook/          # Order entry & management
│   │   └── research/           # Fundamentals, news, filings
│   ├── hooks/
│   │   ├── useMarketReplay.js  # Core simulation engine
│   │   ├── usePortfolio.js     # Position tracking
│   │   └── useTaxLots.js       # FIFO/LIFO cost basis
│   ├── stores/
│   │   ├── marketStore.js      # Global market state
│   │   └── playerStore.js      # Player progression
│   ├── utils/
│   │   ├── taxCalculator.js    # Capital gains logic
│   │   └── slippage.js         # Order execution simulation
│   └── App.jsx
├── package.json
└── vite.config.js
```

---

## Part 2: Staged Development Strategy (Vertical Slices)

### Philosophy: "Complete at Every Stage"

Each stage delivers a fully playable experience. We build depth, not breadth. A user completing Stage 1 should feel they played a real game, not a demo.

---

## Stage 1: Secondary Market Foundation
**Duration:** 2-3 weeks  
**Deliverable:** A complete stock trading simulator with charting, order execution, and portfolio tracking.

### 1.1 Core Features

| Feature | Description | Educational Goal |
|---------|-------------|------------------|
| **Professional Chart** | Candlestick/line charts with 10+ indicators | Technical analysis literacy |
| **Order Types** | Market, Limit, Stop, Stop-Limit | Understanding execution risk |
| **Order Book Visualization** | Bid/Ask spread, depth chart | Price discovery mechanics |
| **Portfolio Dashboard** | P&L, unrealized gains, cost basis | Position management |
| **Watchlist** | Customizable ticker lists | Research workflow |
| **Time Controls** | Play/Pause/Speed market replay | Controlled learning pace |

### 1.2 Gameplay Loop (Stage 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAGE 1 GAMEPLAY LOOP                        │
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │ RESEARCH │───▶│  DECIDE  │───▶│ EXECUTE  │───▶│ MONITOR  │ │
│   │          │    │          │    │          │    │          │ │
│   │ • Charts │    │ • Entry  │    │ • Order  │    │ • P&L    │ │
│   │ • News   │    │ • Size   │    │ • Fill   │    │ • Risk   │ │
│   │ • Trends │    │ • Stop   │    │ • Slip   │    │ • Adjust │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        ▲                                              │         │
│        └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Progression System (Stage 1)

**Starting Conditions:**
- Cash: $25,000 (Pattern Day Trader threshold - intentional)
- Unlocked: 5 "blue chip" stocks
- Order Types: Market only

**Unlock Triggers:**
| Achievement | Reward |
|-------------|--------|
| Execute 10 trades | Limit orders unlocked |
| Hold position > 5 market days | Stop orders unlocked |
| Achieve 5% portfolio gain | 10 additional tickers unlocked |
| Read 3 earnings reports | Fundamental data panel unlocked |

---

## Stage 2: Primary Market (IPO Mechanics)
**Duration:** 2 weeks  
**Deliverable:** IPO research, bidding, and allocation simulation.

### 2.1 Core Features

| Feature | Description | Educational Goal |
|---------|-------------|------------------|
| **S-1 Filing Viewer** | Simulated prospectus with key metrics highlighted | Due diligence skills |
| **IPO Calendar** | Upcoming offerings with indicative price ranges | Market awareness |
| **Indication of Interest** | Submit non-binding bids | Understanding allocation |
| **Allocation Engine** | Receive partial fills based on demand | Supply/demand dynamics |
| **Lock-up Tracking** | Monitor insider selling windows | Post-IPO volatility |

### 2.2 IPO Mechanics Deep Dive

**The Problem We're Solving:** Most people don't understand that retail investors rarely get IPO allocations at the offering price. They buy on the secondary market after the "pop."

**Simulation Design:**

```javascript
// Simplified allocation logic
function calculateAllocation(playerBid, totalDemand, sharesOffered) {
  const oversubscriptionRatio = totalDemand / sharesOffered;
  
  if (oversubscriptionRatio <= 1) {
    return playerBid.shares; // Full allocation
  }
  
  // Hot IPO: Pro-rata allocation with institutional priority
  const retailPool = sharesOffered * 0.10; // Only 10% to retail
  const retailDemand = totalDemand * 0.30; // Retail is 30% of demand
  
  return Math.floor(playerBid.shares * (retailPool / retailDemand));
}
```

**Educational Moment:** The player submits an IOI for 100 shares at $20. The IPO is 15x oversubscribed. They receive 3 shares. The stock opens at $35. They learn:
1. IPO access is limited for retail
2. The "pop" happens before they can buy
3. Secondary market entry carries different risk

### 2.3 S-1 Analysis Mini-Game

Players must identify key risk factors from simulated prospectus excerpts:

```
┌─────────────────────────────────────────────────────────────────┐
│  S-1 PROSPECTUS ANALYZER                          [TECHCORP]   │
├─────────────────────────────────────────────────────────────────┤
│  HIGHLIGHT KEY RISK FACTORS:                                    │
│                                                                  │
│  "The Company has incurred net losses since inception and       │
│   may never achieve profitability. Our accumulated deficit      │
│   as of December 31 was $847 million."                          │
│                                                                  │
│  [ ] Revenue Growth    [✓] Profitability    [ ] Competition    │
│                                                                  │
│  "Our business depends on a single customer representing        │
│   78% of our revenue..."                                        │
│                                                                  │
│  [ ] Revenue Growth    [ ] Profitability    [✓] Concentration  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stage 3: The Reality Layer (Taxes, Fees, Friction)
**Duration:** 2 weeks  
**Deliverable:** Full tax simulation, regulatory compliance, and hidden costs.

### 3.1 Core Features

| Feature | Description | Educational Goal |
|---------|-------------|------------------|
| **Tax Lot Tracking** | FIFO/LIFO/Specific ID cost basis | Tax-efficient selling |
| **Wash Sale Detection** | 30-day rule enforcement | Avoiding tax traps |
| **Capital Gains Calculator** | Real-time ST/LT classification | Holding period incentives |
| **Annual Tax Report** | 1099-B simulation | Understanding tax documents |
| **Fee Transparency** | SEC fees, exchange fees | True cost of trading |
| **Margin Interest** | Borrowing cost simulation | Leverage education |

### 3.2 The Tax Engine

**Core Principle:** Every trade creates a tax lot. Every sale matches against existing lots.

```javascript
// Tax lot structure
const taxLot = {
  id: 'lot_001',
  ticker: 'AAPL',
  shares: 10,
  costBasis: 150.00,      // Per share
  acquiredDate: '2024-01-15',
  isWashSale: false,
  disallowedLoss: 0
};

// Capital gains calculation
function calculateGain(lot, salePrice, saleDate) {
  const holdingDays = daysBetween(lot.acquiredDate, saleDate);
  const isLongTerm = holdingDays > 365;
  
  const gain = (salePrice - lot.costBasis) * lot.shares;
  const taxRate = isLongTerm ? 0.15 : 0.37; // Simplified
  
  return {
    gain,
    taxRate,
    taxOwed: Math.max(0, gain * taxRate),
    isLongTerm,
    holdingDays
  };
}
```

### 3.3 The "Churning Lesson"

**Scenario Design:** Player A and Player B both achieve 20% gross returns.

| Metric | Player A (Churner) | Player B (Holder) |
|--------|-------------------|-------------------|
| Trades | 150 | 8 |
| Avg Hold Time | 3 days | 8 months |
| Gross Return | 20% | 20% |
| Tax Rate | 37% (ST) | 15% (LT) |
| Commission Equiv. | $150 | $8 |
| **Net Return** | **12.3%** | **16.9%** |

The game surfaces this comparison after each tax year, making the cost of overtrading visceral.

---

## Part 3: Detailed Gameplay Mechanics

### 3.1 The Research Workflow

**Information Hierarchy:**

```
Level 1: Price & Volume (Free)
├── Real-time quotes
├── Daily OHLCV
└── Basic charts

Level 2: Technical Analysis (Unlocked via trades)
├── 50+ indicators
├── Drawing tools
└── Multi-timeframe analysis

Level 3: Fundamental Data (Unlocked via holding)
├── Earnings history
├── Revenue/profit trends
└── Analyst estimates

Level 4: Insider Activity (Unlocked via IPO participation)
├── Form 4 filings
├── Institutional ownership
└── Lock-up expirations
```

### 3.2 Order Execution Simulation

**Slippage Model:**

```javascript
function simulateExecution(order, marketState) {
  const spread = marketState.ask - marketState.bid;
  const liquidity = marketState.volume;
  
  // Market orders always fill, but with slippage
  if (order.type === 'MARKET') {
    const slippageBps = calculateSlippage(order.shares, liquidity, spread);
    const fillPrice = order.side === 'BUY' 
      ? marketState.ask * (1 + slippageBps / 10000)
      : marketState.bid * (1 - slippageBps / 10000);
    
    return { filled: true, price: fillPrice, slippage: slippageBps };
  }
  
  // Limit orders may not fill
  if (order.type === 'LIMIT') {
    const willFill = order.side === 'BUY'
      ? order.limitPrice >= marketState.ask
      : order.limitPrice <= marketState.bid;
    
    return { filled: willFill, price: order.limitPrice, slippage: 0 };
  }
}

function calculateSlippage(shares, avgVolume, spread) {
  // Larger orders relative to volume = more slippage
  const volumeImpact = (shares / avgVolume) * 100;
  const spreadImpact = (spread / marketState.mid) * 10000;
  
  return Math.min(50, volumeImpact + spreadImpact * 0.5); // Cap at 50 bps
}
```

### 3.3 Risk Management Tools

**Position Sizing Calculator:**

The terminal includes a built-in risk calculator that teaches the 1% rule:

```
┌─────────────────────────────────────────────────────────────────┐
│  POSITION SIZE CALCULATOR                                        │
├─────────────────────────────────────────────────────────────────┤
│  Account Value:        $25,000                                   │
│  Risk Per Trade:       1% = $250                                 │
│                                                                  │
│  Entry Price:          $150.00                                   │
│  Stop Loss:            $145.00                                   │
│  Risk Per Share:       $5.00                                     │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  RECOMMENDED SHARES:   50                                        │
│  POSITION VALUE:       $7,500 (30% of account)                   │
│  MAX LOSS:             $250 (1% of account)                      │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  [!] Warning: Position exceeds 25% concentration guideline       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Educational Integration

### 4.1 Contextual Learning

**Philosophy:** Never interrupt gameplay with tutorials. Embed education in the interface.

| Trigger | Educational Content | Delivery |
|---------|---------------------|----------|
| First market order | Explain bid/ask spread | Tooltip on fill price |
| Price gaps on chart | Explain overnight risk | Chart annotation |
| Dividend date approaching | Explain ex-div mechanics | Calendar alert |
| Wash sale triggered | Explain 30-day rule | Modal with example |
| Year-end | Full tax summary | Report comparison |

### 4.2 Achievement System (Educational Milestones)

```
┌─────────────────────────────────────────────────────────────────┐
│  INVESTOR PROGRESSION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ◉ Novice Trader                     ○ Market Analyst           │
│    └─ Execute first trade              └─ Use 5 indicators      │
│                                                                  │
│  ◉ Risk Manager                      ○ Tax Strategist           │
│    └─ Set stop-loss on 10 trades       └─ Hold for LT gains     │
│                                                                  │
│  ○ IPO Participant                   ○ Wash Sale Survivor       │
│    └─ Receive IPO allocation           └─ Trigger & learn rule  │
│                                                                  │
│  ○ Portfolio Architect               ○ Terminal Master          │
│    └─ Maintain 5+ positions            └─ Complete all stages   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Implementation Checklist

### Stage 1 Milestones

- [ ] Project scaffolding (Vite + React)
- [ ] Data seeder script
- [ ] Market replay engine (useMarketReplay hook)
- [ ] Basic terminal layout (React-Grid-Layout)
- [ ] Candlestick chart integration (Lightweight Charts)
- [ ] Order entry form
- [ ] Order execution simulation
- [ ] Portfolio state management
- [ ] Watchlist component
- [ ] P&L calculations
- [ ] Time control UI
- [ ] Basic progression unlocks

### Stage 2 Milestones

- [ ] IPO calendar component
- [ ] S-1 viewer component
- [ ] IOI submission form
- [ ] Allocation engine
- [ ] Lock-up tracker
- [ ] IPO risk assessment mini-game

### Stage 3 Milestones

- [ ] Tax lot tracking system
- [ ] Wash sale detection
- [ ] Capital gains calculator
- [ ] 1099-B report generator
- [ ] Fee breakdown display
- [ ] Year-end comparison dashboard

---

## Appendix A: Data Schema Specifications

### Ticker Data (OHLCV)

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "data": [
    {
      "date": "2024-01-02",
      "open": 185.23,
      "high": 187.45,
      "low": 184.89,
      "close": 186.78,
      "volume": 45678900,
      "dividendAmount": 0,
      "splitCoefficient": 1
    }
  ],
  "meta": {
    "marketCap": 2890000000000,
    "peRatio": 28.5,
    "dividendYield": 0.52,
    "beta": 1.28
  }
}
```

### IPO Data

```json
{
  "id": "IPO_2024_001",
  "company": "TechCorp Inc.",
  "ticker": "TECH",
  "filingDate": "2024-01-15",
  "expectedDate": "2024-02-20",
  "priceRange": { "low": 18, "high": 22 },
  "sharesOffered": 15000000,
  "useOfProceeds": "General corporate purposes and R&D",
  "riskFactors": [
    { "category": "profitability", "text": "We have never been profitable..." },
    { "category": "concentration", "text": "Our largest customer represents 45%..." }
  ],
  "financials": {
    "revenue": 234000000,
    "revenueGrowth": 0.45,
    "netLoss": -89000000,
    "cashPosition": 156000000
  },
  "outcome": {
    "finalPrice": 24,
    "openPrice": 38,
    "dayOneClose": 32,
    "oversubscription": 15.2
  }
}
```

---

## Appendix B: UI/UX Guidelines

### Terminal Aesthetic Principles

1. **Dark Mode Default:** #0a0a0a background, high-contrast text
2. **Information Density:** Every pixel has purpose
3. **Color Semantics:** Green = gain/buy, Red = loss/sell, Blue = neutral/info
4. **Typography:** Monospace for numbers, sans-serif for labels
5. **No Decorative Elements:** Function over form

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px | Not supported (display warning) |
| 768-1024px | Simplified 2-column |
| 1024-1440px | Standard 3-column |
| > 1440px | Full terminal (4+ columns) |

---

*Document Version: 1.0*  
*Last Updated: 2026-01-16*  
*Author: MarketTerminal Development Team*
