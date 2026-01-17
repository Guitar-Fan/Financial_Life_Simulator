/**
 * Player Store - Player state, portfolio, and progression
 * 
 * Manages: Cash, positions, orders, tax lots, achievements
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMarketStore } from './marketStore';

const INITIAL_CASH = 25000; // PDT threshold - intentional

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      // Account state
      cash: INITIAL_CASH,
      startingCash: INITIAL_CASH,
      
      // Positions: { AAPL: { shares, avgCost, taxLots: [...] } }
      positions: {},
      
      // Orders: [{ id, ticker, side, type, quantity, price, status, timestamp }]
      orders: [],
      orderHistory: [],
      
      // Tax lots for capital gains tracking
      // Each lot: { id, ticker, shares, costBasis, acquiredDate, isWashSale, disallowedLoss }
      taxLots: [],
      
      // Realized gains/losses
      realizedGains: {
        shortTerm: 0,
        longTerm: 0,
        washSaleDisallowed: 0
      },
      
      // Progression
      unlockedTickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM'], // Starting 5
      unlockedOrderTypes: ['MARKET'], // Start with market only
      achievements: [],
      tradesExecuted: 0,
      
      // Actions
      setCash: (amount) => set({ cash: amount }),
      
      adjustCash: (amount) => set((state) => ({ 
        cash: Math.round((state.cash + amount) * 100) / 100 
      })),
      
      // Position management
      updatePosition: (ticker, shares, avgCost) => set((state) => {
        const newPositions = { ...state.positions };
        
        if (shares === 0) {
          delete newPositions[ticker];
        } else {
          newPositions[ticker] = {
            ...newPositions[ticker],
            shares,
            avgCost: Math.round(avgCost * 100) / 100
          };
        }
        
        return { positions: newPositions };
      }),
      
      // Order management

      placeOrder: (order) => {
  let orderId; // Add this variable to capture the ID
  set((state) => {
    const newOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...order,
      status: 'PENDING',
      timestamp: Date.now()
    };
    orderId = newOrder.id; // Capture the ID before returning

    return {
      orders: [...state.orders, newOrder]
    };
  });
  return orderId; // Return the captured ID
},
      
      fillOrder: (orderId, fillPrice, fillQuantity) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        const totalCost = fillPrice * fillQuantity;
        const isBuy = order.side === 'BUY';
        
        // Update cash
        const cashChange = isBuy ? -totalCost : totalCost;
        
        // Update position
        const currentPosition = state.positions[order.ticker] || { shares: 0, avgCost: 0 };
        let newShares, newAvgCost;
        
        if (isBuy) {
          const totalShares = currentPosition.shares + fillQuantity;
          const totalCostBasis = (currentPosition.shares * currentPosition.avgCost) + totalCost;
          newShares = totalShares;
          newAvgCost = totalCostBasis / totalShares;
          
          // Create tax lot
          const newLot = {
            id: `LOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ticker: order.ticker,
            shares: fillQuantity,
            costBasis: fillPrice,
            acquiredDate: new Date().toISOString(),
            isWashSale: false,
            disallowedLoss: 0
          };
          
          set((s) => ({ taxLots: [...s.taxLots, newLot] }));
        } else {
          newShares = currentPosition.shares - fillQuantity;
          newAvgCost = currentPosition.avgCost;
          
          // Process sale against tax lots (FIFO)
          get().processSale(order.ticker, fillQuantity, fillPrice);
        }
        
        set((s) => ({
          cash: Math.round((s.cash + cashChange) * 100) / 100,
          positions: {
            ...Object.fromEntries(
             Object.entries(s.positions).filter(([k]) => k !== order.ticker)
           ),
           ...(newShares > 0 && {
             [order.ticker]: { shares: newShares, avgCost: Math.round(newAvgCost * 100) / 100 }
           })
         },
          orders: s.orders.map(o => 
            o.id === orderId 
              ? { ...o, status: 'FILLED', fillPrice, filledAt: new Date().toISOString() }
              : o
          ),
          orderHistory: [...s.orderHistory, { ...order, status: 'FILLED', fillPrice }],
          tradesExecuted: s.tradesExecuted + 1
        }));
        
        // Check for unlocks with current market prices
        const marketTickers = useMarketStore.getState().tickers;
        get().checkUnlocks(marketTickers);
      },
      
      cancelOrder: (orderId) => set((state) => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: 'CANCELLED' } : o
        )
      })),
      
      // Tax lot processing (FIFO)
      processSale: (ticker, sharesToSell, salePrice) => {
        const state = get();
        let remainingShares = sharesToSell;
        let shortTermGain = 0;
        let longTermGain = 0;
        const updatedLots = [];
        const now = new Date();
        
        // Sort lots by date (FIFO)
        const tickerLots = state.taxLots
          .filter(lot => lot.ticker === ticker && lot.shares > 0)
          .sort((a, b) => new Date(a.acquiredDate) - new Date(b.acquiredDate));
        
        for (const lot of tickerLots) {
          if (remainingShares <= 0) {
            updatedLots.push(lot);
            continue;
          }
          
          const sharesToUse = Math.min(lot.shares, remainingShares);
          const gain = (salePrice - lot.costBasis) * sharesToUse;
          
          // Calculate holding period
          const holdingDays = Math.floor(
            (now - new Date(lot.acquiredDate)) / (1000 * 60 * 60 * 24)
          );
          const isLongTerm = holdingDays > 365;
          
          if (isLongTerm) {
            longTermGain += gain;
          } else {
            shortTermGain += gain;
          }
          
          remainingShares -= sharesToUse;
          
          if (lot.shares > sharesToUse) {
            updatedLots.push({ ...lot, shares: lot.shares - sharesToUse });
          }
          // If lot is fully consumed, don't add it back
        }
        
        // Add any remaining lots
        const otherLots = state.taxLots.filter(lot => lot.ticker !== ticker);
        
        set({
          taxLots: [...otherLots, ...updatedLots],
          realizedGains: {
            ...state.realizedGains,
            shortTerm: state.realizedGains.shortTerm + shortTermGain,
            longTerm: state.realizedGains.longTerm + longTermGain
          }
        });
      },
      
      // Progression unlocks
      checkUnlocks: (tickers = {}) => {
        const state = get();
        const newUnlocks = [];
        
        // Unlock limit orders after 10 trades
        if (state.tradesExecuted >= 10 && !state.unlockedOrderTypes.includes('LIMIT')) {
          newUnlocks.push({ type: 'orderType', value: 'LIMIT' });
        }
        
        // Unlock stop orders after 20 trades
        if (state.tradesExecuted >= 20 && !state.unlockedOrderTypes.includes('STOP')) {
          newUnlocks.push({ type: 'orderType', value: 'STOP' });
        }
        
        // Unlock more tickers at 5% gain
        const portfolioValue = get().getPortfolioValue(tickers);
        const totalValue = state.cash + portfolioValue;
        const gainPercent = ((totalValue - state.startingCash) / state.startingCash) * 100;
        
        if (gainPercent >= 5 && state.unlockedTickers.length === 5) {
          newUnlocks.push({ 
            type: 'tickers', 
            value: ['JNJ', 'V', 'PG', 'UNH', 'HD'] 
          });
        }
        
        // Apply unlocks
        if (newUnlocks.length > 0) {
          set((s) => {
            let newOrderTypes = [...s.unlockedOrderTypes];
            let newTickers = [...s.unlockedTickers];
            
            for (const unlock of newUnlocks) {
              if (unlock.type === 'orderType') {
                newOrderTypes.push(unlock.value);
              } else if (unlock.type === 'tickers') {
                newTickers = [...newTickers, ...unlock.value];
              }
            }
            
            return {
              unlockedOrderTypes: newOrderTypes,
              unlockedTickers: newTickers
            };
          });
        }
      },
      
      // Calculate current portfolio value (unrealized)
      getPortfolioValue: (tickers = {}) => {
        const state = get();
        let portfolioValue = 0;
        
        // Sum up the value of all positions
        for (const [ticker, position] of Object.entries(state.positions)) {
          const currentPrice = tickers[ticker]?.price || 0;
          portfolioValue += position.shares * currentPrice;
        }
        
        return Math.round(portfolioValue * 100) / 100;
      },
      
      // Achievement tracking
      addAchievement: (achievement) => set((state) => ({
        achievements: [...state.achievements, {
          ...achievement,
          earnedAt: new Date().toISOString()
        }]
      })),
      
      // Reset player state
      reset: () => set({
        cash: INITIAL_CASH,
        positions: {},
        orders: [],
        orderHistory: [],
        taxLots: [],
        realizedGains: { shortTerm: 0, longTerm: 0, washSaleDisallowed: 0 },
        unlockedTickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM'],
        unlockedOrderTypes: ['MARKET'],
        achievements: [],
        tradesExecuted: 0
      })
    }),
    {
      name: 'market-terminal-player',
      partialize: (state) => ({
        cash: state.cash,
        positions: state.positions,
        orderHistory: state.orderHistory,
        taxLots: state.taxLots,
        realizedGains: state.realizedGains,
        unlockedTickers: state.unlockedTickers,
        unlockedOrderTypes: state.unlockedOrderTypes,
        achievements: state.achievements,
        tradesExecuted: state.tradesExecuted
      })
    }
  )
);

export default usePlayerStore;
