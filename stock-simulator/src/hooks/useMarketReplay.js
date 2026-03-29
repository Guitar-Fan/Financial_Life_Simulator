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
    setReplayIndex,
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
        // Loop instead of pausing to mimic a market that keeps moving.
        setReplayIndex(0);
        const firstTick = ticks[0];
        if (firstTick) {
          processTick(selectedTicker, firstTick);
          incrementReplayIndex();
        }
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
  }, [isPlaying, playbackSpeed, selectedTicker, processTick, setReplayIndex, incrementReplayIndex]);

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
    const totalMinutes = 390;
    const dayRange = Math.max(high - low, open * 0.008);
    const patternProfile = pickIntradayPattern(open, close);
    let currentPrice = open;
    
    for (let minute = 0; minute < totalMinutes; minute++) {
      const progress = minute / (totalMinutes - 1);
      const anchorPrice = patternProfile(open, close, dayRange, progress);
      const volatilityCurve = 0.7 + Math.abs(progress - 0.5) * 1.8;
      const drift = (anchorPrice - currentPrice) * (0.24 + Math.random() * 0.12);
      const noise = randomNormal() * dayRange * (0.018 + volatilityCurve * 0.05);
      const shock = Math.random() < 0.035
        ? randomNormal() * dayRange * (0.09 + volatilityCurve * 0.12)
        : 0;

      currentPrice = Math.max(1, currentPrice + drift + noise + shock);

      // Softly pull the stream toward day's broad range while still allowing noisy excursions.
      const softTop = high + dayRange * 0.2;
      const softBottom = Math.max(1, low - dayRange * 0.2);
      currentPrice = Math.max(softBottom, Math.min(softTop, currentPrice));

      const wickSpan = Math.abs(randomNormal()) * dayRange * (0.008 + volatilityCurve * 0.03);
      const tickHigh = Math.max(currentPrice, currentPrice + wickSpan * (0.6 + Math.random() * 0.9));
      const tickLow = Math.max(0.01, Math.min(currentPrice, currentPrice - wickSpan * (0.6 + Math.random() * 0.9)));

      const volumeBase = (volume / totalMinutes) * (1 + Math.abs(progress - 0.5) * 2.2);
      const volumeSpike = Math.random() < 0.04 ? 1.3 + Math.random() * 1.9 : 0;
      const minuteVolume = Math.round(volumeBase * (0.75 + Math.random() * 0.95 + volumeSpike));
      
      ticks.push({
        timestamp: `${date}T${formatMarketTime(minute)}`,
        price: Math.round(currentPrice * 100) / 100,
        high: Math.round(tickHigh * 100) / 100,
        low: Math.round(tickLow * 100) / 100,
        volume: minuteVolume
      });

      // Mean reversion pressure after sharp moves keeps paths believable.
      currentPrice += (anchorPrice - currentPrice) * 0.08;
    }
  }
  
  return ticks;
}

function formatMarketTime(minutesSinceOpen) {
  const hour = Math.floor(minutesSinceOpen / 60) + 9;
  const minute = (minutesSinceOpen % 60) + 30;
  const adjustedHour = minute >= 60 ? hour + 1 : hour;
  const adjustedMinute = minute % 60;
  return `${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinute).padStart(2, '0')}:00`;
}

function pickIntradayPattern(open, close) {
  const direction = close >= open ? 1 : -1;
  const rand = Math.random();

  if (rand < 0.26) {
    // Trend day: broad directional move with shallow pullbacks.
    return (o, c, range, p) => o + (c - o) * p + direction * Math.sin(p * Math.PI * 1.6) * range * 0.08;
  }

  if (rand < 0.48) {
    // Mean-reversion day: overshoots in both directions around a fair value.
    return (o, c, range, p) => {
      const center = o + (c - o) * p;
      return center + Math.sin(p * Math.PI * 3.4) * range * 0.22 - direction * Math.sin(p * Math.PI) * range * 0.07;
    };
  }

  if (rand < 0.7) {
    // Breakout day: compression then directional expansion.
    return (o, c, range, p) => {
      const preBreakout = o + (c - o) * Math.min(p, 0.45) * 0.35;
      if (p < 0.45) {
        return preBreakout + Math.sin(p * Math.PI * 6) * range * 0.04;
      }
      const post = (p - 0.45) / 0.55;
      return preBreakout + (c - preBreakout) * post + direction * Math.sin(post * Math.PI * 2.1) * range * 0.1;
    };
  }

  if (rand < 0.86) {
    // Opening drive then afternoon fade/continuation.
    return (o, c, range, p) => {
      const drive = o + direction * range * 0.28 * Math.sin(p * Math.PI * 1.15);
      return drive + (c - drive) * Math.pow(p, 1.35);
    };
  }

  // Choppy rotational session.
  return (o, c, range, p) => {
    const mid = o + (c - o) * p;
    return mid + Math.sin(p * Math.PI * 7.5) * range * 0.16 + Math.sin(p * Math.PI * 1.4) * range * 0.05;
  };
}

function randomNormal() {
  let u = 0;
  let v = 0;

  while (u === 0) {
    u = Math.random();
  }
  while (v === 0) {
    v = Math.random();
  }

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export default useMarketReplay;
