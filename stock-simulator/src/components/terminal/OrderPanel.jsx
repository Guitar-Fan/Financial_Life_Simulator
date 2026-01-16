/**
 * OrderPanel - Trade execution interface
 * 
 * Features:
 * - Order type selection (Market, Limit, Stop, Stop-Limit)
 * - Quantity input with position sizing helper
 * - Price input for limit orders
 * - Order preview with cost/proceeds calculation
 * 
 * Educational Purpose: Teaches the mechanics of order execution,
 * the difference between order types, and the concept of slippage.
 */

import React, { useState, useMemo } from 'react';
import { ShoppingCart, AlertTriangle, Calculator, Lock } from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';
import { usePlayerStore } from '../../stores/playerStore';

export function OrderPanel() {
  const { selectedTicker, tickers } = useMarketStore();
  const { 
    cash, 
    positions, 
    unlockedOrderTypes, 
    placeOrder, 
    fillOrder 
  } = usePlayerStore();
  
  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  
  const tickerData = tickers[selectedTicker];
  const currentPrice = tickerData?.price || 0;
  const bidPrice = tickerData?.bid || currentPrice * 0.999;
  const askPrice = tickerData?.ask || currentPrice * 1.001;
  
  const position = positions[selectedTicker];
  const positionShares = position?.shares || 0;
  
  // Calculate order preview
  const orderPreview = useMemo(() => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0 || !currentPrice) return null;
    
    let executionPrice = side === 'BUY' ? askPrice : bidPrice;
    
    // Add slippage estimate for market orders
    const slippageBps = orderType === 'MARKET' ? 5 : 0; // 5 basis points
    if (orderType === 'MARKET') {
      executionPrice = side === 'BUY' 
        ? executionPrice * (1 + slippageBps / 10000)
        : executionPrice * (1 - slippageBps / 10000);
    } else if (orderType === 'LIMIT') {
      executionPrice = parseFloat(limitPrice) || executionPrice;
    }
    
    const totalValue = qty * executionPrice;
    const commission = 0; // Commission-free trading (modern brokers)
    const totalCost = side === 'BUY' ? totalValue + commission : totalValue - commission;
    
    return {
      quantity: qty,
      executionPrice,
      totalValue,
      commission,
      totalCost,
      slippageBps: orderType === 'MARKET' ? slippageBps : 0
    };
  }, [quantity, side, orderType, limitPrice, currentPrice, askPrice, bidPrice]);
  
  // Validation
  const validation = useMemo(() => {
    const errors = [];
    const qty = parseInt(quantity) || 0;
    
    if (!selectedTicker) {
      errors.push('Select a ticker first');
    }
    
    if (qty <= 0) {
      errors.push('Enter a valid quantity');
    }
    
    if (side === 'BUY' && orderPreview && orderPreview.totalCost > cash) {
      errors.push('Insufficient funds');
    }
    
    if (side === 'SELL' && qty > positionShares) {
      errors.push(`Only ${positionShares} shares available`);
    }
    
    if (orderType === 'LIMIT' && !limitPrice) {
      errors.push('Enter a limit price');
    }
    
    if (orderType === 'STOP' && !stopPrice) {
      errors.push('Enter a stop price');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [selectedTicker, quantity, side, orderPreview, cash, positionShares, orderType, limitPrice, stopPrice]);
  
  // Handle order submission
  const handleSubmit = () => {
    if (!validation.isValid || !orderPreview) return;
    
    const order = {
      ticker: selectedTicker,
      side,
      type: orderType,
      quantity: orderPreview.quantity,
      limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : null,
      stopPrice: orderType === 'STOP' || orderType === 'STOP_LIMIT' ? parseFloat(stopPrice) : null
    };
    
    placeOrder(order);
    
    // For market orders, execute immediately (simulated)
    if (orderType === 'MARKET') {
      setTimeout(() => {
        const state = usePlayerStore.getState();
        const pendingOrder = state.orders.find(
          o => o.ticker === selectedTicker && o.status === 'PENDING'
        );
        if (pendingOrder) {
          fillOrder(pendingOrder.id, orderPreview.executionPrice, orderPreview.quantity);
        }
      }, 100 + Math.random() * 200); // Simulate execution delay
    }
    
    // Reset form
    setQuantity('');
    setLimitPrice('');
    setStopPrice('');
  };
  
  // Quick quantity buttons
  const setQuickQuantity = (multiplier) => {
    if (!currentPrice) return;
    
    if (side === 'BUY') {
      const maxShares = Math.floor((cash * multiplier) / askPrice);
      setQuantity(maxShares.toString());
    } else {
      const shares = Math.floor(positionShares * multiplier);
      setQuantity(shares.toString());
    }
  };

  const orderTypes = [
    { value: 'MARKET', label: 'Market', locked: false },
    { value: 'LIMIT', label: 'Limit', locked: !unlockedOrderTypes.includes('LIMIT') },
    { value: 'STOP', label: 'Stop', locked: !unlockedOrderTypes.includes('STOP') },
    { value: 'STOP_LIMIT', label: 'Stop-Limit', locked: !unlockedOrderTypes.includes('STOP_LIMIT') }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-3 h-3" />
          <span>Order Entry</span>
        </div>
        {selectedTicker && (
          <span className="text-terminal-text font-medium">{selectedTicker}</span>
        )}
      </div>
      
      {/* Order Form */}
      <div className="flex-1 p-3 overflow-auto">
        {selectedTicker ? (
          <div className="space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('BUY')}
                className={`py-2 font-medium rounded-sm transition-colors ${
                  side === 'BUY'
                    ? 'bg-gain text-white'
                    : 'bg-terminal-border text-terminal-muted hover:text-terminal-text'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`py-2 font-medium rounded-sm transition-colors ${
                  side === 'SELL'
                    ? 'bg-loss text-white'
                    : 'bg-terminal-border text-terminal-muted hover:text-terminal-text'
                }`}
              >
                SELL
              </button>
            </div>
            
            {/* Order Type */}
            <div>
              <label className="block text-xs text-terminal-muted mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-1">
                {orderTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => !type.locked && setOrderType(type.value)}
                    disabled={type.locked}
                    className={`py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center justify-center gap-1 ${
                      orderType === type.value
                        ? 'bg-terminal-accent text-white'
                        : type.locked
                        ? 'bg-terminal-border text-terminal-muted/50 cursor-not-allowed'
                        : 'bg-terminal-border text-terminal-muted hover:text-terminal-text'
                    }`}
                  >
                    {type.locked && <Lock className="w-3 h-3" />}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity */}
            <div>
              <label className="block text-xs text-terminal-muted mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder="0"
                min="1"
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setQuickQuantity(0.25)}
                  className="flex-1 py-1 text-xxs bg-terminal-border rounded hover:bg-terminal-muted/20"
                >
                  25%
                </button>
                <button
                  onClick={() => setQuickQuantity(0.5)}
                  className="flex-1 py-1 text-xxs bg-terminal-border rounded hover:bg-terminal-muted/20"
                >
                  50%
                </button>
                <button
                  onClick={() => setQuickQuantity(0.75)}
                  className="flex-1 py-1 text-xxs bg-terminal-border rounded hover:bg-terminal-muted/20"
                >
                  75%
                </button>
                <button
                  onClick={() => setQuickQuantity(1)}
                  className="flex-1 py-1 text-xxs bg-terminal-border rounded hover:bg-terminal-muted/20"
                >
                  100%
                </button>
              </div>
            </div>
            
            {/* Limit Price (conditional) */}
            {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
              <div>
                <label className="block text-xs text-terminal-muted mb-1">Limit Price</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="input-field"
                  placeholder={currentPrice.toFixed(2)}
                  step="0.01"
                />
              </div>
            )}
            
            {/* Stop Price (conditional) */}
            {(orderType === 'STOP' || orderType === 'STOP_LIMIT') && (
              <div>
                <label className="block text-xs text-terminal-muted mb-1">Stop Price</label>
                <input
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="input-field"
                  placeholder={currentPrice.toFixed(2)}
                  step="0.01"
                />
              </div>
            )}
            
            {/* Order Preview */}
            {orderPreview && (
              <div className="p-2 bg-terminal-bg rounded border border-terminal-border">
                <div className="text-xs text-terminal-muted mb-2">Order Preview</div>
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Est. Price:</span>
                    <span>${orderPreview.executionPrice.toFixed(2)}</span>
                  </div>
                  {orderPreview.slippageBps > 0 && (
                    <div className="flex justify-between text-yellow-500">
                      <span>Slippage:</span>
                      <span>~{orderPreview.slippageBps} bps</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-terminal-border pt-1 mt-1">
                    <span className="text-terminal-muted">
                      {side === 'BUY' ? 'Total Cost:' : 'Proceeds:'}
                    </span>
                    <span className={side === 'BUY' ? 'text-loss' : 'text-gain'}>
                      ${orderPreview.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Validation Errors */}
            {validation.errors.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-loss/10 border border-loss/30 rounded">
                <AlertTriangle className="w-4 h-4 text-loss flex-shrink-0 mt-0.5" />
                <div className="text-xs text-loss">
                  {validation.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!validation.isValid}
              className={`w-full py-3 font-medium rounded-sm transition-colors ${
                side === 'BUY' ? 'btn-buy' : 'btn-sell'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {side === 'BUY' ? 'Buy' : 'Sell'} {selectedTicker}
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-terminal-muted text-center">
            <div>
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a ticker to trade</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderPanel;
