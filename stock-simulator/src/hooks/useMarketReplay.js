/**
 * useMarketReplay - Core market simulation engine
 * 
 * This hook manages the "replay" of historical market data, simulating
 * live market conditions by stepping through pre-seeded tick data.
 * 
 * Design Philosophy:
 * - NO live API calls at runtime
 * - Reads from static JSON in /public/data
 * - Configurable playback speed
 * - Emits tick events for chart/price updates
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '../stores/marketStore';

// Playback interval in ms at 1x speed (simulates 1 minute per second)
const BASE_INTERVAL = 1000;

export function useMarketReplay() {
  const intervalRef = useRef(null);
  const tickDataRef = useRef({});
  
  const {
    isPlaying,
    playbackSpeed,
    replayIndex,
    selectedTicker,
    tickerIndex,
    setTickerIndex,
    setHistoricalData,
    setIntradayData,
    updateTicker,
    incrementReplayIndex,
    setCurrentDateTime,
    generateQuote
  } = useMarketStore();

  /**
   * Load ticker index from static JSON
   * Falls back to demo data if files don't exist (development mode)
   */
  const loadTickerIndex = useCallback(async () => {
    try {
      const response = await fetch('/data/ticker_index.json');
      // Check if we got HTML back (404 returns index.html in Vite)
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error('Data files not found - using demo data');
      }
      const data = await response.json();
      setTickerIndex(data);
      return data;
    } catch (error) {
      console.log('Using demo ticker data (run `npm run seed` to generate real data)');
      // Return AND set demo data if file doesn't exist
      const demoData = getDemoTickerIndex();
      setTickerIndex(demoData);
      return demoData;
    }
  }, [setTickerIndex]);

  /**
   * Load historical daily data for a ticker
   * Falls back to generated demo data if files don't exist
   */
  const loadHistoricalData = useCallback(async (symbol) => {
    try {
      const response = await fetch(`/data/tickers/${symbol}.json`);
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error(`Data file not found for ${symbol}`);
      }
      const data = await response.json();
      setHistoricalData(symbol, data.data);
      return data;
    } catch (error) {
      // Silently generate demo data - this is expected in dev without seeding
      const demoData = generateDemoHistoricalData(symbol);
      setHistoricalData(symbol, demoData);
      return { data: demoData };
    }
  }, [setHistoricalData]);

  /**
   * Load intraday tick data for replay
   * Falls back to generated demo ticks if files don't exist
   */
  const loadIntradayData = useCallback(async (symbol) => {
    try {
      const response = await fetch(`/data/intraday/${symbol}_ticks.json`);
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error(`Intraday data not found for ${symbol}`);
      }
      const data = await response.json();
      tickDataRef.current[symbol] = data.ticks;
      setIntradayData(symbol, data.ticks);
      return data.ticks;
    } catch (error) {
      // Silently generate demo ticks - this is expected in dev without seeding
      const demoTicks = generateDemoIntradayTicks(symbol);
      tickDataRef.current[symbol] = demoTicks;
      setIntradayData(symbol, demoTicks);
      return demoTicks;
    }
  }, [setIntradayData]);

  /**
   * Process a single tick - update price, generate quote
   */
  const processTick = useCallback((symbol, tick) => {
    const quote = generateQuote(symbol, tick.price);
    
    updateTicker(symbol, {
      price: tick.price,
      ...quote,
      volume: tick.volume,
      lastUpdate: tick.timestamp
    });
    
    // Parse timestamp for display
    const [date, time] = tick.timestamp.split('T');
    setCurrentDateTime(date, time?.replace(':00', '') || '09:30');
  }, [generateQuote, updateTicker, setCurrentDateTime]);

  /**
   * Main replay loop
   */
  useEffect(() => {
    if (!isPlaying || !selectedTicker) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const ticks = tickDataRef.current[selectedTicker];
    if (!ticks || ticks.length === 0) return;

    const interval = BASE_INTERVAL / playbackSpeed;
    
    intervalRef.current = setInterval(() => {
      const currentIndex = useMarketStore.getState().replayIndex;
      
      if (currentIndex >= ticks.length) {
        // End of data - loop or stop
        useMarketStore.getState().pause();
        return;
      }
      
      const tick = ticks[currentIndex];
      processTick(selectedTicker, tick);
      incrementReplayIndex();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, selectedTicker, processTick, incrementReplayIndex]);

  /**
   * Initialize market data
   */
  const initialize = useCallback(async () => {
    const index = await loadTickerIndex();
    
    // Load data for all tickers
    const loadPromises = index.map(async (ticker) => {
      await loadHistoricalData(ticker.symbol);
      await loadIntradayData(ticker.symbol);
      
      // Set initial price
      const ticks = tickDataRef.current[ticker.symbol];
      if (ticks && ticks.length > 0) {
        processTick(ticker.symbol, ticks[0]);
      }
    });
    
    await Promise.all(loadPromises);
  }, [loadTickerIndex, loadHistoricalData, loadIntradayData, processTick]);

  /**
   * Jump to specific point in time
   */
  const seekTo = useCallback((index) => {
    useMarketStore.getState().setReplayIndex(index);
    
    const ticks = tickDataRef.current[selectedTicker];
    if (ticks && ticks[index]) {
      processTick(selectedTicker, ticks[index]);
    }
  }, [selectedTicker, processTick]);

  return {
    initialize,
    loadHistoricalData,
    loadIntradayData,
    seekTo,
    tickData: tickDataRef.current
  };
}

// Demo data generators for when static files aren't available

function getDemoTickerIndex() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', latestPrice: 185.50, volatility: 25.3 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', latestPrice: 378.25, volatility: 22.1 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', latestPrice: 141.80, volatility: 28.7 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', latestPrice: 153.40, volatility: 31.2 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', latestPrice: 172.15, volatility: 24.5 }
  ];
}

function generateDemoHistoricalData(symbol) {
  const startPrices = { AAPL: 185, MSFT: 375, GOOGL: 140, AMZN: 150, JPM: 170 };
  let price = startPrices[symbol] || 100;
  const data = [];
  const startDate = new Date('2024-01-02');
  
  for (let i = 0; i < 252; i++) { // ~1 year of trading days
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i * 1.4)); // Skip weekends roughly
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(10000000 + Math.random() * 50000000)
    });
    
    price = close;
  }
  
  return data;
}

function generateDemoIntradayTicks(symbol) {
  const historicalData = generateDemoHistoricalData(symbol);
  const ticks = [];
  
  // Generate ticks for last 5 days only (demo)
  const recentDays = historicalData.slice(-5);
  
  for (const day of recentDays) {
    const { date, open, high, low, close, volume } = day;
    let currentPrice = open;
    
    for (let minute = 0; minute < 390; minute++) {
      const progress = minute / 390;
      const targetPrice = open + (close - open) * progress;
      const noise = (Math.random() - 0.5) * (high - low) * 0.1;
      
      currentPrice = currentPrice * 0.7 + targetPrice * 0.3 + noise;
      currentPrice = Math.max(low, Math.min(high, currentPrice));
      
      const hour = Math.floor(minute / 60) + 9;
      const min = (minute % 60) + 30;
      const adjustedHour = min >= 60 ? hour + 1 : hour;
      const adjustedMin = min % 60;
      
      ticks.push({
        timestamp: `${date}T${String(adjustedHour).padStart(2, '0')}:${String(adjustedMin).padStart(2, '0')}:00`,
        price: Math.round(currentPrice * 100) / 100,
        volume: Math.round((volume / 390) * (1 + Math.abs(progress - 0.5) * 2))
      });
    }
  }
  
  return ticks;
}

export default useMarketReplay;
