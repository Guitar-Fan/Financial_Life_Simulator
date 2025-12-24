/**
 * SummaryMode.js - Financial Summary and Analytics mode
 * Shows comprehensive financial metrics, charts, and educational breakdowns
 */

class SummaryMode {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.panel = document.getElementById('summary-panel');
        this.charts = {};
    }
    
    render() {
        this.panel.innerHTML = `
            <!-- Row 1: Key Metrics -->
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, #4ADE80 0%, #22c55e 100%);">💰</div>
                    <div class="summary-card-title">Cash Position</div>
                </div>
                <div id="cash-metrics"></div>
            </div>
            
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, #F472B6 0%, #ec4899 100%);">📈</div>
                    <div class="summary-card-title">Profitability</div>
                </div>
                <div id="profit-metrics"></div>
            </div>
            
            <!-- Row 2: Charts -->
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, #60A5FA 0%, #3b82f6 100%);">📊</div>
                    <div class="summary-card-title">Revenue Trend</div>
                </div>
                <div class="chart-container">
                    <canvas id="revenue-chart"></canvas>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, var(--accent) 0%, var(--warning) 100%);">🥧</div>
                    <div class="summary-card-title">Sales by Category</div>
                </div>
                <div class="chart-container">
                    <canvas id="category-chart"></canvas>
                </div>
            </div>
            
            <!-- Row 3: Inventory & Operations -->
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);">📦</div>
                    <div class="summary-card-title">Inventory Status</div>
                </div>
                <div id="inventory-metrics"></div>
            </div>
            
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);">🎯</div>
                    <div class="summary-card-title">Key Performance Indicators</div>
                </div>
                <div id="kpi-metrics"></div>
            </div>
            
            <!-- Row 4: Full width - Financial Education -->
            <div class="summary-card full-width">
                <div class="summary-card-header">
                    <div class="summary-card-icon" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);">📚</div>
                    <div class="summary-card-title">Financial Terms Explained</div>
                </div>
                <div id="financial-terms"></div>
            </div>
        `;
        
        this.renderCashMetrics();
        this.renderProfitMetrics();
        this.renderInventoryMetrics();
        this.renderKPIMetrics();
        this.renderFinancialTerms();
        this.renderCharts();
    }
    
    renderCashMetrics() {
        const container = document.getElementById('cash-metrics');
        if (!container) return;
        
        const metrics = this.engine.getFinancialMetrics();
        const daily = this.engine.getDailySummary();
        
        container.innerHTML = `
            <div class="summary-metric">
                <span class="summary-metric-label">Current Cash</span>
                <span class="summary-metric-value positive">${this.ui.formatCurrency(metrics.cash)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Inventory Value</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(metrics.inventoryValue)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Total Assets</span>
                <span class="summary-metric-value positive">${this.ui.formatCurrency(metrics.totalAssets)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Starting Capital</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(GAME_CONFIG.STARTING_CASH)}</span>
            </div>
            
            <div class="summary-highlight">
                <div class="summary-highlight-label">Net Worth Change</div>
                <div class="summary-highlight-value" style="color: ${metrics.totalAssets >= GAME_CONFIG.STARTING_CASH ? 'var(--success)' : 'var(--danger)'}">
                    ${metrics.totalAssets >= GAME_CONFIG.STARTING_CASH ? '+' : ''}${this.ui.formatCurrency(metrics.totalAssets - GAME_CONFIG.STARTING_CASH)}
                </div>
            </div>
        `;
    }
    
    renderProfitMetrics() {
        const container = document.getElementById('profit-metrics');
        if (!container) return;
        
        const metrics = this.engine.getFinancialMetrics();
        const daily = this.engine.getDailySummary();
        
        container.innerHTML = `
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="Total money from all sales">Total Revenue</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="Revenue minus cost of goods sold">Total Gross Profit</span>
                <span class="summary-metric-value ${metrics.totalProfit >= 0 ? 'positive' : 'negative'}">${this.ui.formatCurrency(metrics.totalProfit)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="Gross profit as % of revenue. Bakery target: 60-70%">Gross Margin</span>
                <span class="summary-metric-value ${parseFloat(metrics.grossMarginPct) >= 50 ? 'positive' : 'negative'}">${metrics.grossMarginPct}%</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Avg Daily Revenue</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(metrics.avgDailyRevenue)}</span>
            </div>
            
            <div class="summary-highlight" style="background: ${daily.grossProfit >= 0 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)'}; border-color: ${daily.grossProfit >= 0 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'};">
                <div class="summary-highlight-label">Today's Gross Profit</div>
                <div class="summary-highlight-value" style="color: ${daily.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                    ${this.ui.formatCurrency(daily.grossProfit)}
                </div>
            </div>
        `;
    }
    
    renderInventoryMetrics() {
        const container = document.getElementById('inventory-metrics');
        if (!container) return;
        
        const inventoryValue = this.engine.getInventoryValue();
        const metrics = this.engine.getFinancialMetrics();
        
        // Count products and ingredients
        let totalProducts = 0;
        let totalIngredients = 0;
        let lowStockItems = 0;
        
        Object.values(this.engine.products).forEach(p => totalProducts += p.quantity);
        Object.entries(this.engine.ingredients).forEach(([key, inv]) => {
            totalIngredients += inv.quantity;
            if (inv.quantity < 10 && inv.quantity > 0) lowStockItems++;
        });
        
        container.innerHTML = `
            <div class="summary-metric">
                <span class="summary-metric-label">Raw Materials Value</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(inventoryValue.ingredients)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Finished Goods Value</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(inventoryValue.products)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Products in Display</span>
                <span class="summary-metric-value neutral">${totalProducts}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="Product loss from spoilage or waste">Shrinkage Rate</span>
                <span class="summary-metric-value ${parseFloat(metrics.shrinkageRate) < 3 ? 'positive' : 'negative'}">${metrics.shrinkageRate}%</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Low Stock Alerts</span>
                <span class="summary-metric-value ${lowStockItems > 0 ? 'negative' : 'positive'}">${lowStockItems}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Pending Deliveries</span>
                <span class="summary-metric-value neutral">${this.engine.pendingOrders.length}</span>
            </div>
        `;
    }
    
    renderKPIMetrics() {
        const container = document.getElementById('kpi-metrics');
        if (!container) return;
        
        const metrics = this.engine.getFinancialMetrics();
        const daily = this.engine.getDailySummary();
        
        // Calculate additional KPIs
        const avgItemValue = daily.itemsSold > 0 ? daily.revenue / daily.itemsSold : 0;
        const conversionRate = daily.customersServed > 0 && daily.stockouts > 0 
            ? ((daily.customersServed / (daily.customersServed + daily.stockouts)) * 100).toFixed(1)
            : 100;
        
        container.innerHTML = `
            <div class="summary-metric">
                <span class="summary-metric-label">Total Customers Served</span>
                <span class="summary-metric-value neutral">${metrics.customersToDate}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Today's Customers</span>
                <span class="summary-metric-value neutral">${daily.customersServed}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="Average revenue per transaction">Avg Ticket Size</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(daily.avgTicket)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Avg Item Value</span>
                <span class="summary-metric-value neutral">${this.ui.formatCurrency(avgItemValue)}</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label term-tooltip" data-tooltip="% of customers who found something to buy">Service Rate</span>
                <span class="summary-metric-value ${parseFloat(conversionRate) >= 90 ? 'positive' : 'negative'}">${conversionRate}%</span>
            </div>
            <div class="summary-metric">
                <span class="summary-metric-label">Days Operated</span>
                <span class="summary-metric-value neutral">${this.engine.allTimeStats.daysOperated}</span>
            </div>
        `;
    }
    
    renderFinancialTerms() {
        const container = document.getElementById('financial-terms');
        if (!container) return;
        
        const terms = GAME_CONFIG.FINANCIAL_TERMS;
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                ${Object.entries(terms).map(([key, description]) => `
                    <div style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 12px;
                        padding: 15px;
                        border-left: 3px solid var(--accent);
                    ">
                        <div style="
                            font-family: 'Fredoka', sans-serif;
                            font-size: 14px;
                            color: var(--accent);
                            margin-bottom: 6px;
                        ">${key.replace(/_/g, ' ')}</div>
                        <div style="
                            font-size: 12px;
                            color: rgba(255,255,255,0.7);
                            line-height: 1.5;
                        ">${description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderCharts() {
        this.renderRevenueChart();
        this.renderCategoryChart();
    }
    
    renderRevenueChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }
        
        const history = this.engine.dailyHistory;
        const labels = history.map(h => `Day ${h.day}`);
        const revenueData = history.map(h => h.revenue);
        const profitData = history.map(h => h.grossProfit);
        
        // Add current day if not in history
        if (this.engine.dailyStats.revenue > 0) {
            labels.push(`Day ${this.engine.day}`);
            revenueData.push(this.engine.dailyStats.revenue);
            profitData.push(this.engine.dailyStats.grossProfit);
        }
        
        this.charts.revenue = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels.length > 0 ? labels : ['Day 1'],
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenueData.length > 0 ? revenueData : [0],
                        borderColor: '#4ADE80',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Gross Profit',
                        data: profitData.length > 0 ? profitData : [0],
                        borderColor: '#F472B6',
                        backgroundColor: 'rgba(244, 114, 182, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'rgba(255,255,255,0.7)' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.5)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { 
                            color: 'rgba(255,255,255,0.5)',
                            callback: (value) => '$' + value
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    renderCategoryChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        // Calculate sales by category
        const categoryTotals = {
            bread: 0,
            pastry: 0,
            cookie: 0,
            cake: 0
        };
        
        Object.entries(this.engine.products).forEach(([key, product]) => {
            const recipe = GAME_CONFIG.RECIPES[key];
            if (recipe && product.soldToday > 0) {
                categoryTotals[recipe.category] += product.soldToday * recipe.retailPrice;
            }
        });
        
        const hasData = Object.values(categoryTotals).some(v => v > 0);
        
        this.charts.category = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Bread', 'Pastry', 'Cookies', 'Cakes'],
                datasets: [{
                    data: hasData ? [
                        categoryTotals.bread,
                        categoryTotals.pastry,
                        categoryTotals.cookie,
                        categoryTotals.cake
                    ] : [25, 25, 25, 25],
                    backgroundColor: [
                        '#F4A460',
                        '#FFD700',
                        '#D2691E',
                        '#F472B6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: 'rgba(255,255,255,0.7)',
                            padding: 15
                        }
                    }
                }
            }
        });
    }
    
    refresh() {
        this.renderCashMetrics();
        this.renderProfitMetrics();
        this.renderInventoryMetrics();
        this.renderKPIMetrics();
        this.renderCharts();
    }
}

// Make globally available
window.SummaryMode = SummaryMode;
