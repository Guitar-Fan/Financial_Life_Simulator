/**
 * ChartPanel - Professional candlestick charting
 * 
 * Integration: Lightweight Charts by TradingView
 * 
 * This is the centerpiece of the terminal. We use Lightweight Charts
 * because it provides professional-grade financial charts with:
 * - Candlestick, line, area chart types
 * - Crosshair with price/time tracking
 * - Multiple series support for indicators
 * - Excellent performance (handles 10k+ candles)
 * 
 * Step 2 Modification: Here we integrate the charting library and
 * connect it to our market replay data stream.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { 
  BarChart3, 
  LineChart, 
  CandlestickChart,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';

export function ChartPanel() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const baseHistoryRef = useRef([]);
  const baseVolumeRef = useRef([]);
  
  const [chartType, setChartType] = useState('candle'); // candle, line, area
  const [displayCandle, setDisplayCandle] = useState(null);
  
  const { selectedTicker, historicalData, intradayData, tickers, replayIndex } = useMarketStore();
  const tickerData = selectedTicker ? historicalData[selectedTicker] : null;
  const tickerIntraday = selectedTicker ? intradayData[selectedTicker] : null;
  const currentPrice = tickers[selectedTicker]?.price;

  /**
   * Initialize chart on mount
   * 
   * Design Decision: We create the chart once and update data reactively.
   * This prevents expensive re-renders when data changes frequently.
   */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with terminal-appropriate styling
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#141414' },
        textColor: '#737373',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6'
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6'
        }
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
        secondsVisible: false
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: true }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true
      }
    });

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    // Use ResizeObserver for accurate sizing
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Initial size
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  /**
   * Step 3 Modification: Connect to data stream
   * 
   * When historical data changes (new ticker selected or data loaded),
   * update the chart series. This is where we connect the "Data Seeding"
   * JSON to the visual representation.
   */
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !tickerData) return;

    const firstReplayDate = tickerIntraday?.[0]?.timestamp?.split('T')[0] || null;
    const baseHistory = firstReplayDate
      ? tickerData.filter((d) => d.date < firstReplayDate)
      : tickerData;

    const candleData = baseHistory.map((d) => ({
      time: toUnixTimestamp(`${d.date}T16:00:00`),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }));

    const volumeData = baseHistory.map((d) => ({
      time: toUnixTimestamp(`${d.date}T16:00:00`),
      value: d.volume,
      color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    }));

    baseHistoryRef.current = candleData;
    baseVolumeRef.current = volumeData;

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    const lastBase = candleData[candleData.length - 1] || null;
    setDisplayCandle(lastBase ? { ...lastBase, volume: volumeData[volumeData.length - 1]?.value || null } : null);

    // Fit content to view when base data changes (ticker switch / fresh load).
    chartRef.current?.timeScale().fitContent();
  }, [tickerData, tickerIntraday]);

  /**
   * Update last candle with real-time price
   * This creates the "live" effect as prices tick
   */
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !tickerIntraday || replayIndex < 0) {
      return;
    }

    const cappedIndex = Math.min(replayIndex, tickerIntraday.length - 1);
    if (cappedIndex < 0) {
      return;
    }

    const barsByTime = new Map();

    for (let i = 0; i <= cappedIndex; i++) {
      const tick = tickerIntraday[i];
      if (!tick?.timestamp) continue;

      const tickTime = toUnixTimestamp(tick.timestamp);
      const bucketTime = Math.floor(tickTime / LIVE_CANDLE_INTERVAL_SECONDS) * LIVE_CANDLE_INTERVAL_SECONDS;
      const tickPrice = Number(tick.price) || 0;
      const tickHigh = Number.isFinite(tick.high) ? tick.high : tickPrice;
      const tickLow = Number.isFinite(tick.low) ? tick.low : tickPrice;
      const tickVolume = Number(tick.volume) || 0;

      const existing = barsByTime.get(bucketTime);

      if (!existing) {
        barsByTime.set(bucketTime, {
          time: bucketTime,
          open: tickPrice,
          high: Math.max(tickPrice, tickHigh),
          low: Math.min(tickPrice, tickLow),
          close: tickPrice,
          volume: tickVolume
        });
      } else {
        existing.high = Math.max(existing.high, tickPrice, tickHigh);
        existing.low = Math.min(existing.low, tickPrice, tickLow);
        existing.close = tickPrice;
        existing.volume += tickVolume;
      }
    }

    const liveCandles = Array.from(barsByTime.values()).sort((a, b) => a.time - b.time);
    const liveVolumes = liveCandles.map((bar) => ({
      time: bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    }));

    const combinedCandles = [...baseHistoryRef.current, ...liveCandles];
    const combinedVolumes = [...baseVolumeRef.current, ...liveVolumes];

    candleSeriesRef.current.setData(combinedCandles);
    volumeSeriesRef.current.setData(combinedVolumes);

    const latestCandle = liveCandles[liveCandles.length - 1] || combinedCandles[combinedCandles.length - 1] || null;
    setDisplayCandle(latestCandle);
  }, [tickerIntraday, replayIndex, currentPrice]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header with ticker info and controls */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CandlestickChart className="w-3 h-3" />
            <span>Chart</span>
          </div>
          
          {selectedTicker && (
            <div className="flex items-center gap-3 pl-3 border-l border-terminal-border">
              <span className="text-terminal-text font-medium">
                {selectedTicker}
              </span>
              {currentPrice && (
                <span className="font-mono text-terminal-text">
                  ${currentPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChartType('candle')}
            className={`p-1.5 rounded ${chartType === 'candle' ? 'bg-terminal-accent' : 'hover:bg-terminal-border'}`}
            title="Candlestick"
          >
            <CandlestickChart className="w-3 h-3" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded ${chartType === 'line' ? 'bg-terminal-accent' : 'hover:bg-terminal-border'}`}
            title="Line"
          >
            <LineChart className="w-3 h-3" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-terminal-accent' : 'hover:bg-terminal-border'}`}
            title="Bar"
          >
            <BarChart3 className="w-3 h-3" />
          </button>
          
          <div className="w-px h-4 bg-terminal-border mx-1" />
          
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="p-1.5 rounded hover:bg-terminal-border"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 relative">
        {selectedTicker ? (
          <div ref={chartContainerRef} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-terminal-muted">
            <div className="text-center">
              <CandlestickChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a ticker from the watchlist</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Price Legend / OHLC Display */}
      {selectedTicker && (displayCandle || (tickerData && tickerData.length > 0)) && (
        <div className="px-3 py-2 border-t border-terminal-border flex items-center gap-4 text-xs font-mono">
          <span className="text-terminal-muted">O:</span>
          <span>{displayValue(displayCandle?.open ?? tickerData[tickerData.length - 1]?.open)}</span>
          <span className="text-terminal-muted">H:</span>
          <span className="text-gain">{displayValue(displayCandle?.high ?? tickerData[tickerData.length - 1]?.high)}</span>
          <span className="text-terminal-muted">L:</span>
          <span className="text-loss">{displayValue(displayCandle?.low ?? tickerData[tickerData.length - 1]?.low)}</span>
          <span className="text-terminal-muted">C:</span>
          <span>{displayValue(currentPrice ?? displayCandle?.close ?? tickerData[tickerData.length - 1]?.close)}</span>
          <span className="text-terminal-muted">V:</span>
          <span>{formatVolume(displayCandle?.volume ?? tickerData[tickerData.length - 1]?.volume)}</span>
        </div>
      )}
    </div>
  );
}

const LIVE_CANDLE_INTERVAL_SECONDS = 5 * 60;

function toUnixTimestamp(value) {
  if (!value) return 0;

  const normalized = value.includes('T')
    ? (value.endsWith('Z') ? value : `${value}Z`)
    : `${value}T00:00:00Z`;

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : 0;
}

function displayValue(value) {
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(2);
}

function formatVolume(value) {
  if (!value) return '--';
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

export default ChartPanel;
