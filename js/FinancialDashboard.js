/**
 * FinancialDashboard.js
 * Comprehensive financial analytics with Chart.js visualizations
 */

class FinancialDashboard {
    constructor(gameController) {
        this.game = gameController;
        this.isOpen = false;
    }
    
    show() {
        this.isOpen = true;
        const container = document.getElementById('game-container');
        
        container.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h2>📊 Financial Dashboard & Analytics</h2>
                    <button class="btn btn-secondary" id="btn-close-dashboard">✕ Close</button>
                </div>
                
                <div class="dashboard-tabs">
                    <button class="dashboard-tab active" data-tab="overview">Overview</button>
                    <button class="dashboard-tab" data-tab="market">Market Conditions</button>
                    <button class="dashboard-tab" data-tab="business">Business Performance</button>
                    <button class="dashboard-tab" data-tab="pricing">Pricing Analysis</button>
                </div>
                
                <div class="dashboard-content">
                    <div id="tab-overview" class="tab-panel active"></div>
                    <div id="tab-market" class="tab-panel"></div>
                    <div id="tab-business" class="tab-panel"></div>
                    <div id="tab-pricing" class="tab-panel"></div>
                </div>
            </div>
        `;
        
        this.setupTabs();
        this.renderOverview();
        
        document.getElementById('btn-close-dashboard').onclick = () => {
            this.close();
        };
    }
    
    setupTabs() {
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.onclick = () => {
                // Update active tab
                document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active panel
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                const panelId = 'tab-' + tab.dataset.tab;
                document.getElementById(panelId).classList.add('active');
                
                // Render content
                switch(tab.dataset.tab) {
                    case 'overview': this.renderOverview(); break;
                    case 'market': this.renderMarket(); break;
                    case 'business': this.renderBusiness(); break;
                    case 'pricing': this.renderPricing(); break;
                }
            };
        });
    }
    
    renderOverview() {
        const panel = document.getElementById('tab-overview');
        const econ = this.game.economy;
        if (!econ) {
            panel.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Economy system not initialized</p>';
            return;
        }
        const summary = econ.getSummary();
        const engine = this.game.engine;
        
        panel.innerHTML = `
            <div class="overview-grid">
                <div class="overview-card">
                    <h3>📅 Current Status</h3>
                    <div class="stat-row"><span>Day:</span><span><strong>${summary.day}</strong></span></div>
                    <div class="stat-row"><span>Season:</span><span>${summary.season}</span></div>
                    <div class="stat-row"><span>Day of Week:</span><span>${summary.dayOfWeek}</span></div>
                    <div class="stat-row"><span>Cash:</span><span style="color: ${engine.cash >= 0 ? '#27ae60' : '#e74c3c'}"><strong>$${engine.cash.toFixed(2)}</strong></span></div>
                </div>
                
                <div class="overview-card">
                    <h3>📈 Economic Indicators</h3>
                    <div class="stat-row"><span>Inflation (Annual):</span><span>${summary.inflation.annual}</span></div>
                    <div class="stat-row"><span>Trend:</span><span>${summary.inflation.trend}</span></div>
                    <div class="stat-row"><span>Interest Rates:</span><span>Base + ${(econ.inflation.current * 2 * 100).toFixed(1)}%</span></div>
                </div>
                
                <div class="overview-card">
                    <h3>🌾 Market Conditions</h3>
                    ${Object.entries(summary.marketConditions).map(([cat, cond]) => `
                        <div class="stat-row">
                            <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</span>
                            <span>Supply ${(cond.supply * 100).toFixed(0)}% | Demand ${(cond.demand * 100).toFixed(0)}%</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="overview-card">
                    <h3>⚡ Active Events</h3>
                    ${summary.activeEvents.length > 0 ? summary.activeEvents.map(e => `
                        <div class="event-item">
                            <strong>${e.name}</strong>
                            <div style="font-size: 12px; color: #7f8c8d;">${e.description}</div>
                            <div style="font-size: 11px; color: #e67e22;">Expires in ${e.daysRemaining} days</div>
                        </div>
                    `).join('') : '<p style="color: #95a5a6;">No active economic events</p>'}
                </div>
            </div>
            
            <div class="chart-section">
                <h3>Inflation Trend (Last 90 Days)</h3>
                <canvas id="chart-inflation" height="80"></canvas>
            </div>
        `;
        
        this.renderInflationChart();
    }
    
    renderMarket() {
        const panel = document.getElementById('tab-market');
        const econ = this.game.economy;
        if (!econ || !econ.ingredientPrices) {
            panel.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Economy system not initialized</p>';
            return;
        }
        
        panel.innerHTML = `
            <h3>Ingredient Price Trends</h3>
            <div class="price-cards">
                ${Object.entries(GAME_CONFIG.INGREDIENTS).map(([key, ing]) => {
                    const basePrice = ing.basePrice;
                    const currentMultiplier = econ.ingredientPrices[key];
                    const currentPrice = basePrice * currentMultiplier;
                    const change = ((currentMultiplier - 1) * 100).toFixed(1);
                    const changeColor = currentMultiplier >= 1 ? '#e74c3c' : '#27ae60';
                    const changeSymbol = currentMultiplier >= 1 ? '▲' : '▼';
                    
                    return `
                        <div class="price-card">
                            <div class="price-header">
                                <span>${ing.icon} ${ing.name}</span>
                                <span class="price-current">$${currentPrice.toFixed(2)}/${ing.unit}</span>
                            </div>
                            <div class="price-details">
                                <div>Base: $${basePrice.toFixed(2)}</div>
                                <div style="color: ${changeColor};">${changeSymbol} ${Math.abs(parseFloat(change))}%</div>
                            </div>
                            <div class="price-bar">
                                <div class="price-bar-fill" style="width: ${Math.min(100, currentMultiplier * 50)}%; background: ${changeColor};"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="chart-section" style="margin-top: 30px;">
                <h3>Price History (Select Ingredient)</h3>
                <select id="ingredient-selector" class="form-select">
                    ${Object.entries(GAME_CONFIG.INGREDIENTS).map(([key, ing]) => 
                        `<option value="${key}">${ing.icon} ${ing.name}</option>`
                    ).join('')}
                </select>
                <canvas id="chart-ingredient-price" height="80"></canvas>
            </div>
            
            <div class="chart-section">
                <h3>Supply vs Demand by Category</h3>
                <canvas id="chart-supply-demand" height="80"></canvas>
            </div>
        `;
        
        this.renderIngredientPriceChart(Object.keys(GAME_CONFIG.INGREDIENTS)[0]);
        this.renderSupplyDemandChart();
        
        document.getElementById('ingredient-selector').onchange = (e) => {
            this.renderIngredientPriceChart(e.target.value);
        };
    }
    
    renderBusiness() {
        const panel = document.getElementById('tab-business');
        const econ = this.game.economy;
        const engine = this.game.engine;
        if (!econ) {
            panel.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Economy system not initialized</p>';
            return;
        }
        
        // Calculate KPIs
        const recentRevenue = econ.history.revenue.slice(-30);
        const avgRevenue = recentRevenue.length > 0 ? 
            recentRevenue.reduce((s, r) => s + r.value, 0) / recentRevenue.length : 0;
        
        const recentCosts = econ.history.costs.slice(-30);
        const avgCosts = recentCosts.length > 0 ?
            recentCosts.reduce((s, c) => s + c.value, 0) / recentCosts.length : 0;
        
        const grossMargin = avgRevenue > 0 ? ((avgRevenue - avgCosts) / avgRevenue * 100).toFixed(1) : 0;
        
        panel.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Current Cash</div>
                    <div class="kpi-value" style="color: ${engine.cash >= 0 ? '#27ae60' : '#e74c3c'};">$${engine.cash.toFixed(2)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Avg Daily Revenue (30d)</div>
                    <div class="kpi-value">$${avgRevenue.toFixed(2)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Avg Daily Costs (30d)</div>
                    <div class="kpi-value">$${avgCosts.toFixed(2)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Gross Margin</div>
                    <div class="kpi-value" style="color: ${grossMargin >= 30 ? '#27ae60' : '#e67e22'};">${grossMargin}%</div>
                </div>
            </div>
            
            <div class="chart-section">
                <h3>Revenue vs Costs</h3>
                <canvas id="chart-revenue-costs" height="80"></canvas>
            </div>
            
            <div class="chart-section">
                <h3>Profit Trend</h3>
                <canvas id="chart-profit" height="80"></canvas>
            </div>
            
            <div class="chart-section">
                <h3>Cash Flow</h3>
                <canvas id="chart-cash" height="80"></canvas>
            </div>
        `;
        
        this.renderRevenueChart();
        this.renderProfitChart();
        this.renderCashChart();
    }
    
    renderPricing() {
        const panel = document.getElementById('tab-pricing');
        const engine = this.game.engine;
        
        panel.innerHTML = `
            <h3>Product Pricing Strategy</h3>
            <p style="color: #7f8c8d; margin-bottom: 20px;">Analyze pricing impact on demand and profitability</p>
            
            <div class="pricing-grid">
                ${Object.entries(GAME_CONFIG.RECIPES).map(([key, recipe]) => {
                    const cost = engine.calculateProductCost ? engine.calculateProductCost(key) : 0;
                    const price = recipe.retailPrice;
                    const margin = price > 0 ? ((price - cost) / price * 100).toFixed(1) : 0;
                    const markup = cost > 0 ? ((price - cost) / cost * 100).toFixed(1) : 0;
                    
                    return `
                        <div class="pricing-card">
                            <div class="pricing-header">
                                <span style="font-size: 24px;">${recipe.icon}</span>
                                <div>
                                    <div style="font-weight: bold;">${recipe.name}</div>
                                    <div style="font-size: 12px; color: #7f8c8d;">${recipe.category}</div>
                                </div>
                            </div>
                            <div class="pricing-stats">
                                <div class="stat-row"><span>Cost:</span><span>$${cost.toFixed(2)}</span></div>
                                <div class="stat-row"><span>Price:</span><span><strong>$${price.toFixed(2)}</strong></span></div>
                                <div class="stat-row"><span>Margin:</span><span style="color: ${margin >= 40 ? '#27ae60' : '#e67e22'};">${margin}%</span></div>
                                <div class="stat-row"><span>Markup:</span><span>${markup}%</span></div>
                            </div>
                            <div style="margin-top: 10px; padding: 8px; background: #ecf0f1; border-radius: 4px; font-size: 11px;">
                                💡 Recommended: ${cost > 0 ? `$${(cost * 2.5).toFixed(2)} - $${(cost * 3.5).toFixed(2)}` : 'N/A'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="chart-section" style="margin-top: 30px;">
                <h3>Price Elasticity Simulator</h3>
                <p style="font-size: 13px; color: #7f8c8d;">How would demand change at different price points?</p>
                <canvas id="chart-elasticity" height="80"></canvas>
            </div>
        `;
        
        this.renderElasticityChart();
    }
    
    // Chart rendering methods
    renderInflationChart() {
        const ctx = document.getElementById('chart-inflation');
        if (!ctx) return;
        
        const data = this.game.economy.history.inflation || [];
        if (data.length === 0) {
            ctx.parentElement.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No data yet - play more days to see trends</p>';
            return;
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => `Day ${d.day}`),
                datasets: [{
                    label: 'Inflation Rate (Annual %)',
                    data: data.map(d => d.rate ? (d.rate * 100).toFixed(2) : 3.0),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'Annual %' } }
                }
            }
        });
    }
    
    renderIngredientPriceChart(ingredientKey) {
        const ctx = document.getElementById('chart-ingredient-price');
        if (!ctx) return;
        
        const data = this.game.economy.history.ingredientPrices[ingredientKey] || [];
        if (data.length === 0) {
            if (this.ingredientChart) this.ingredientChart.destroy();
            ctx.parentElement.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No price history yet</p>';
            return;
        }
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        
        // Destroy previous chart
        if (this.ingredientChart) this.ingredientChart.destroy();
        
        this.ingredientChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => `Day ${d.day}`),
                datasets: [{
                    label: `${ingredient.name} Price Multiplier`,
                    data: data.map(d => (d.multiplier || 1.0).toFixed(3)),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    annotation: {
                        annotations: {
                            baseline: {
                                type: 'line',
                                yMin: 1.0,
                                yMax: 1.0,
                                borderColor: '#95a5a6',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: { content: 'Base Price', enabled: true }
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'Price Multiplier' } }
                }
            }
        });
    }
    
    renderSupplyDemandChart() {
        const ctx = document.getElementById('chart-supply-demand');
        if (!ctx) return;
        
        const conditions = this.game.economy.marketConditions;
        const categories = Object.keys(conditions);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                datasets: [
                    {
                        label: 'Supply',
                        data: categories.map(c => (conditions[c].supply * 100).toFixed(0)),
                        backgroundColor: '#27ae60'
                    },
                    {
                        label: 'Demand',
                        data: categories.map(c => (conditions[c].demand * 100).toFixed(0)),
                        backgroundColor: '#e74c3c'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: true, max: 150, title: { display: true, text: 'Level (%)' } }
                }
            }
        });
    }
    
    renderRevenueChart() {
        const ctx = document.getElementById('chart-revenue-costs');
        if (!ctx) return;
        
        const revenue = this.game.economy.history.revenue;
        const costs = this.game.economy.history.costs;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenue.map(d => `Day ${d.day}`),
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenue.map(d => d.value.toFixed(2)),
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Costs',
                        data: costs.map(d => d.value.toFixed(2)),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } }
                }
            }
        });
    }
    
    renderProfitChart() {
        const ctx = document.getElementById('chart-profit');
        if (!ctx) return;
        
        const profit = this.game.economy.history.profit;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: profit.map(d => `Day ${d.day}`),
                datasets: [{
                    label: 'Daily Profit',
                    data: profit.map(d => d.value.toFixed(2)),
                    backgroundColor: profit.map(d => d.value >= 0 ? '#27ae60' : '#e74c3c')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Profit ($)' } }
                }
            }
        });
    }
    
    renderCashChart() {
        const ctx = document.getElementById('chart-cash');
        if (!ctx) return;
        
        const cash = this.game.economy.history.cashBalance;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: cash.map(d => `Day ${d.day}`),
                datasets: [{
                    label: 'Cash Balance',
                    data: cash.map(d => d.value.toFixed(2)),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'Cash ($)' } }
                }
            }
        });
    }
    
    renderElasticityChart() {
        const ctx = document.getElementById('chart-elasticity');
        if (!ctx) return;
        
        // Simulate price elasticity for bread
        const basePrice = 4.50;
        const prices = [];
        const demands = [];
        
        for (let i = 0.5; i <= 1.5; i += 0.1) {
            const price = basePrice * i;
            const priceChange = i - 1.0;
            const elasticity = -1.2; // From config
            const demandChange = elasticity * priceChange;
            const demand = Math.max(0, 100 * (1 + demandChange));
            
            prices.push(price.toFixed(2));
            demands.push(demand.toFixed(1));
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: prices,
                datasets: [{
                    label: 'Expected Demand (%)',
                    data: demands,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    x: { title: { display: true, text: 'Price ($)' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Demand (%)' } }
                }
            }
        });
    }
    
    close() {
        this.isOpen = false;
        // Return to previous phase or hub
        if (this.game.currentPhase === 'hub') {
            this.game.showModeHub();
        } else {
            this.game.goToPhase(this.game.currentPhase);
        }
    }
}

window.FinancialDashboard = FinancialDashboard;
