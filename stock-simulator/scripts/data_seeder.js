/**
 * Market Terminal Simulator - Data Seeder
 * 
 * This script fetches historical market data from Alpha Vantage or Polygon.io,
 * sanitizes it, and saves it as static JSON assets for the simulator to replay.
 * 
 * Usage: npm run seed
 * 
 * Environment Variables:
 *   ALPHA_VANTAGE_KEY - Your Alpha Vantage API key
 *   POLYGON_KEY - Your Polygon.io API key (alternative)
 * 
 * @author MarketTerminal Development Team
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Configuration
const CONFIG = {
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: process.env.ALPHA_VANTAGE_KEY || 'demo'
  },
  polygon: {
    baseUrl: 'https://api.polygon.io/v2',
    apiKey: process.env.POLYGON_KEY || ''
  },
  // Tickers to seed - start with blue chips for Stage 1
  tickers: [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Defensive' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Cyclical' }
  ],
  // Date range for historical data
  startDate: '2023-01-01',
  endDate: '2024-12-31',
  // Rate limiting
  requestDelay: 12000 // Alpha Vantage free tier: 5 calls/min
};

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch daily OHLCV data from Alpha Vantage
 */
async function fetchAlphaVantageDaily(symbol) {
  const url = new URL(CONFIG.alphaVantage.baseUrl);
  url.searchParams.set('function', 'TIME_SERIES_DAILY_ADJUSTED');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('outputsize', 'full');
  url.searchParams.set('apikey', CONFIG.alphaVantage.apiKey);

  console.log(`  Fetching ${symbol} from Alpha Vantage...`);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  if (data['Note']) {
    console.warn(`  ⚠️  Rate limit warning: ${data['Note']}`);
    return null;
  }
  
  return data;
}

/**
 * Transform Alpha Vantage response to our standard format
 */
function transformAlphaVantageData(raw, tickerInfo) {
  const timeSeries = raw['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error('No time series data in response');
  }

  const startDate = new Date(CONFIG.startDate);
  const endDate = new Date(CONFIG.endDate);

  const data = Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      adjustedClose: parseFloat(values['5. adjusted close']),
      volume: parseInt(values['6. volume'], 10),
      dividendAmount: parseFloat(values['7. dividend amount']),
      splitCoefficient: parseFloat(values['8. split coefficient'])
    }))
    .filter(d => {
      const date = new Date(d.date);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate additional metrics
  const latestPrice = data[data.length - 1]?.close || 0;
  const prices = data.map(d => d.close);
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252); // Annualized

  return {
    ticker: tickerInfo.symbol,
    name: tickerInfo.name,
    sector: tickerInfo.sector,
    data,
    meta: {
      dataPoints: data.length,
      startDate: data[0]?.date,
      endDate: data[data.length - 1]?.date,
      latestPrice,
      volatility: Math.round(volatility * 10000) / 100, // As percentage
      avgVolume: Math.round(data.reduce((a, d) => a + d.volume, 0) / data.length)
    }
  };
}

/**
 * Generate synthetic intraday ticks from daily data
 * This creates realistic-looking minute bars for replay
 */
function generateIntradayTicks(dailyData) {
  const ticks = [];
  
  for (const day of dailyData.data) {
    const { date, open, high, low, close, volume } = day;
    
    // Generate 390 minute bars (6.5 hours of trading)
    const minuteBars = [];
    const totalMinutes = 390;
    
    // Use a random walk constrained by OHLC
    let currentPrice = open;
    const priceRange = high - low;
    
    for (let minute = 0; minute < totalMinutes; minute++) {
      const progress = minute / totalMinutes;
      
      // Bias toward close as day progresses
      const targetPrice = open + (close - open) * progress;
      const noise = (Math.random() - 0.5) * priceRange * 0.1;
      
      currentPrice = currentPrice * 0.7 + targetPrice * 0.3 + noise;
      currentPrice = Math.max(low, Math.min(high, currentPrice));
      
      // Volume follows U-shape (high at open/close)
      const volumeMultiplier = 1 + Math.abs(progress - 0.5) * 2;
      const minuteVolume = Math.round((volume / totalMinutes) * volumeMultiplier);
      
      minuteBars.push({
        timestamp: `${date}T${formatTime(minute)}`,
        price: Math.round(currentPrice * 100) / 100,
        volume: minuteVolume
      });
    }
    
    ticks.push(...minuteBars);
  }
  
  return ticks;
}

function formatTime(minutesSinceOpen) {
  const hour = Math.floor(minutesSinceOpen / 60) + 9; // Market opens 9:30
  const minute = (minutesSinceOpen % 60) + 30;
  const adjustedHour = minute >= 60 ? hour + 1 : hour;
  const adjustedMinute = minute % 60;
  return `${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinute).padStart(2, '0')}:00`;
}

/**
 * Generate simulated IPO data
 */
function generateIPOData() {
  const ipos = [
    {
      id: 'IPO_2024_001',
      company: 'CloudScale Technologies',
      ticker: 'CLDS',
      filingDate: '2024-02-01',
      expectedDate: '2024-03-15',
      priceRange: { low: 22, high: 26 },
      sharesOffered: 12000000,
      useOfProceeds: 'Expansion of cloud infrastructure and R&D investment',
      riskFactors: [
        { category: 'profitability', severity: 'high', text: 'We have incurred net losses in each year since inception. Our accumulated deficit as of December 31, 2023 was $234 million.' },
        { category: 'competition', severity: 'medium', text: 'We compete with established players including AWS, Azure, and Google Cloud who have significantly greater resources.' },
        { category: 'concentration', severity: 'high', text: 'Our top three customers represented 67% of our revenue in 2023.' }
      ],
      financials: {
        revenue: 189000000,
        revenueGrowth: 0.78,
        grossMargin: 0.62,
        netLoss: -67000000,
        cashPosition: 145000000,
        burnRate: 8500000
      },
      outcome: {
        finalPrice: 28,
        openPrice: 42,
        dayOneClose: 38.50,
        dayOneVolume: 45000000,
        oversubscription: 12.5
      }
    },
    {
      id: 'IPO_2024_002',
      company: 'BioGenesis Therapeutics',
      ticker: 'BGTX',
      filingDate: '2024-04-10',
      expectedDate: '2024-05-20',
      priceRange: { low: 16, high: 19 },
      sharesOffered: 8000000,
      useOfProceeds: 'Phase 3 clinical trials and regulatory submissions',
      riskFactors: [
        { category: 'regulatory', severity: 'high', text: 'Our lead product candidate has not received FDA approval. Clinical trials may fail to demonstrate safety or efficacy.' },
        { category: 'profitability', severity: 'high', text: 'We have never generated revenue from product sales and may never achieve profitability.' },
        { category: 'dilution', severity: 'medium', text: 'We expect to issue additional equity to fund operations, which will dilute existing shareholders.' }
      ],
      financials: {
        revenue: 0,
        revenueGrowth: 0,
        grossMargin: 0,
        netLoss: -89000000,
        cashPosition: 78000000,
        burnRate: 12000000
      },
      outcome: {
        finalPrice: 15,
        openPrice: 14.25,
        dayOneClose: 12.80,
        dayOneVolume: 12000000,
        oversubscription: 0.8
      }
    },
    {
      id: 'IPO_2024_003',
      company: 'ElectroMotive Systems',
      ticker: 'EMOT',
      filingDate: '2024-06-05',
      expectedDate: '2024-07-18',
      priceRange: { low: 32, high: 38 },
      sharesOffered: 20000000,
      useOfProceeds: 'Manufacturing facility expansion and supply chain development',
      riskFactors: [
        { category: 'execution', severity: 'medium', text: 'We have limited manufacturing experience at scale. Production delays could materially impact our business.' },
        { category: 'competition', severity: 'high', text: 'The EV market is intensely competitive with well-funded incumbents including Tesla, Ford, and GM.' },
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
        dayOneVolume: 78000000,
        oversubscription: 18.3
      }
    }
  ];

  return ipos;
}

/**
 * Generate market events (earnings, dividends, splits)
 */
function generateMarketEvents(tickers) {
  const events = [];
  const eventTypes = ['earnings', 'dividend', 'split'];
  
  for (const ticker of tickers) {
    // Quarterly earnings
    const earningsDates = [
      '2024-01-25', '2024-04-25', '2024-07-25', '2024-10-24'
    ];
    
    for (const date of earningsDates) {
      const beat = Math.random() > 0.35; // 65% beat rate
      const surprise = (Math.random() * 0.15) * (beat ? 1 : -1);
      
      events.push({
        type: 'earnings',
        ticker: ticker.symbol,
        date,
        data: {
          epsEstimate: 2.45,
          epsActual: 2.45 * (1 + surprise),
          revenueEstimate: 89000000000,
          revenueActual: 89000000000 * (1 + surprise * 0.5),
          beat,
          surprise: Math.round(surprise * 10000) / 100
        }
      });
    }
    
    // Quarterly dividends for some stocks
    if (['AAPL', 'MSFT', 'JPM', 'JNJ', 'PG'].includes(ticker.symbol)) {
      const divDates = ['2024-02-09', '2024-05-10', '2024-08-09', '2024-11-08'];
      for (const date of divDates) {
        events.push({
          type: 'dividend',
          ticker: ticker.symbol,
          date,
          data: {
            amount: 0.24 + Math.random() * 0.02,
            exDate: date,
            payDate: addDays(date, 14)
          }
        });
      }
    }
  }
  
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Ensure output directories exist
 */
async function ensureDirectories() {
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'tickers'),
    path.join(OUTPUT_DIR, 'intraday'),
    path.join(OUTPUT_DIR, 'ipos')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Save data to JSON file
 */
async function saveJSON(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`  ✓ Saved ${filepath}`);
}

/**
 * Generate fallback synthetic data when API is unavailable
 */
function generateSyntheticData(tickerInfo) {
  console.log(`  Generating synthetic data for ${tickerInfo.symbol}...`);
  
  const startDate = new Date(CONFIG.startDate);
  const endDate = new Date(CONFIG.endDate);
  const data = [];
  
  // Starting prices based on real-ish values
  const startPrices = {
    'AAPL': 185, 'MSFT': 375, 'GOOGL': 140, 'AMZN': 150,
    'JPM': 170, 'JNJ': 155, 'V': 260, 'PG': 150,
    'UNH': 525, 'HD': 350
  };
  
  let price = startPrices[tickerInfo.symbol] || 100;
  const volatility = 0.02; // 2% daily volatility
  
  const current = new Date(startDate);
  while (current <= endDate) {
    // Skip weekends
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      const dailyReturn = (Math.random() - 0.48) * volatility; // Slight upward bias
      const open = price;
      const change = price * dailyReturn;
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.round(10000000 + Math.random() * 50000000);
      
      data.push({
        date: current.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        adjustedClose: Math.round(close * 100) / 100,
        volume,
        dividendAmount: 0,
        splitCoefficient: 1
      });
      
      price = close;
    }
    current.setDate(current.getDate() + 1);
  }
  
  const prices = data.map(d => d.close);
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const annualizedVol = Math.sqrt(variance * 252);

  return {
    ticker: tickerInfo.symbol,
    name: tickerInfo.name,
    sector: tickerInfo.sector,
    data,
    meta: {
      dataPoints: data.length,
      startDate: data[0]?.date,
      endDate: data[data.length - 1]?.date,
      latestPrice: data[data.length - 1]?.close,
      volatility: Math.round(annualizedVol * 10000) / 100,
      avgVolume: Math.round(data.reduce((a, d) => a + d.volume, 0) / data.length),
      synthetic: true
    }
  };
}

/**
 * Main seeding function
 */
async function seed() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Market Terminal Simulator - Data Seeder            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await ensureDirectories();
  
  const useAPI = CONFIG.alphaVantage.apiKey !== 'demo' && CONFIG.alphaVantage.apiKey;
  
  if (!useAPI) {
    console.log('⚠️  No API key provided. Generating synthetic data.\n');
    console.log('   To use real data, set ALPHA_VANTAGE_KEY environment variable.\n');
  }

  // Seed ticker data
  console.log('📊 Seeding ticker data...\n');
  const tickerIndex = [];
  
  for (const ticker of CONFIG.tickers) {
    try {
      let tickerData;
      
      if (useAPI) {
        const raw = await fetchAlphaVantageDaily(ticker.symbol);
        if (raw) {
          tickerData = transformAlphaVantageData(raw, ticker);
        } else {
          tickerData = generateSyntheticData(ticker);
        }
        await sleep(CONFIG.requestDelay);
      } else {
        tickerData = generateSyntheticData(ticker);
      }
      
      await saveJSON(`tickers/${ticker.symbol}.json`, tickerData);
      
      // Generate intraday ticks
      const intradayTicks = generateIntradayTicks(tickerData);
      await saveJSON(`intraday/${ticker.symbol}_ticks.json`, {
        ticker: ticker.symbol,
        ticks: intradayTicks
      });
      
      tickerIndex.push({
        symbol: ticker.symbol,
        name: ticker.name,
        sector: ticker.sector,
        latestPrice: tickerData.meta.latestPrice,
        volatility: tickerData.meta.volatility
      });
      
    } catch (error) {
      console.error(`  ✗ Error seeding ${ticker.symbol}: ${error.message}`);
      // Fall back to synthetic
      const tickerData = generateSyntheticData(ticker);
      await saveJSON(`tickers/${ticker.symbol}.json`, tickerData);

      // Generate intraday ticks for fallback data
      const intradayTicks = generateIntradayTicks(tickerData);
      await saveJSON(`intraday/${ticker.symbol}_ticks.json`, {
        ticker: ticker.symbol,
        ticks: intradayTicks
      });
      
      tickerIndex.push({
        symbol: ticker.symbol,
        name: ticker.name,
        sector: ticker.sector,
        latestPrice: tickerData.meta.latestPrice,
        volatility: tickerData.meta.volatility
      });
    }
  }
  
  // Save ticker index
  await saveJSON('ticker_index.json', tickerIndex);
  
  // Seed IPO data
  console.log('\n📈 Seeding IPO data...\n');
  const ipoData = generateIPOData();
  await saveJSON('ipos/ipo_calendar.json', ipoData);
  
  for (const ipo of ipoData) {
    await saveJSON(`ipos/${ipo.id}.json`, ipo);
  }
  
  // Seed market events
  console.log('\n📅 Seeding market events...\n');
  const events = generateMarketEvents(CONFIG.tickers);
  await saveJSON('market_events.json', events);
  
  console.log('\n✅ Data seeding complete!\n');
  console.log(`   Tickers: ${tickerIndex.length}`);
  console.log(`   IPOs: ${ipoData.length}`);
  console.log(`   Events: ${events.length}`);
  console.log(`\n   Output directory: ${OUTPUT_DIR}`);
}

// Run seeder
seed().catch(console.error);
