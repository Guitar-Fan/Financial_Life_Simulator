/**
 * Market Terminal - Main Application
 * 
 * ITERATIVE IMPLEMENTATION - STAGE 1
 * 
 * Step 1: Basic Terminal Layout
 * This initial version establishes the professional terminal grid layout
 * using react-grid-layout. We create placeholder panels that will be
 * populated with actual functionality in subsequent iterations.
 */

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import our stores and hooks
import { useMarketStore } from './stores/marketStore';
import { usePlayerStore } from './stores/playerStore';
import { useMarketReplay } from './hooks/useMarketReplay';

// Import components (we'll create these next)
import { Header } from './components/terminal/Header';
import { ChartPanel } from './components/terminal/ChartPanel';
import { OrderPanel } from './components/terminal/OrderPanel';
import { WatchlistPanel } from './components/terminal/WatchlistPanel';
import { PositionsPanel } from './components/terminal/PositionsPanel';
import { OrderBookPanel } from './components/terminal/OrderBookPanel';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Default layout configuration for the terminal panels
 * 
 * Design Decision: We use a 12-column grid at large breakpoints,
 * mimicking professional terminals like Bloomberg or Thinkorswim.
 * Each panel is draggable and resizable, allowing users to customize
 * their workspace - a key feature of real trading platforms.
 */
const defaultLayouts = {
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

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [layouts, setLayouts] = useState(defaultLayouts);
  
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
      } catch (error) {
        console.error('Failed to initialize market data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [initialize, selectTicker]);

  /**
   * Handle layout changes - persist to localStorage
   */
  const onLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('terminal-layouts', JSON.stringify(allLayouts));
  };

  // Load saved layouts on mount
  useEffect(() => {
    const saved = localStorage.getItem('terminal-layouts');
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved layouts');
      }
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* Top Navigation & Status Bar */}
      <Header 
        currentDate={currentDate}
        currentTime={currentTime}
        isPlaying={isPlaying}
        cash={cash}
      />
      
      {/* Main Terminal Grid */}
      <main className="flex-1 p-2 overflow-hidden">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 12, sm: 6 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          margin={[8, 8]}
        >
          {/* Chart Panel - Primary focus */}
          <div key="chart" className="terminal-panel">
            <ChartPanel />
          </div>
          
          {/* Order Book - Bid/Ask depth */}
          <div key="orderbook" className="terminal-panel">
            <OrderBookPanel />
          </div>
          
          {/* Order Entry - Trade execution */}
          <div key="order" className="terminal-panel">
            <OrderPanel />
          </div>
          
          {/* Watchlist - Ticker monitoring */}
          <div key="watchlist" className="terminal-panel">
            <WatchlistPanel />
          </div>
          
          {/* Positions - Portfolio overview */}
          <div key="positions" className="terminal-panel">
            <PositionsPanel />
          </div>
        </ResponsiveGridLayout>
      </main>
      
      {/* Status Bar */}
      <StatusBar />
    </div>
  );
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
function StatusBar() {
  const { isPlaying, playbackSpeed, replayIndex } = useMarketStore();
  
  return (
    <footer className="h-6 px-4 flex items-center justify-between bg-terminal-surface border-t border-terminal-border text-xxs font-mono text-terminal-muted">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className={`status-dot ${isPlaying ? 'status-live' : 'status-paused'}`} />
          {isPlaying ? 'LIVE' : 'PAUSED'}
        </span>
        <span>Speed: {playbackSpeed}x</span>
        <span>Tick: {replayIndex}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Market Terminal v0.1.0</span>
        <span>Stage 1: Secondary Market</span>
      </div>
    </footer>
  );
}

export default App;
