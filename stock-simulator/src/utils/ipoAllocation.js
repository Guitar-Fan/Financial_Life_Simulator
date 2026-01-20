/**
 * IPO Allocation Engine
 * 
 * Simulates the real-world IPO allocation process where:
 * - Institutional investors get priority (70-90% of shares)
 * - Retail investors compete for a small pool (10-30%)
 * - Hot IPOs are massively oversubscribed
 * - Most retail investors get partial or no allocation
 * 
 * Educational Purpose: Teaches why "getting in on the IPO" is much
 * harder than it seems, and why the secondary market "pop" happens.
 */

/**
 * IPO Status Types
 */
export const IPO_STATUS = {
  UPCOMING: 'UPCOMING',     // Filed, not yet pricing
  PRICING: 'PRICING',       // In pricing period, accepting IOIs
  PRICED: 'PRICED',         // Final price set, allocations processing
  COMPLETED: 'COMPLETED',   // Trading on secondary market
  WITHDRAWN: 'WITHDRAWN'    // IPO cancelled
};

/**
 * Simulate total market demand for an IPO
 * 
 * Factors:
 * - Company financials (revenue growth, path to profitability)
 * - Market conditions
 * - Sector heat
 * - Price range attractiveness
 */
export function simulateMarketDemand(ipo) {
  const { financials, priceRange, sharesOffered, sector } = ipo;
  
  // Base demand multiplier
  let demandMultiplier = 1.0;
  
  // Revenue growth factor (high growth = high demand)
  if (financials.revenueGrowth > 0.5) demandMultiplier += 2.0;
  else if (financials.revenueGrowth > 0.25) demandMultiplier += 1.0;
  else if (financials.revenueGrowth > 0) demandMultiplier += 0.5;
  
  // Profitability factor (profitable companies = premium)
  if (financials.netIncome > 0) demandMultiplier += 1.5;
  else if (financials.grossMargin > 0.5) demandMultiplier += 0.5;
  
  // Sector heat (tech/AI = hot)
  const hotSectors = ['Technology', 'AI', 'Biotech', 'Clean Energy'];
  if (hotSectors.some(s => sector?.includes(s))) {
    demandMultiplier += 1.0;
  }
  
  // Price range factor (lower price = more retail interest)
  const midPrice = (priceRange.low + priceRange.high) / 2;
  if (midPrice < 25) demandMultiplier += 0.5;
  
  // Add randomness for market conditions
  const marketSentiment = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
  demandMultiplier *= marketSentiment;
  
  // Calculate total shares demanded
  const totalDemand = Math.round(sharesOffered * demandMultiplier);
  
  // Split between institutional and retail
  const institutionalDemand = Math.round(totalDemand * (0.65 + Math.random() * 0.15));
  const retailDemand = totalDemand - institutionalDemand;
  
  return {
    totalDemand,
    institutionalDemand,
    retailDemand,
    oversubscriptionRatio: totalDemand / sharesOffered,
    isHot: demandMultiplier > 2.5
  };
}

/**
 * Calculate player's allocation based on their IOI and market demand
 * 
 * This is the core educational mechanic - showing how allocation works.
 */
export function calculateAllocation(playerIOI, ipo, marketDemand) {
  if (!playerIOI || playerIOI.status === 'CANCELLED') {
    return {
      sharesAllocated: 0,
      allocationPrice: null,
      reason: 'No IOI submitted'
    };
  }
  
  const { shares: requestedShares, maxPrice } = playerIOI;
  const { sharesOffered, priceRange, outcome } = ipo;
  
  // Determine final IPO price
  const finalPrice = outcome?.finalPrice || calculateFinalPrice(priceRange, marketDemand);
  
  // Check if player's max price is sufficient
  if (maxPrice < finalPrice) {
    return {
      sharesAllocated: 0,
      allocationPrice: finalPrice,
      reason: `Your max price ($${maxPrice}) was below the final IPO price ($${finalPrice})`
    };
  }
  
  const { oversubscriptionRatio, retailDemand } = marketDemand;
  
  // Calculate retail pool (typically 10-20% of total offering)
  const retailPoolPercent = 0.10 + Math.random() * 0.10;
  const retailPool = Math.round(sharesOffered * retailPoolPercent);
  
  // If undersubscribed, full allocation possible
  if (oversubscriptionRatio <= 1) {
    return {
      sharesAllocated: requestedShares,
      allocationPrice: finalPrice,
      reason: 'IPO was undersubscribed - full allocation',
      allocationPercent: 100
    };
  }
  
  // Hot IPO - pro-rata allocation from retail pool
  // Retail allocation = (player request / total retail demand) * retail pool
  const rawAllocation = (requestedShares / retailDemand) * retailPool;
  
  // Apply lottery factor for very hot IPOs (not everyone gets shares)
  let finalAllocation = rawAllocation;
  
  if (oversubscriptionRatio > 10) {
    // Very hot IPO - lottery system
    const lotteryWin = Math.random() < 0.3; // 30% chance to get anything
    if (!lotteryWin) {
      return {
        sharesAllocated: 0,
        allocationPrice: finalPrice,
        reason: `IPO was ${oversubscriptionRatio.toFixed(1)}x oversubscribed. You were not selected in the allocation lottery.`,
        oversubscription: oversubscriptionRatio
      };
    }
    finalAllocation = Math.max(1, Math.floor(rawAllocation * 0.5));
  } else if (oversubscriptionRatio > 5) {
    // Hot IPO - significant reduction
    finalAllocation = Math.floor(rawAllocation * 0.3);
  } else if (oversubscriptionRatio > 2) {
    // Moderately hot - some reduction
    finalAllocation = Math.floor(rawAllocation * 0.5);
  }
  
  // Round down and ensure at least 0
  const sharesAllocated = Math.max(0, Math.floor(finalAllocation));
  const allocationPercent = requestedShares > 0 
    ? Math.round((sharesAllocated / requestedShares) * 100) 
    : 0;
  
  return {
    sharesAllocated,
    allocationPrice: finalPrice,
    requestedShares,
    allocationPercent,
    oversubscription: oversubscriptionRatio,
    reason: sharesAllocated > 0
      ? `IPO was ${oversubscriptionRatio.toFixed(1)}x oversubscribed. You received ${allocationPercent}% of your requested shares.`
      : `IPO was ${oversubscriptionRatio.toFixed(1)}x oversubscribed. No allocation received.`
  };
}

/**
 * Calculate final IPO price based on demand
 */
export function calculateFinalPrice(priceRange, marketDemand) {
  const { low, high } = priceRange;
  const { oversubscriptionRatio } = marketDemand;
  
  if (oversubscriptionRatio > 5) {
    // Very hot - price above range
    return Math.round((high * 1.15) * 100) / 100;
  } else if (oversubscriptionRatio > 2) {
    // Hot - price at top of range
    return high;
  } else if (oversubscriptionRatio > 1) {
    // Moderate demand - mid to high range
    return Math.round((low + (high - low) * 0.7) * 100) / 100;
  } else if (oversubscriptionRatio > 0.5) {
    // Weak demand - low end of range
    return low;
  } else {
    // Very weak - below range or withdrawn
    return Math.round((low * 0.9) * 100) / 100;
  }
}

/**
 * Simulate opening day trading
 */
export function simulateOpeningTrade(ipo, finalPrice, marketDemand) {
  const { oversubscriptionRatio, isHot } = marketDemand;
  
  let openPriceMultiplier;
  
  if (isHot && oversubscriptionRatio > 10) {
    // Massive pop
    openPriceMultiplier = 1.4 + Math.random() * 0.4; // 40-80% pop
  } else if (oversubscriptionRatio > 5) {
    // Strong pop
    openPriceMultiplier = 1.2 + Math.random() * 0.3; // 20-50% pop
  } else if (oversubscriptionRatio > 2) {
    // Moderate pop
    openPriceMultiplier = 1.05 + Math.random() * 0.2; // 5-25% pop
  } else if (oversubscriptionRatio > 1) {
    // Small pop or flat
    openPriceMultiplier = 0.98 + Math.random() * 0.12; // -2% to +10%
  } else {
    // Weak IPO - may trade below
    openPriceMultiplier = 0.85 + Math.random() * 0.15; // -15% to flat
  }
  
  const openPrice = Math.round(finalPrice * openPriceMultiplier * 100) / 100;
  
  // Day 1 close (typically gives back some of the pop)
  const dayOneReturn = (openPriceMultiplier - 1) * (0.6 + Math.random() * 0.3);
  const dayOneClose = Math.round(finalPrice * (1 + dayOneReturn) * 100) / 100;
  
  return {
    openPrice,
    dayOneClose,
    openPop: Math.round((openPriceMultiplier - 1) * 10000) / 100, // As percentage
    dayOneReturn: Math.round(dayOneReturn * 10000) / 100
  };
}

/**
 * Generate risk assessment score from S-1 analysis
 */
export function calculateRiskScore(ipo) {
  const { riskFactors, financials } = ipo;
  
  let riskScore = 50; // Base score (1-100, higher = riskier)
  
  // Financial health factors
  if (financials.netLoss < 0) riskScore += 15;
  if (financials.revenue === 0) riskScore += 25;
  if (financials.burnRate > financials.cashPosition / 12) riskScore += 20;
  if (financials.revenueGrowth < 0) riskScore += 15;
  
  // Risk factor severity
  const highSeverityCount = riskFactors?.filter(r => r.severity === 'high').length || 0;
  const mediumSeverityCount = riskFactors?.filter(r => r.severity === 'medium').length || 0;
  
  riskScore += highSeverityCount * 10;
  riskScore += mediumSeverityCount * 5;
  
  // Cap at 100
  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Educational: Compare buying at IPO vs secondary market
 */
export function compareEntryStrategies(allocation, openPrice, dayOneClose, finalPrice) {
  if (!allocation || allocation.sharesAllocated === 0) {
    return {
      ipoEntry: null,
      secondaryEntry: {
        price: openPrice,
        shares: Math.floor(allocation?.requestedShares || 100),
        totalCost: openPrice * (allocation?.requestedShares || 100),
        dayOneValue: dayOneClose * (allocation?.requestedShares || 100)
      },
      lesson: 'Without IPO allocation, you would buy at the open price, missing the "pop".'
    };
  }
  
  const ipoShares = allocation.sharesAllocated;
  const ipoCost = ipoShares * finalPrice;
  const ipoValueAtOpen = ipoShares * openPrice;
  const ipoValueAtClose = ipoShares * dayOneClose;
  const ipoGainAtOpen = ipoValueAtOpen - ipoCost;
  
  // If they had bought same dollar amount at open
  const secondaryShares = Math.floor(ipoCost / openPrice);
  const secondaryValueAtClose = secondaryShares * dayOneClose;
  const secondaryGain = secondaryValueAtClose - ipoCost;
  
  return {
    ipoEntry: {
      shares: ipoShares,
      price: finalPrice,
      totalCost: ipoCost,
      valueAtOpen: ipoValueAtOpen,
      gainAtOpen: ipoGainAtOpen,
      gainPercent: Math.round((ipoGainAtOpen / ipoCost) * 10000) / 100
    },
    secondaryEntry: {
      shares: secondaryShares,
      price: openPrice,
      totalCost: ipoCost,
      valueAtClose: secondaryValueAtClose,
      gain: secondaryGain,
      gainPercent: Math.round((secondaryGain / ipoCost) * 10000) / 100
    },
    advantageOfIPO: ipoGainAtOpen - secondaryGain,
    lesson: ipoGainAtOpen > 0 
      ? `IPO allocation provided a ${Math.round((ipoGainAtOpen / ipoCost) * 100)}% gain at open. Secondary buyers missed this.`
      : 'This IPO traded below the offering price. IPO allocation was not advantageous.'
  };
}

export default {
  IPO_STATUS,
  simulateMarketDemand,
  calculateAllocation,
  calculateFinalPrice,
  simulateOpeningTrade,
  calculateRiskScore,
  compareEntryStrategies
};
