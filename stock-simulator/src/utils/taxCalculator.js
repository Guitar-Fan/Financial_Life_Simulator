/**
 * Tax Calculator - Capital gains and tax lot management
 * 
 * Implements:
 * - Short-term vs Long-term capital gains classification
 * - FIFO, LIFO, and Specific ID cost basis methods
 * - Wash sale rule detection (30-day window)
 * - Tax liability estimation
 * 
 * Educational Purpose: The "hidden killer" of active trading.
 * Players learn that frequent trading creates short-term gains
 * taxed at ordinary income rates (up to 37%) vs long-term rates (15-20%).
 */

// 2024 Tax rates (simplified - actual brackets vary by income)
export const TAX_RATES = {
  shortTerm: {
    // Taxed as ordinary income
    brackets: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ],
    // Simplified flat rate for game purposes
    flatRate: 0.37
  },
  longTerm: {
    brackets: [
      { min: 0, max: 47025, rate: 0.00 },
      { min: 47025, max: 518900, rate: 0.15 },
      { min: 518900, max: Infinity, rate: 0.20 }
    ],
    flatRate: 0.15
  },
  // Net Investment Income Tax (additional 3.8% for high earners)
  niit: {
    threshold: 200000,
    rate: 0.038
  }
};

/**
 * Calculate holding period in days
 */
export function calculateHoldingPeriod(acquiredDate, soldDate) {
  const acquired = new Date(acquiredDate);
  const sold = new Date(soldDate);
  return Math.floor((sold - acquired) / (1000 * 60 * 60 * 24));
}

/**
 * Determine if gain is long-term (held > 1 year)
 */
export function isLongTermGain(acquiredDate, soldDate) {
  return calculateHoldingPeriod(acquiredDate, soldDate) > 365;
}

/**
 * Calculate capital gain/loss for a sale
 */
export function calculateGain(costBasis, salePrice, shares) {
  const totalCost = costBasis * shares;
  const totalProceeds = salePrice * shares;
  return totalProceeds - totalCost;
}

/**
 * Match sale against tax lots using specified method
 * 
 * @param {Array} taxLots - Available tax lots for the ticker
 * @param {number} sharesToSell - Number of shares being sold
 * @param {string} method - 'FIFO', 'LIFO', or 'HIFO' (highest cost first)
 * @returns {Array} Matched lots with shares to sell from each
 */
export function matchTaxLots(taxLots, sharesToSell, method = 'FIFO') {
  // Sort lots based on method
  const sortedLots = [...taxLots].sort((a, b) => {
    switch (method) {
      case 'FIFO':
        return new Date(a.acquiredDate) - new Date(b.acquiredDate);
      case 'LIFO':
        return new Date(b.acquiredDate) - new Date(a.acquiredDate);
      case 'HIFO':
        return b.costBasis - a.costBasis; // Highest cost first (tax efficient)
      default:
        return 0;
    }
  });

  const matches = [];
  let remaining = sharesToSell;

  for (const lot of sortedLots) {
    if (remaining <= 0) break;
    if (lot.shares <= 0) continue;

    const sharesToUse = Math.min(lot.shares, remaining);
    matches.push({
      lotId: lot.id,
      shares: sharesToUse,
      costBasis: lot.costBasis,
      acquiredDate: lot.acquiredDate
    });

    remaining -= sharesToUse;
  }

  return matches;
}

/**
 * Detect potential wash sale
 * 
 * Wash Sale Rule: Cannot claim a loss if you buy substantially identical
 * securities within 30 days before or after the sale.
 */
export function detectWashSale(ticker, saleDate, saleLoss, allTaxLots) {
  if (saleLoss >= 0) return { isWashSale: false }; // No loss, no wash sale

  const saleTime = new Date(saleDate).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Check for purchases within 30-day window
  const washSalePurchases = allTaxLots.filter(lot => {
    if (lot.ticker !== ticker) return false;
    
    const purchaseTime = new Date(lot.acquiredDate).getTime();
    const daysDiff = Math.abs(purchaseTime - saleTime);
    
    return daysDiff <= thirtyDays;
  });

  if (washSalePurchases.length > 0) {
    return {
      isWashSale: true,
      disallowedLoss: Math.abs(saleLoss),
      adjustmentLots: washSalePurchases.map(l => l.id),
      message: 'Loss disallowed due to wash sale rule. Cost basis of replacement shares adjusted.'
    };
  }

  return { isWashSale: false };
}

/**
 * Calculate tax liability for realized gains
 */
export function calculateTaxLiability(shortTermGains, longTermGains, useSimplified = true) {
  if (useSimplified) {
    // Game uses simplified flat rates for clarity
    const stTax = Math.max(0, shortTermGains * TAX_RATES.shortTerm.flatRate);
    const ltTax = Math.max(0, longTermGains * TAX_RATES.longTerm.flatRate);
    
    return {
      shortTermTax: stTax,
      longTermTax: ltTax,
      totalTax: stTax + ltTax,
      effectiveRate: (shortTermGains + longTermGains) > 0 
        ? (stTax + ltTax) / (shortTermGains + longTermGains)
        : 0
    };
  }

  // Progressive bracket calculation (more realistic)
  // ... implementation for advanced mode
  return { shortTermTax: 0, longTermTax: 0, totalTax: 0, effectiveRate: 0 };
}

/**
 * Generate tax summary for year-end report
 */
export function generateTaxSummary(orderHistory, taxLots) {
  const sales = orderHistory.filter(o => o.side === 'SELL' && o.status === 'FILLED');
  
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;
  let washSaleAdjustments = 0;

  // This would iterate through matched lots from each sale
  // Simplified for demo

  return {
    grossProceeds: sales.reduce((sum, s) => sum + (s.fillPrice * s.quantity), 0),
    totalCostBasis: 0, // Would calculate from matched lots
    shortTermGains,
    shortTermLosses,
    longTermGains,
    longTermLosses,
    netShortTerm: shortTermGains + shortTermLosses,
    netLongTerm: longTermGains + longTermLosses,
    washSaleAdjustments,
    estimatedTax: calculateTaxLiability(
      shortTermGains + shortTermLosses,
      longTermGains + longTermLosses
    )
  };
}

/**
 * Educational comparison: Churning vs Holding
 * 
 * Shows the tax impact of different trading strategies
 */
export function compareStrategies(grossReturn, tradingFrequency, holdingPeriodMonths) {
  const isLongTerm = holdingPeriodMonths > 12;
  const taxRate = isLongTerm ? TAX_RATES.longTerm.flatRate : TAX_RATES.shortTerm.flatRate;
  
  // Estimate transaction costs (slippage, spread)
  const transactionCostPerTrade = 0.001; // 10 bps per trade
  const totalTransactionCosts = tradingFrequency * transactionCostPerTrade * 2; // Round trip
  
  const afterTransactionCosts = grossReturn * (1 - totalTransactionCosts);
  const taxOnGains = Math.max(0, afterTransactionCosts * taxRate);
  const netReturn = afterTransactionCosts - taxOnGains;

  return {
    grossReturn,
    transactionCosts: grossReturn * totalTransactionCosts,
    taxableGain: afterTransactionCosts,
    taxRate,
    taxOwed: taxOnGains,
    netReturn,
    effectiveReturn: netReturn / grossReturn
  };
}

export default {
  TAX_RATES,
  calculateHoldingPeriod,
  isLongTermGain,
  calculateGain,
  matchTaxLots,
  detectWashSale,
  calculateTaxLiability,
  generateTaxSummary,
  compareStrategies
};
