/**
 * Slippage & Execution Simulation
 * 
 * Models the real-world costs of executing trades:
 * - Bid/Ask spread impact
 * - Market impact (large orders move prices)
 * - Execution delay simulation
 * 
 * Educational Purpose: Shows why paper trading profits often don't
 * translate to real-world results. "Slippage" is the silent killer.
 */

/**
 * Calculate estimated slippage in basis points
 * 
 * Factors:
 * - Order size relative to average volume (market impact)
 * - Current spread (liquidity indicator)
 * - Time of day (opening/closing = higher volatility)
 * - Order type (market orders have guaranteed fill but uncertain price)
 * 
 * @param {Object} params
 * @returns {number} Slippage in basis points (1 bp = 0.01%)
 */
export function calculateSlippage({
  orderShares,
  avgDailyVolume,
  currentSpread,
  currentPrice,
  orderType = 'MARKET',
  timeOfDay = 'NORMAL' // OPEN, NORMAL, CLOSE
}) {
  // Base slippage from spread (you pay half the spread)
  const spreadBps = (currentSpread / currentPrice) * 10000 / 2;

  // Market impact - larger orders relative to volume have more impact
  const volumeRatio = orderShares / (avgDailyVolume || 1000000);
  const marketImpactBps = volumeRatio * 1000; // 0.1% impact per 1% of daily volume

  // Time of day adjustment
  const timeMultiplier = {
    OPEN: 2.0,   // First 30 minutes: high volatility
    CLOSE: 1.5,  // Last 30 minutes: moderate volatility
    NORMAL: 1.0
  }[timeOfDay] || 1.0;

  // Order type adjustment
  const typeMultiplier = orderType === 'MARKET' ? 1.0 : 0.0; // Limit orders have no slippage

  const totalSlippage = (spreadBps + marketImpactBps) * timeMultiplier * typeMultiplier;

  return {
    totalBps: Math.round(totalSlippage * 100) / 100,
    spreadComponent: Math.round(spreadBps * 100) / 100,
    marketImpact: Math.round(marketImpactBps * timeMultiplier * 100) / 100,
    priceImpact: (totalSlippage / 10000) * currentPrice
  };
}

/**
 * Simulate execution price with slippage
 */
export function simulateExecution({
  orderType,
  side, // BUY or SELL
  limitPrice,
  stopPrice,
  currentBid,
  currentAsk,
  shares,
  avgVolume
}) {
  const currentPrice = (currentBid + currentAsk) / 2;
  const spread = currentAsk - currentBid;

  // Market orders
  if (orderType === 'MARKET') {
    const slippage = calculateSlippage({
      orderShares: shares,
      avgDailyVolume: avgVolume,
      currentSpread: spread,
      currentPrice,
      orderType: 'MARKET'
    });

    const basePrice = side === 'BUY' ? currentAsk : currentBid;
    const slippageAmount = slippage.priceImpact * (side === 'BUY' ? 1 : -1);

    return {
      filled: true,
      fillPrice: Math.round((basePrice + slippageAmount) * 100) / 100,
      slippageBps: slippage.totalBps,
      executionDelay: 50 + Math.random() * 150 // 50-200ms
    };
  }

  // Limit orders
  if (orderType === 'LIMIT') {
    const willFill = side === 'BUY'
      ? limitPrice >= currentAsk
      : limitPrice <= currentBid;

    return {
      filled: willFill,
      fillPrice: willFill ? limitPrice : null,
      slippageBps: 0,
      executionDelay: willFill ? 100 + Math.random() * 300 : null
    };
  }

  // Stop orders (trigger, then execute as market)
  if (orderType === 'STOP') {
    const triggered = side === 'SELL'
      ? currentPrice <= stopPrice
      : currentPrice >= stopPrice;

    if (!triggered) {
      return { filled: false, triggered: false };
    }

    // Once triggered, execute as market order with potentially worse slippage
    const slippage = calculateSlippage({
      orderShares: shares,
      avgDailyVolume: avgVolume,
      currentSpread: spread * 1.5, // Spread often widens during stop cascades
      currentPrice,
      orderType: 'MARKET'
    });

    const basePrice = side === 'BUY' ? currentAsk : currentBid;
    const slippageAmount = slippage.priceImpact * (side === 'BUY' ? 1 : -1);

    return {
      filled: true,
      triggered: true,
      fillPrice: Math.round((basePrice + slippageAmount) * 100) / 100,
      slippageBps: slippage.totalBps,
      executionDelay: 100 + Math.random() * 200
    };
  }

  // Stop-Limit orders
  if (orderType === 'STOP_LIMIT') {
    const triggered = side === 'SELL'
      ? currentPrice <= stopPrice
      : currentPrice >= stopPrice;

    if (!triggered) {
      return { filled: false, triggered: false };
    }

    // Once triggered, become limit order
    const willFill = side === 'BUY'
      ? limitPrice >= currentAsk
      : limitPrice <= currentBid;

    return {
      filled: willFill,
      triggered: true,
      fillPrice: willFill ? limitPrice : null,
      slippageBps: 0,
      executionDelay: willFill ? 150 + Math.random() * 250 : null,
      // Educational: Stop-limit might not fill in fast-moving markets!
      warning: !willFill ? 'Stop triggered but limit not reached - order unfilled!' : null
    };
  }

  return { filled: false, error: 'Unknown order type' };
}

/**
 * Calculate the true cost of a round-trip trade
 * (Buy and Sell including all friction)
 */
export function calculateRoundTripCost({
  shares,
  entryPrice,
  exitPrice,
  avgVolume,
  spread
}) {
  const entrySlippage = calculateSlippage({
    orderShares: shares,
    avgDailyVolume: avgVolume,
    currentSpread: spread,
    currentPrice: entryPrice,
    orderType: 'MARKET'
  });

  const exitSlippage = calculateSlippage({
    orderShares: shares,
    avgDailyVolume: avgVolume,
    currentSpread: spread,
    currentPrice: exitPrice,
    orderType: 'MARKET'
  });

  const totalSlippageBps = entrySlippage.totalBps + exitSlippage.totalBps;
  const slippageCost = (totalSlippageBps / 10000) * entryPrice * shares;

  // SEC fee (on sells only): $22.90 per $1,000,000 of principal
  const secFee = (exitPrice * shares / 1000000) * 22.90;

  // FINRA TAF: $0.000119 per share (capped at $5.95)
  const finraFee = Math.min(shares * 0.000119, 5.95);

  return {
    grossPL: (exitPrice - entryPrice) * shares,
    slippageCost,
    slippageBps: totalSlippageBps,
    secFee,
    finraFee,
    totalFees: slippageCost + secFee + finraFee,
    netPL: (exitPrice - entryPrice) * shares - slippageCost - secFee - finraFee
  };
}

/**
 * Educational: Show how slippage compounds with trading frequency
 */
export function demonstrateSlippageImpact(annualTrades, avgTradeValue, avgSlippageBps) {
  const slippagePerTrade = (avgSlippageBps / 10000) * avgTradeValue;
  const annualSlippageCost = slippagePerTrade * annualTrades;
  const totalCapital = avgTradeValue; // Assuming same capital recycled

  return {
    tradesPerYear: annualTrades,
    slippagePerTrade,
    annualSlippageCost,
    slippageAsPercentOfCapital: (annualSlippageCost / totalCapital) * 100,
    breakEvenReturnNeeded: (annualSlippageCost / totalCapital) * 100,
    message: `With ${annualTrades} trades/year, you need ${((annualSlippageCost / totalCapital) * 100).toFixed(2)}% returns just to cover slippage costs.`
  };
}

export default {
  calculateSlippage,
  simulateExecution,
  calculateRoundTripCost,
  demonstrateSlippageImpact
};
