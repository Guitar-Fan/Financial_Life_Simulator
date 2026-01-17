/**
 * Market Store - Global market state management
 * 
 * Manages: Current prices, market replay state, order book simulation
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useMarketStore = create(
  subscribeWithSelector((set, get) => ({
    // Market state
    isPlaying: false,
    playbackSpeed: 1, // 1x, 5x, 10x, 50x
    currentDate: null,
    currentTime: null,
    
    // Ticker data
    tickers: {}, // { AAPL: { price, change, changePercent, bid, ask, volume, ... } }
    tickerIndex: [], // List of available tickers
    selectedTicker: null,
    
    // Historical data for charts
    historicalData: {}, // { AAPL: [{ date, open, high, low, close, volume }, ...] }
    intradayData: {}, // { AAPL: [{ timestamp, price, volume }, ...] }
    
    // Replay state
    replayIndex: 0,
    replayData: null,
    
    // Actions
    setTickerIndex: (index) => set({ tickerIndex: index }),
    
    selectTicker: (symbol) => set({ selectedTicker: symbol }),
    
    setHistoricalData: (symbol, data) => set((state) => ({
      historicalData: { ...state.historicalData, [symbol]: data }
    })),
    
    setIntradayData: (symbol, data) => set((state) => ({
      intradayData: { ...state.intradayData, [symbol]: data }
    })),
    
    updateTicker: (symbol, data) => set((state) => ({
      tickers: {
        ...state.tickers,
        [symbol]: { ...state.tickers[symbol], ...data }
      }
    })),
    
    // Playback controls
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
    
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
    
    setCurrentDateTime: (date, time) => set({ currentDate: date, currentTime: time }),
    
    // Replay management
    setReplayIndex: (index) => set({ replayIndex: index }),
    incrementReplayIndex: () => set((state) => ({ replayIndex: state.replayIndex + 1 })),
    
    // Generate simulated bid/ask from price
    generateQuote: (symbol, price) => {
      const spread = price * 0.001; // 0.1% spread
      const bid = Math.round((price - spread / 2) * 100) / 100;
      const ask = Math.round((price + spread / 2) * 100) / 100;
      
      return { bid, ask, spread: Math.round(spread * 100) / 100 };
    },
    
    // Get current ticker data
    getCurrentTicker: () => {
      const state = get();
      if (!state.selectedTicker) return null;
      return state.tickers[state.selectedTicker] || null;
    },
    
    // Reset market state
    reset: () => set({
      isPlaying: false,
      replayIndex: 0,
      currentDate: null,
      currentTime: null
    })
  }))
);

export default useMarketStore;
