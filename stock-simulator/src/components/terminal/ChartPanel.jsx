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
  
  const [chartType, setChartType] = useState('candle'); // candle, line, area
  
  const { selectedTicker, historicalData, tickers } = useMarketStore();
  const tickerData = selectedTicker ? historicalData[selectedTicker] : null;
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

    // Transform data to Lightweight Charts format
    const candleData = tickerData.map(d => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }));

    const volumeData = tickerData.map(d => ({
      time: d.date,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Fit content to view
    chartRef.current?.timeScale().fitContent();
  }, [tickerData]);

  /**
   * Update last candle with real-time price
   * This creates the "live" effect as prices tick
   */
  useEffect(() => {
    if (!candleSeriesRef.current || !tickerData || !currentPrice) return;

    const lastCandle = tickerData[tickerData.length - 1];
    if (!lastCandle) return;

    // Update the last candle with current price
    candleSeriesRef.current.update({
      time: lastCandle.date,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, currentPrice),
      low: Math.min(lastCandle.low, currentPrice),
      close: currentPrice
    });
  }, [currentPrice, tickerData]);

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
      {selectedTicker && tickerData && tickerData.length > 0 && (
        <div className="px-3 py-2 border-t border-terminal-border flex items-center gap-4 text-xs font-mono">
          <span className="text-terminal-muted">O:</span>
          <span>{tickerData[tickerData.length - 1]?.open.toFixed(2)}</span>
          <span className="text-terminal-muted">H:</span>
          <span className="text-gain">{tickerData[tickerData.length - 1]?.high.toFixed(2)}</span>
          <span className="text-terminal-muted">L:</span>
          <span className="text-loss">{tickerData[tickerData.length - 1]?.low.toFixed(2)}</span>
          <span className="text-terminal-muted">C:</span>
          <span>{currentPrice?.toFixed(2) || tickerData[tickerData.length - 1]?.close.toFixed(2)}</span>
          <span className="text-terminal-muted">V:</span>
          <span>{formatVolume(tickerData[tickerData.length - 1]?.volume)}</span>
        </div>
      )}
    </div>
  );
}

function formatVolume(value) {
  if (!value) return '--';
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

export default ChartPanel;
