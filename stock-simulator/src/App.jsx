/**
 * Market Terminal - Main Application
 * 
 * COMPLETE IMPLEMENTATION - ALL STAGES
 * 
 * Stage 1: Secondary Market (Trading Interface)
 * Stage 2: Primary Market (IPO Calendar, S-1 Analysis, IOI Submission)
 * Stage 3: Reality Layer (Taxes, Fees, Friction)
 * Stage 4: Educational Integration (Tutorials, Achievements, Tooltips)
 * 
 * The terminal supports three modes:
 * - TRADING: Secondary market operations (buy/sell existing securities)
 * - IPO: Primary market operations (analyze and bid on new offerings)
 * - TAX: Tax reporting, fee analysis, and educational content
 */

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import our stores and hooks
import { useMarketStore } from './stores/marketStore';
import { usePlayerStore } from './stores/playerStore';
import { useIPOStore } from './stores/ipoStore';
import { useMarketReplay } from './hooks/useMarketReplay';

// Import terminal components (Stage 1)
import { Header } from './components/terminal/Header';
import { ChartPanel } from './components/terminal/ChartPanel';
import { OrderPanel } from './components/terminal/OrderPanel';
import { WatchlistPanel } from './components/terminal/WatchlistPanel';
import { PositionsPanel } from './components/terminal/PositionsPanel';
import { OrderBookPanel } from './components/terminal/OrderBookPanel';

// Import IPO components (Stage 2)
import { IPOCalendarPanel } from './components/ipo/IPOCalendarPanel';
import { S1ViewerPanel } from './components/ipo/S1ViewerPanel';
import { IOIPanel } from './components/ipo/IOIPanel';

// Import Tax components (Stage 3)
import { TaxDashboard } from './components/tax/TaxDashboard';
import { TaxLotViewer } from './components/tax/TaxLotViewer';
import { FeeTransparencyPanel } from './components/tax/FeeTransparencyPanel';
import { WashSaleAlert } from './components/tax/WashSaleAlert';

// Import Education components (Stage 4)
import { AchievementPanel } from './components/education/AchievementPanel';
import { TutorialListPanel } from './components/education/TutorialSystem';
import { GuidedMissionsPanel } from './components/education/GuidedMissions';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Default layout configuration for the terminal panels
 * 
 * Design Decision: We use a 12-column grid at large breakpoints,
 * mimicking professional terminals like Bloomberg or Thinkorswim.
 * Each panel is draggable and resizable, allowing users to customize
 * their workspace - a key feature of real trading platforms.
 */
const tradingLayouts = {
  lg: [
    { i: 'chart', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 6 },
    { i: 'orderbook', x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'order', x: 8, y: 6, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'watchlist', x: 0, y: 12, w: 4, h: 8, minW: 2, minH: 4 },
    { i: 'positions', x: 4, y: 12, w: 8, h: 8, minW: 4, minH: 4 }
  ],
  md: [
    { i: 'chart', x: 0, y: 0, w: 8, h: 10, minW: 4, minH: 6 },
    { i: 'orderbook', x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'order', x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'watchlist', x: 0, y: 10, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'positions', x: 4, y: 10, w: 8, h: 6, minW: 4, minH: 4 }
  ],
  sm: [
    { i: 'chart', x: 0, y: 0, w: 6, h: 8 },
    { i: 'order', x: 0, y: 8, w: 6, h: 6 },
    { i: 'orderbook', x: 0, y: 14, w: 3, h: 6 },
    { i: 'watchlist', x: 3, y: 14, w: 3, h: 6 },
    { i: 'positions', x: 0, y: 20, w: 6, h: 6 }
  ]
};

/**
 * IPO Mode layout configuration
 * Three-panel layout: Calendar, S-1 Viewer, IOI Submission
 */
const ipoLayouts = {
  lg: [
    { i: 'ipo-calendar', x: 0, y: 0, w: 4, h: 20, minW: 3, minH: 10 },
    { i: 's1-viewer', x: 4, y: 0, w: 5, h: 20, minW: 4, minH: 10 },
    { i: 'ioi-panel', x: 9, y: 0, w: 3, h: 20, minW: 3, minH: 10 }
  ],
  md: [
    { i: 'ipo-calendar', x: 0, y: 0, w: 4, h: 16, minW: 3, minH: 8 },
    { i: 's1-viewer', x: 4, y: 0, w: 5, h: 16, minW: 4, minH: 8 },
    { i: 'ioi-panel', x: 9, y: 0, w: 3, h: 16, minW: 3, minH: 8 }
  ],
  sm: [
    { i: 'ipo-calendar', x: 0, y: 0, w: 6, h: 10 },
    { i: 's1-viewer', x: 0, y: 10, w: 6, h: 12 },
    { i: 'ioi-panel', x: 0, y: 22, w: 6, h: 10 }
  ]
};

/**
 * Tax Mode layout configuration (Stage 3)
 * Four-panel layout: Dashboard, Tax Lots, Fees, Wash Sales + Achievements
 */
const taxLayouts = {
  lg: [
    { i: 'tax-dashboard', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'tax-lots', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: 'fee-panel', x: 0, y: 12, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'wash-sale', x: 4, y: 12, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'achievements', x: 8, y: 12, w: 4, h: 8, minW: 3, minH: 6 }
  ],
  md: [
    { i: 'tax-dashboard', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
    { i: 'tax-lots', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
    { i: 'fee-panel', x: 0, y: 10, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'wash-sale', x: 4, y: 10, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'achievements', x: 8, y: 10, w: 4, h: 8, minW: 3, minH: 6 }
  ],
  sm: [
    { i: 'tax-dashboard', x: 0, y: 0, w: 6, h: 10 },
    { i: 'tax-lots', x: 0, y: 10, w: 6, h: 10 },
    { i: 'fee-panel', x: 0, y: 20, w: 6, h: 8 },
    { i: 'wash-sale', x: 0, y: 28, w: 6, h: 8 },
    { i: 'achievements', x: 0, y: 36, w: 6, h: 8 }
  ]
};

// Terminal modes
const MODES = {
  TRADING: 'TRADING',
  IPO: 'IPO',
  TAX: 'TAX'
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState(MODES.TRADING);
  const [tradingLayoutState, setTradingLayoutState] = useState(tradingLayouts);
  const [ipoLayoutState, setIpoLayoutState] = useState(ipoLayouts);
  const [taxLayoutState, setTaxLayoutState] = useState(taxLayouts);
  
  // Market state
  const { 
    isPlaying, 
    selectedTicker, 
    currentDate, 
    currentTime,
    tickerIndex,
    selectTicker 
  } = useMarketStore();
  
  // Player state
  const { cash, positions } = usePlayerStore();
  
  // IPO state
  const { setIPOCalendar } = useIPOStore();
  
  // Market replay engine
  const { initialize } = useMarketReplay();

  /**
   * Initialize market data on mount
   * 
   * This loads all static JSON data and prepares the replay engine.
   * In a real app with live data, this would establish WebSocket connections.
   * Our architecture allows swapping data sources by modifying useMarketReplay.
   */
  useEffect(() => {
    async function init() {
      try {
        await initialize();
        // Select first ticker by default
        const store = useMarketStore.getState();
        if (store.tickerIndex.length > 0 && !store.selectedTicker) {
          selectTicker(store.tickerIndex[0].symbol);
        }
        
        // Load IPO data
        await loadIPOData(setIPOCalendar);
      } catch (error) {
        console.error('Failed to initialize market data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [initialize, selectTicker, setIPOCalendar]);

  /**
   * Handle layout changes - persist to localStorage by mode
   */
  const onLayoutChange = (currentLayout, allLayouts) => {
    if (mode === MODES.TRADING) {
      setTradingLayoutState(allLayouts);
      localStorage.setItem('terminal-layouts-trading', JSON.stringify(allLayouts));
    } else if (mode === MODES.IPO) {
      setIpoLayoutState(allLayouts);
      localStorage.setItem('terminal-layouts-ipo', JSON.stringify(allLayouts));
    } else if (mode === MODES.TAX) {
      setTaxLayoutState(allLayouts);
      localStorage.setItem('terminal-layouts-tax', JSON.stringify(allLayouts));
    }
  };

  // Load saved layouts on mount
  useEffect(() => {
    const savedTrading = localStorage.getItem('terminal-layouts-trading');
    const savedIPO = localStorage.getItem('terminal-layouts-ipo');
    const savedTax = localStorage.getItem('terminal-layouts-tax');
    
    if (savedTrading) {
      try {
        setTradingLayoutState(JSON.parse(savedTrading));
      } catch (e) {
        console.warn('Failed to parse saved trading layouts');
      }
    }
    
    if (savedIPO) {
      try {
        setIpoLayoutState(JSON.parse(savedIPO));
      } catch (e) {
        console.warn('Failed to parse saved IPO layouts');
      }
    }
    
    if (savedTax) {
      try {
        setTaxLayoutState(JSON.parse(savedTax));
      } catch (e) {
        console.warn('Failed to parse saved tax layouts');
      }
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Get current layouts based on mode
  const currentLayouts = mode === MODES.TRADING 
    ? tradingLayoutState 
    : mode === MODES.IPO 
      ? ipoLayoutState 
      : taxLayoutState;

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* Top Navigation & Status Bar */}
      <Header 
        currentDate={currentDate}
        currentTime={currentTime}
        isPlaying={isPlaying}
        cash={cash}
        mode={mode}
        onModeChange={setMode}
      />
      
      {/* Main Terminal Grid */}
      <main className="flex-1 p-2 overflow-hidden flex gap-2">
        {/* Guided Missions Panel (Beginner Mode only — floats on the right) */}
        <div className="flex-1 overflow-hidden">
        <ResponsiveGridLayout
          className="layout"
          layouts={currentLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 12, sm: 6 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          margin={[8, 8]}
        >
          {mode === MODES.TRADING && [
              <div key="chart" className="terminal-panel" data-tutorial="chart">
                <ChartPanel />
              </div>,
              <div key="orderbook" className="terminal-panel">
                <OrderBookPanel />
              </div>,
              <div key="order" className="terminal-panel" data-tutorial="order-panel">
                <OrderPanel />
              </div>,
              <div key="watchlist" className="terminal-panel" data-tutorial="watchlist">
                <WatchlistPanel />
              </div>,
              <div key="positions" className="terminal-panel">
                <PositionsPanel />
              </div>
          ]}
          
          {mode === MODES.IPO && [
              <div key="ipo-calendar" className="terminal-panel" data-tutorial="ipo-calendar">
                <IPOCalendarPanel />
              </div>,
              <div key="s1-viewer" className="terminal-panel" data-tutorial="s1-viewer">
                <S1ViewerPanel />
              </div>,
              <div key="ioi-panel" className="terminal-panel" data-tutorial="ioi-panel">
                <IOIPanel />
              </div>
          ]}
          
          {mode === MODES.TAX && [
              <div key="tax-dashboard" className="terminal-panel">
                <TaxDashboard />
              </div>,
              <div key="tax-lots" className="terminal-panel" data-tutorial="tax-lots">
                <TaxLotViewer />
              </div>,
              <div key="fee-panel" className="terminal-panel">
                <FeeTransparencyPanel />
              </div>,
              <div key="wash-sale" className="terminal-panel">
                <WashSaleAlert />
              </div>,
              <div key="achievements" className="terminal-panel">
                <AchievementPanel />
              </div>
          ]}
        </ResponsiveGridLayout>
        </div>
        {/* Guided Missions sidebar — visible in beginner mode */}
        <div className="w-72 flex-shrink-0 overflow-auto hidden lg:block">
          <GuidedMissionsPanel />
        </div>
      </main>
      
      {/* Status Bar */}
      <StatusBar mode={mode} />
    </div>
  );
}

/**
 * Load IPO calendar data from static JSON or generate demo data
 */
async function loadIPOData(setIPOCalendar) {
  try {
    const response = await fetch('/data/ipos/ipo_calendar.json');
    const contentType = response.headers.get('content-type');
    
    if (!response.ok || !contentType?.includes('application/json')) {
      throw new Error('IPO data not found');
    }
    
    const data = await response.json();
    setIPOCalendar(data);
  } catch (error) {
    // Generate demo IPO data
    console.log('Using demo IPO data');
    setIPOCalendar(generateDemoIPOCalendar());
  }
}

/**
 * Generate demo IPO calendar for development
 */
function generateDemoIPOCalendar() {
  return [
    {
      id: 'IPO_2024_001',
      company: 'CloudScale Technologies',
      ticker: 'CLDS',
      sector: 'Technology / Cloud Infrastructure',
      filingDate: '2024-02-01',
      expectedDate: '2024-03-15',
      priceRange: { low: 22, high: 26 },
      sharesOffered: 12000000,
      status: 'PRICING',
      useOfProceeds: 'Expansion of cloud infrastructure, R&D investment, and general corporate purposes.',
      businessDescription: 'CloudScale provides enterprise-grade cloud infrastructure solutions to Fortune 500 companies.',
      riskFactors: [
        { category: 'profitability', severity: 'high', text: 'We have incurred net losses in each year since inception. Our accumulated deficit as of December 31, 2023 was $234 million. We may never achieve profitability.' },
        { category: 'competition', severity: 'medium', text: 'We compete with established players including AWS, Azure, and Google Cloud who have significantly greater resources and market presence.' },
        { category: 'concentration', severity: 'high', text: 'Our top three customers represented 67% of our revenue in 2023. Loss of any major customer could materially harm our business.' }
      ],
      financials: {
        revenue: 189000000,
        revenueGrowth: 0.78,
        grossMargin: 0.62,
        netLoss: -67000000,
        cashPosition: 145000000,
        burnRate: 8500000
      },
      outcome: null
    },
    {
      id: 'IPO_2024_002',
      company: 'BioGenesis Therapeutics',
      ticker: 'BGTX',
      sector: 'Healthcare / Biotechnology',
      filingDate: '2024-04-10',
      expectedDate: '2024-05-20',
      priceRange: { low: 16, high: 19 },
      sharesOffered: 8000000,
      status: 'UPCOMING',
      useOfProceeds: 'Phase 3 clinical trials for our lead oncology candidate and regulatory submissions.',
      businessDescription: 'BioGenesis is a clinical-stage biotechnology company developing novel cancer therapeutics.',
      riskFactors: [
        { category: 'regulatory', severity: 'high', text: 'Our lead product candidate has not received FDA approval. Clinical trials may fail to demonstrate safety or efficacy required for approval.' },
        { category: 'profitability', severity: 'high', text: 'We have never generated revenue from product sales and may never achieve profitability. We expect losses to continue for the foreseeable future.' },
        { category: 'dilution', severity: 'medium', text: 'We expect to issue additional equity securities to fund our operations, which will dilute existing shareholders.' }
      ],
      financials: {
        revenue: 0,
        revenueGrowth: 0,
        grossMargin: 0,
        netLoss: -89000000,
        cashPosition: 78000000,
        burnRate: 12000000
      },
      outcome: null
    },
    {
      id: 'IPO_2024_003',
      company: 'ElectroMotive Systems',
      ticker: 'EMOT',
      sector: 'Automotive / Electric Vehicles',
      filingDate: '2024-01-05',
      expectedDate: '2024-02-18',
      priceRange: { low: 32, high: 38 },
      sharesOffered: 20000000,
      status: 'COMPLETED',
      useOfProceeds: 'Manufacturing facility expansion, supply chain development, and working capital.',
      businessDescription: 'ElectroMotive designs and manufactures electric commercial vehicles for fleet operators.',
      riskFactors: [
        { category: 'execution', severity: 'medium', text: 'We have limited manufacturing experience at scale. Production delays or quality issues could materially impact our business.' },
        { category: 'competition', severity: 'high', text: 'The EV market is intensely competitive with well-funded incumbents including Tesla, Rivian, and traditional automakers.' },
        { category: 'supply_chain', severity: 'medium', text: 'We depend on a limited number of suppliers for battery cells and semiconductor components.' }
      ],
      financials: {
        revenue: 456000000,
        revenueGrowth: 1.23,
        grossMargin: 0.18,
        netLoss: -156000000,
        cashPosition: 890000000,
        burnRate: 45000000
      },
      outcome: {
        finalPrice: 36,
        openPrice: 52,
        dayOneClose: 48.75,
        oversubscription: 18.3
      }
    },
    {
      id: 'IPO_2024_004',
      company: 'SecureNet AI',
      ticker: 'SNAI',
      sector: 'Technology / Cybersecurity',
      filingDate: '2024-03-20',
      expectedDate: '2024-04-25',
      priceRange: { low: 28, high: 32 },
      sharesOffered: 10000000,
      status: 'PRICING',
      useOfProceeds: 'Product development, sales and marketing expansion, and potential acquisitions.',
      businessDescription: 'SecureNet AI provides AI-powered cybersecurity solutions for enterprise customers.',
      riskFactors: [
        { category: 'competition', severity: 'high', text: 'The cybersecurity market is highly competitive with numerous established vendors. Our AI-based approach may not achieve market acceptance.' },
        { category: 'profitability', severity: 'medium', text: 'While we have achieved profitability in recent quarters, we may return to losses as we invest in growth.' },
        { category: 'concentration', severity: 'medium', text: 'Government contracts represent 35% of our revenue and are subject to political and budgetary uncertainty.' }
      ],
      financials: {
        revenue: 234000000,
        revenueGrowth: 0.56,
        grossMargin: 0.71,
        netIncome: 12000000,
        cashPosition: 67000000,
        burnRate: 0
      },
      outcome: null
    }
  ];
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-terminal-bg">
      <div className="text-terminal-accent text-2xl font-mono mb-4">
        MARKET TERMINAL
      </div>
      <div className="text-terminal-muted text-sm font-mono">
        Initializing market data...
      </div>
      <div className="mt-4 w-48 h-1 bg-terminal-border rounded overflow-hidden">
        <div className="h-full bg-terminal-accent animate-pulse" 
             style={{ width: '60%' }} />
      </div>
    </div>
  );
}

/**
 * Status Bar - Bottom of screen market status
 */
function StatusBar({ mode }) {
  const { isPlaying, playbackSpeed, replayIndex } = useMarketStore();
  const { ipoCalendar, playerIOIs } = useIPOStore();
  const { realizedGains, tradesExecuted } = usePlayerStore();
  
  const pendingIOIs = Object.values(playerIOIs).filter(ioi => ioi.status === 'PENDING').length;
  const pricingIPOs = ipoCalendar.filter(ipo => ipo.status === 'PRICING').length;
  const totalRealized = realizedGains.shortTerm + realizedGains.longTerm;
  
  const getModeLabel = () => {
    switch (mode) {
      case 'TRADING': return 'Secondary Market';
      case 'IPO': return 'Primary Market (IPO)';
      case 'TAX': return 'Tax Center';
      default: return mode;
    }
  };
  
  return (
    <footer className="h-6 px-4 flex items-center justify-between bg-terminal-surface border-t border-terminal-border text-xxs font-mono text-terminal-muted">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className={`status-dot ${isPlaying ? 'status-live' : 'status-paused'}`} />
          {isPlaying ? 'LIVE' : 'PAUSED'}
        </span>
        <span>Speed: {playbackSpeed}x</span>
        <span>Tick: {replayIndex}</span>
        {mode === 'IPO' && (
          <>
            <span className="border-l border-terminal-border pl-4">
              IPOs Pricing: {pricingIPOs}
            </span>
            <span>Pending IOIs: {pendingIOIs}</span>
          </>
        )}
        {mode === 'TAX' && (
          <>
            <span className="border-l border-terminal-border pl-4">
              Trades: {tradesExecuted}
            </span>
            <span className={totalRealized >= 0 ? 'text-gain' : 'text-loss'}>
              Realized: {totalRealized >= 0 ? '+' : ''}${totalRealized.toFixed(2)}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>Market Terminal v1.0.0</span>
        <span>{getModeLabel()}</span>
      </div>
    </footer>
  );
}

export default App;
