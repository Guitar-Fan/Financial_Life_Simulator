# Development Guide - Bakery Business Simulator

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        main.js                               │
│              (Initialization & Entry Point)                  │
└────────────┬──────────────────────────────────┬──────────────┘
             │                                  │
             ▼                                  ▼
┌────────────────────────┐        ┌───────────────────────────┐
│  Game_State_Manager    │◄──────►│ Shop_Visual_Controller    │
│  (Phase & Time Flow)   │        │    (Phaser 3 Scene)       │
└───────┬────────────────┘        └────────┬──────────────────┘
        │                                  │
        │                                  │
        ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│          Economic_Simulation_Core.js                       │
│        (Orchestrates all game systems)                     │
└──────┬────────────────┬────────────────┬───────────────────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
│   Ledger     │ │   Costing   │ │  SupplyChain     │
│   System     │ │   Engine    │ │   Manager        │
└──────────────┘ └─────────────┘ └──────────────────┘
```

### Data Flow

1. **User Action** → Shop_Visual_Controller
2. **State Change** → Game_State_Manager
3. **Business Logic** → Economic_Simulation_Core
4. **System Updates** → Ledger/Costing/SupplyChain
5. **UI Update** → Shop_Visual_Controller
6. **Persistence** → LocalStorage

## 📂 Module Descriptions

### 1. Realistic_Parameters.js
**Purpose:** Central configuration database  
**Contains:** All game constants, prices, recipes, parameters  
**No logic, pure data**

Key sections:
- `INGREDIENTS` - Raw material costs and shelf life
- `RECIPES` - Product formulas and pricing
- `SUPPLY_CHAIN` - MOQs, lead times, discounts
- `FIXED_COSTS` - Monthly expenses
- `DEMAND` - Customer patterns
- `TIME` - Game speed settings

### 2. Game_State_Manager.js
**Purpose:** Phase control and time management  
**Responsibilities:**
- Manage game states (MENU, PURCHASING, PRODUCTION, SALES_FLOOR, DAY_SUMMARY)
- Control time flow (only during SALES_FLOOR)
- Track game clock (day, hour, minute)
- Trigger phase transitions
- LocalStorage save/load

**Key Methods:**
- `setState(newState)` - Change game phase
- `update(deltaTime)` - Advance game clock
- `advanceDay()` - Move to next day
- `getTimeString()` - Format display

### 3. Financial_Ledger_System.js
**Purpose:** Double-entry accounting  
**Responsibilities:**
- Track cash and inventory separately
- Record all transactions
- Calculate financial KPIs
- Detect bankruptcy

**Key Methods:**
- `purchaseSupplies()` - Cash → Inventory
- `recordSale()` - Inventory → Cash + Profit
- `writeOffShrinkage()` - Reduce inventory (loss)
- `getFinancialSnapshot()` - Return all metrics

**Accounting Equation:**
```
Assets = Cash + Inventory
Net Worth = Cash + Inventory
```

### 4. Product_Costing_Engine.js
**Purpose:** FIFO inventory and COGS calculation  
**Responsibilities:**
- Manage ingredient queues (FIFO)
- Track finished products (FIFO)
- Calculate exact COGS per unit
- Monitor expiration dates

**Data Structures:**
```javascript
rawIngredients = {
  'FLOUR_AP': [
    { quantity: 100, unitCost: 0.45, purchaseDay: 1, expirationDay: 46, batchId: 1 },
    { quantity: 50, unitCost: 0.42, purchaseDay: 5, expirationDay: 50, batchId: 2 }
  ]
}

finishedProducts = {
  'BASIC_BREAD': [
    { quantity: 20, unitCOGS: 0.93, productionDay: 3, expirationDay: 4 }
  ]
}
```

**Key Methods:**
- `addIngredient()` - Push to FIFO queue
- `consumeIngredient()` - Dequeue from front (oldest)
- `produceProduct()` - Consume ingredients, calculate COGS
- `sellProduct()` - Dequeue finished goods (FIFO)
- `checkExpired()` - Find expired items

### 5. Supply_Chain_Manager.js
**Purpose:** Procurement and deliveries  
**Responsibilities:**
- Place orders with MOQ validation
- Calculate bulk discounts
- Track delivery schedules
- Process incoming shipments

**Key Methods:**
- `placeOrder()` - Create order, deduct cash
- `processDeliveries()` - Check daily arrivals
- `checkStockout()` - Detect low inventory
- `getRecommendedOrders()` - Suggest reorders

**Order Lifecycle:**
```
Place Order → Pay Cash → Wait Lead Time → Delivery → Add to Inventory
```

### 6. Geometric_Sprite_Factory.js
**Purpose:** Generate placeholder visuals  
**Responsibilities:**
- Create geometric sprites using Phaser Graphics
- Maintain consistent color scheme
- Provide interactive elements

**Sprite Types:**
- Zones (storage, waste, display, production)
- Icons (ingredients, products, customers)
- UI (buttons, panels, bars)
- Background (floor tiles)

### 7. Shop_Visual_Controller.js
**Purpose:** Phaser 3 scene and UI management  
**Responsibilities:**
- Render all visual elements
- Handle user interactions
- Display phase-specific screens
- Update HUD in real-time

**Screens:**
- Menu (new game, continue, tutorial)
- Purchasing (ingredient list, order form)
- Production (recipe list, produce buttons)
- Sales Floor (bakery view, customer sprites)
- Day Summary (performance report)

**Key Methods:**
- `handleStateChange()` - Switch screens
- `updateHUD()` - Refresh dashboard
- `showTutorialModal()` - Display tutorial

### 8. Tutorial_Manager.js
**Purpose:** Educational walkthrough system  
**Responsibilities:**
- Manage tutorial steps
- Track completion status
- Validate player actions
- Render tutorial content

**Tutorial Flow:**
```
Welcome → Purchase → Wait → Produce → Sell → Shrinkage → Summary → Complete
```

### 9. Economic_Simulation_Core.js
**Purpose:** Main game loop orchestrator  
**Responsibilities:**
- Coordinate all systems
- Simulate customers
- Process sales
- Trigger events (shrinkage, month-end)
- Detect win/loss conditions

**Update Loop:**
```javascript
update(delta) {
  if (state === SALES_FLOOR) {
    simulateCustomers(delta)
    checkHourChanges()
    checkDayChanges()
  }
}
```

**Event Triggers:**
- Hourly: Check shrinkage, update metrics
- Daily: Process deliveries, check bankruptcy
- Monthly: Deduct expenses, check victory

### 10. main.js
**Purpose:** Bootstrap and initialization  
**Responsibilities:**
- Create all system instances
- Initialize Phaser game
- Set up debug tools
- Attach event listeners

## 🔧 Extending the Game

### Adding a New Ingredient

1. Add to `Realistic_Parameters.js`:
```javascript
INGREDIENTS: {
  CINNAMON: { 
    name: 'Cinnamon', 
    unit: 'oz', 
    cost: 0.75, 
    category: 'dry', 
    shelfLife: 180 
  }
}
```

2. Add MOQ:
```javascript
MOQ: {
  CINNAMON: 16  // 1 pound
}
```

3. Add to recipes:
```javascript
CINNAMON_ROLL: {
  ingredients: {
    FLOUR_AP: 1.0,
    CINNAMON: 0.5,
    // ...
  }
}
```

### Adding a New Recipe

```javascript
RECIPES: {
  NEW_PRODUCT: {
    name: 'Product Name',
    sku: 'SKU001',
    ingredients: {
      INGREDIENT_KEY: quantity,
      // ...
    },
    retailPrice: 0.00,
    productionTime: 0,  // Keep 0 for instant
    shelfLife: 0,       // Days
    category: 'bread'   // bread/pastry/cookie/cake
  }
}
```

### Adding Seasonal Variations

1. Create season configuration in `Realistic_Parameters.js`:
```javascript
SEASONS: {
  HOLIDAY: {
    startDay: 330,    // Day 330-360 (Nov-Dec)
    endDay: 360,
    demandMultiplier: 1.5,
    products: ['LAYER_CAKE', 'CUPCAKE']
  }
}
```

2. Modify demand calculation in `Economic_Simulation_Core.js`:
```javascript
simulateCustomers(delta) {
  let baseCustomers = PARAMS.DEMAND.BASE_CUSTOMERS_PER_DAY;
  
  // Check season
  const currentDay = this.gameState.currentDay;
  if (currentDay >= 330 && currentDay <= 360) {
    baseCustomers *= 1.5;  // Holiday rush
  }
  
  // Continue existing logic...
}
```

### Adding Labor System

1. Add to parameters:
```javascript
LABOR: {
  HEAD_BAKER: { hourlyWage: 22, required: true },
  ASSISTANT: { hourlyWage: 16, required: false },
  COUNTER_STAFF: { hourlyWage: 13, required: false }
}
```

2. Create `Labor_Manager.js`:
```javascript
class LaborManager {
  constructor() {
    this.staff = [];
    this.weeklySchedule = {};
  }
  
  hireEmployee(role) { /* ... */ }
  calculateWeeklyCost() { /* ... */ }
}
```

3. Integrate into `Economic_Simulation_Core.js`:
```javascript
processWeekEnd() {
  const laborCost = this.laborManager.calculateWeeklyCost();
  this.ledger.cashOnHand -= laborCost;
}
```

## 🧪 Testing Strategies

### Unit Testing (Manual)

Test each system independently via console:

```javascript
// Test FIFO
costing.addIngredient('FLOUR_AP', 100, 0.45, 1);
costing.addIngredient('FLOUR_AP', 50, 0.42, 5);
costing.consumeIngredient('FLOUR_AP', 120);
// Should consume from batch 1 first

// Test shrinkage
costing.produceProduct('BASIC_BREAD', 10, 1);
gameState.currentDay = 5;  // Fast forward
costing.checkExpired(5);   // Should find expired bread

// Test bankruptcy
ledger.cashOnHand = 1000;
ledger.inventoryValue = 2000;
ledger.isBankrupt();  // Should return true
```

### Integration Testing

Test system interactions:

```javascript
// Full transaction cycle
GAME.orderFlour(100);        // Place order
gameState.currentDay = 4;    // Simulate delivery day
simulation.processDeliveries();
GAME.produceBread(20);       // Produce using delivered flour
GAME.openShop();             // Start sales
// Watch customers buy and cash increase
```

### Performance Testing

Monitor frame rate and memory:

```javascript
// Check update loop performance
console.time('simulation');
simulation.update(0.016);  // 60 FPS = ~16ms per frame
console.timeEnd('simulation');

// Should be < 5ms for smooth 60 FPS
```

## 📊 Data Persistence

All game state saved to LocalStorage:

- `bakery_game_state` - Game clock and phase
- `bakery_financial_data` - Ledger transactions
- `bakery_inventory_data` - FIFO queues
- `bakery_orders_data` - Pending deliveries
- `bakery_tutorial_completed` - Tutorial flag

### Save/Load Pattern

```javascript
saveToLocalStorage() {
  const data = { /* ... */ };
  localStorage.setItem('key', JSON.stringify(data));
}

loadFromLocalStorage() {
  const json = localStorage.getItem('key');
  if (json) {
    const data = JSON.parse(json);
    // Restore state
  }
}
```

## 🐛 Debugging Tips

### Common Issues

**Time not flowing:**
- Check: `gameState.currentState === 'SALES_FLOOR'`
- Check: `gameState.isTimeFlowing === true`

**Customers not spawning:**
- Check: Products available in inventory
- Check: Current hour has demand > 0
- Check: Customer accumulator incrementing

**FIFO not working:**
- Verify batches sorted by `purchaseDay`
- Check `consumeIngredient` dequeues from index 0
- Log batch IDs during consumption

**Cash/Inventory mismatch:**
- Every purchase should: `cash -= X, inventory += X`
- Every sale should: `cash += price, inventory -= COGS`
- Check `getTotalInventoryValue()` matches ledger

### Debug Console Commands

```javascript
// Inspect state
GAME.getStatus()

// Force events
gameState.triggerDayClosure()
simulation.checkShrinkage()
simulation.processMonthEnd()

// Manipulate data
GAME.addCash(50000)
gameState.currentDay = 100
ledger.monthlyRevenue = 10000

// Test systems
GAME.orderFlour(200)
GAME.produceBread(50)
costing.checkExpired(gameState.currentDay + 10)
```

## 🚀 Optimization Opportunities

### Performance

1. **Object Pooling:** Reuse customer sprites instead of creating new ones
2. **Batch Updates:** Update HUD every 100ms instead of every frame
3. **Lazy Loading:** Load tutorial content only when opened
4. **Data Compression:** Compress LocalStorage data for mobile

### Code Quality

1. **TypeScript Migration:** Add type safety
2. **Module Bundler:** Use Webpack/Rollup for production
3. **Asset Pipeline:** Generate sprite sheets programmatically
4. **Unit Tests:** Add Jest/Mocha test suite

### User Experience

1. **Accessibility:** Add keyboard navigation
2. **i18n:** Internationalization support
3. **Responsive:** Mobile-optimized UI
4. **Analytics:** Track player decisions for educational insights

## 📝 Code Style Guidelines

### Naming Conventions

- **Classes:** PascalCase (`LedgerSystem`)
- **Functions:** camelCase (`calculateCOGS`)
- **Constants:** SCREAMING_SNAKE_CASE (`STARTING_CASH`)
- **Private methods:** Prefix with `_` (`_calculateTax`)
- **DOM elements:** kebab-case IDs (`hud-cash`)

### File Organization

```javascript
/**
 * Module_Name.js
 * 
 * Brief description
 */

class ModuleName {
    constructor() {
        // Initialize properties
    }
    
    // Public methods
    publicMethod() { }
    
    // Private methods
    _privateMethod() { }
    
    // LocalStorage methods
    saveToLocalStorage() { }
    loadFromLocalStorage() { }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleName;
}
```

### Comment Standards

```javascript
/**
 * Calculate COGS using FIFO method
 * @param {string} ingredientKey - Ingredient identifier
 * @param {number} amount - Quantity needed
 * @returns {number|null} Total cost or null if insufficient
 */
consumeIngredient(ingredientKey, amount) {
    // Implementation with inline comments for complex logic
}
```

## 🔐 Security Considerations

**LocalStorage Limitations:**
- Not encrypted - don't store sensitive data
- 5-10MB limit per domain
- Can be cleared by user

**Client-Side Only:**
- No server validation
- Players can modify data via console
- Educational game - cheating acceptable

**Future: Server Integration**
- Add authentication for leaderboards
- Server-side save validation
- Anti-cheat for competitive modes

## 📚 Further Reading

**Phaser 3 Documentation:**
- https://photonstorm.github.io/phaser3-docs/

**Game Design:**
- "Theory of Fun" - Raph Koster
- "Game Programming Patterns" - Robert Nystrom

**Financial Literacy:**
- Accounting principles (GAAP)
- Inventory valuation methods
- KPI analysis

---

**Ready to extend the game? Start coding! 🚀**
