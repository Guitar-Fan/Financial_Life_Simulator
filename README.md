## Sweet Success Bakery Simulator

An immersive, browser-based financial simulation game where you build and run your own bakery.

### Features
- **Free-roam Hub:** Walk your character (WASD) to select game phases (Buy, Bake, Sell, Summary) in a custom-drawn bakery hub.
- **Setup Phase:** Choose location, handle paperwork, buy equipment, and hire staff in a city map before opening your bakery.
- **Interactive Tutorial:** Step-by-step guidance with floating dialogue and demo actions.
- **No Forced Progression:** Return to the hub after each phase; choose your next action freely.
- **Custom Graphics:** Phaser 3, GSAP, and SVG for all visuals (no emojis or stock art).
- **Core Gameplay:**
  - Buy ingredients from vendors
  - Bake products using recipes
  - Sell to customers with dynamic demand
  - Review daily financial summary

### Tech Stack
- **Phaser 3** (game engine, scenes, physics)
- **GSAP** (UI animation)
- **Vanilla JS** (game logic, UI overlays)

### How to Play
1. Start a new game and complete the setup phase in the city.
2. Enter the bakery hub and walk to a pad to choose a mode.
3. Buy, bake, sell, and review stats at your own pace.
4. Use the tutorial for a guided experience.

### Run Locally
Open `main.html` in your browser. No build step required.

---
Created by Guitar-Fan. Contributions welcome!

## 🎮 Game Overview

Run a profitable bakery for 12 months while learning critical business concepts:
- **COGS (Cost of Goods Sold)** - Track exact production costs using FIFO inventory
- **Just-In-Time (JIT) Ordering** - Manage supply chain with realistic lead times
- **Shrinkage Management** - Minimize waste from expired inventory
- **Financial KPIs** - Monitor Gross Margin, Inventory Turnover, and Cash Flow
- **Double-Entry Accounting** - See how purchases convert cash to inventory assets

### Starting Conditions
- **Capital**: $50,000
- **Goal**: Net worth ≥ $20,000 after 12 months
- **Bankruptcy**: Net worth < $5,000

## 🎯 Educational Objectives

### Core Financial Concepts

**1. COGS Calculation**
```
COGS = Beginning Inventory + Purchases - Ending Inventory
```
The game calculates COGS automatically using FIFO (First-In, First-Out) method, where the oldest ingredients are consumed first.

**2. Asset Valuation**
Every purchase converts liquid cash into inventory assets:
- Debit: Inventory (+)
- Credit: Cash (-)

**3. Gross Margin**
```
Gross Margin % = (Revenue - COGS) / Revenue × 100
```
Target: 78% (industry standard for bakeries)

**4. Inventory Turnover**
```
Inventory Turnover = COGS / Average Inventory Value
```
Target: 12x per year (1x per month)

### Realistic Business Parameters

All costs and pricing based on 2024-2025 industry standards:

**Sample Ingredient Costs:**
- All-Purpose Flour: $0.45/lb
- Butter: $3.50/lb  
- Eggs: $0.23 each
- Yeast: $4.50/lb

**Sample Product Pricing:**
- Basic Bread: $0.93 COGS → $3.50 retail (73% margin)
- Croissant: $2.28 COGS → $3.25 retail (30% margin)
- Layer Cake: $6.50 COGS → $35.00 retail (81% margin)

**Monthly Fixed Costs: $6,645**
- Rent: $3,800
- Utilities: $1,575
- Insurance: $350
- Maintenance: $400
- Other: $520

## 🕹️ Game Mechanics

### Phase-Based Time Control

**Time Paused:**
- Menu
- Purchasing supplies
- Production
- Day summary

**Time Flowing (1 game day = 90 real seconds):**
- Sales floor only
- Auto-closes at 8 PM with day summary

### Supply Chain System

**Delivery Lead Times:**
- Dairy products: 2 days (Mon/Thu deliveries)
- Dry goods: 3 days (Mon deliveries only)
- Packaging: 3 days

**Minimum Order Quantities (MOQ):**
- Flour: 100 lbs
- Butter: 20 lbs
- Eggs: 60 (5 dozen)

**Bulk Discounts:**
- Flour 201-500 lbs: 8% off
- Flour 501+ lbs: 15% off
- Butter 30+ lbs: 10% off

**Payment Terms:**
- Cash on Delivery: 2% discount (default)

### Product Shelf Life & Shrinkage

**Finished Products:**
- Bread: 1 day
- Croissants: 2 days
- Cookies: 5 days
- Cakes: 3 days

**Raw Ingredients:**
- Dairy: 7 days
- Eggs: 14 days
- Flour: 45 days

Expired items automatically move to waste bin, reducing inventory value without cash recovery.

### Customer Demand Patterns

**Time-of-Day Distribution:**
- 6-8 AM: 30% (morning rush)
- 11 AM-1 PM: 15% (lunch)
- 4-6 PM: 20% (after-work rush)

**Day-of-Week Distribution:**
- Saturday: 22% (peak)
- Friday: 18%
- Monday: 10% (lowest)

**Transaction Behavior:**
- Customers buy 1-3 items each
- Average transaction: $18

## 🚀 Getting Started

### Quick Start

1. Open `index.html` in a web browser
2. Click "New Game" or "Tutorial"
3. Optional: Complete 5-minute tutorial
4. Start managing your bakery!

### Tutorial (Recommended for First-Time Players)

The tutorial covers:
1. Purchasing supplies with MOQ and lead times
2. Waiting for deliveries (no skipping!)
3. Production with instant COGS calculation
4. FIFO inventory explanation
5. Opening shop for sales
6. Watching sales in real-time
7. Shrinkage demonstration
8. Day summary review
9. Financial KPI overview
10. Monthly expense mechanics

### Development Mode

Open browser console to access debug commands:

```javascript
GAME.getStatus()           // View current game state
GAME.addTestInventory()    // Add starter inventory
GAME.addCash(10000)        // Add money (cheat)
GAME.orderFlour(200)       // Order 200 lbs flour
GAME.produceBread(20)      // Produce 20 loaves
GAME.openShop()            // Open sales floor
GAME.reset()               // Restart game
```

## 📁 Project Structure

```
/workspaces/Financial_Life_Simulator/
├── index.html                              # Entry point with CDN imports
├── js/
│   ├── Realistic_Parameters.js             # All game constants and data
│   ├── Game_State_Manager.js               # Phase control & time flow
│   ├── Financial_Ledger_System.js          # Double-entry accounting
│   ├── Product_Costing_Engine.js           # FIFO inventory & COGS
│   ├── Supply_Chain_Manager.js             # Procurement & deliveries
│   ├── Geometric_Sprite_Factory.js         # Placeholder visual sprites
│   ├── Shop_Visual_Controller.js           # Phaser 3 scene & UI
│   ├── Tutorial_Manager.js                 # Tutorial system
│   ├── Economic_Simulation_Core.js         # Main game loop orchestrator
│   └── main.js                             # Initialization & entry point
├── README.md                               # This file
└── Bakery.png                              # Visual asset
```

## 🎨 Visual Design

Currently using **geometric placeholders** for MVP:
- **Blue rectangles**: Storage rooms
- **Red circles**: Waste bins  
- **Green rectangles**: Display cases
- **Orange rectangles**: Production areas
- **Colored squares**: Ingredients/products
- **Checkered floor**: Bakery background

Colors indicate freshness:
- Green: >3 days until expiration
- Yellow: 1-3 days
- Red: <1 day (urgent)

## 🔧 Technical Implementation

### Technologies
- **Phaser 3** (v3.70.0) - Game framework via CDN
- **Eruda** - Mobile debugging console via CDN
- **Vanilla JavaScript** - No build process required
- **LocalStorage** - Game state persistence

### Key Systems

**1. FIFO Queue Management**
```javascript
// Ingredients stored as ordered arrays
[
  { type: 'FLOUR_AP', quantity: 100, unitCost: 0.45, purchaseDay: 1, expirationDay: 46, batchId: 1 },
  { type: 'FLOUR_AP', quantity: 50, unitCost: 0.42, purchaseDay: 5, expirationDay: 50, batchId: 2 }
]
// Consumption always dequeues from index 0 (oldest)
```

**2. Time Acceleration**
```javascript
1 game day = 90 real seconds
1 game hour = 3.75 real seconds
Shop hours: 6 AM - 8 PM (14 hours)
```

**3. State Management**
```
MENU → PURCHASING → PRODUCTION → SALES_FLOOR → DAY_SUMMARY → (loop)
                                      ↓
                            Time flows here only
```

## 🎓 Learning Outcomes

After playing, students will understand:

1. **COGS Calculation**: How production costs accumulate
2. **FIFO Inventory**: Why oldest stock sells first
3. **JIT Ordering**: Planning ahead for delivery delays
4. **Shrinkage Impact**: Financial loss from waste
5. **Cash vs. Inventory**: Asset valuation differences
6. **Gross Margin**: Profitability measurement
7. **Fixed Costs**: Recurring monthly expenses
8. **Working Capital**: Maintaining cash reserves
9. **Inventory Turnover**: Efficiency metric
10. **Break-Even Analysis**: Minimum sales to survive

## 🏆 Win Conditions

**Victory**: 
- Survive 360 days (12 months)
- Net worth ≥ $20,000

**Defeat (Game Over)**:
- Net worth < $5,000 (bankruptcy)
- Cannot pay monthly expenses

## 📊 Performance Metrics

Players should target:
- **Gross Margin**: ≥75%
- **Inventory Turnover**: ≥12x/year
- **Shrinkage Rate**: ≤15%
- **Monthly Profit**: ≥$1,000
- **Cash Reserve**: ≥$15,000

## 🔮 Future Enhancements (Post-Setup Phase)

Planned for later phases:
- Labor hiring and scheduling
- Equipment upgrades and depreciation
- Seasonal demand variations (holiday rushes)
- Custom cake orders
- Competition events
- Marketing campaigns
- Loan/credit system
- Multiple difficulty levels
- Leaderboards

## 🐛 Known Limitations (Setup Phase)

- Simplified purchasing UI (text-based)
- Limited product variety (10 recipes)
- No labor costs (owner-operated assumption)
- No random events
- Simplified customer AI
- Geometric placeholder graphics

## 📝 License

Educational project for financial literacy training.

## 🤝 Credits

Built using:
- Phaser 3 game framework
- Realistic bakery industry data (2024-2025)
- Educational game design principles

---

**Ready to learn business while having fun? Open `index.html` and start baking! 🍰📈**

