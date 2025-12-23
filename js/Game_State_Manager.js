/**
 * Game_State_Manager.js
 * 
 * Manages game phases and controls time flow.
 * Time only advances during SALES_FLOOR phase.
 * All other phases pause the game clock.
 */

class GameStateManager {
    constructor() {
        // Game states
        this.STATES = {
            MENU: 'MENU',
            TUTORIAL: 'TUTORIAL',
            PURCHASING: 'PURCHASING',
            PRODUCTION: 'PRODUCTION',
            SALES_FLOOR: 'SALES_FLOOR',
            DAY_SUMMARY: 'DAY_SUMMARY',
            PAUSED: 'PAUSED',
            GAME_OVER: 'GAME_OVER',
            VICTORY: 'VICTORY'
        };
        
        // Current state
        this.currentState = this.STATES.MENU;
        
        // Game clock (in-game time)
        this.currentDay = 1;
        this.currentHour = 6; // Start at 6 AM
        this.currentMinute = 0;
        this.currentDayOfWeek = 1; // Start on Monday
        
        // Time tracking
        this.isTimeFlowing = false;
        this.realTimeAccumulator = 0;
        
        // Callbacks for state changes
        this.stateChangeCallbacks = [];
        
        // Load saved game if exists
        this.loadFromLocalStorage();
    }
    
    /**
     * Change the current game state
     */
    setState(newState) {
        if (!Object.values(this.STATES).includes(newState)) {
            console.error(`Invalid state: ${newState}`);
            return;
        }
        
        const oldState = this.currentState;
        this.currentState = newState;
        
        // Update time flow based on state
        this.isTimeFlowing = (newState === this.STATES.SALES_FLOOR);
        
        // Trigger callbacks
        this.stateChangeCallbacks.forEach(callback => {
            callback(newState, oldState);
        });
        
        console.log(`State changed: ${oldState} -> ${newState}`);
        
        // Save state
        this.saveToLocalStorage();
    }
    
    /**
     * Register callback for state changes
     */
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }
    
    /**
     * Update game time (called every frame during SALES_FLOOR)
     */
    update(deltaTimeSeconds) {
        if (!this.isTimeFlowing) {
            return;
        }
        
        this.realTimeAccumulator += deltaTimeSeconds;
        
        // Convert real time to game time
        const gameSecondsPerRealSecond = 86400 / REALISTIC_PARAMETERS.TIME.REAL_SECONDS_PER_GAME_DAY;
        const gameSecondsPassed = this.realTimeAccumulator * gameSecondsPerRealSecond;
        
        // Update game clock
        if (gameSecondsPassed >= 60) {
            const minutesToAdd = Math.floor(gameSecondsPassed / 60);
            this.realTimeAccumulator = 0;
            
            this.addMinutes(minutesToAdd);
        }
    }
    
    /**
     * Add minutes to game clock
     */
    addMinutes(minutes) {
        this.currentMinute += minutes;
        
        while (this.currentMinute >= 60) {
            this.currentMinute -= 60;
            this.currentHour++;
            
            // Check for closing time (8 PM = 20:00)
            if (this.currentHour >= REALISTIC_PARAMETERS.TIME.CLOSING_HOUR) {
                this.triggerDayClosure();
                return;
            }
        }
    }
    
    /**
     * Advance to next day
     */
    advanceDay() {
        this.currentDay++;
        this.currentHour = REALISTIC_PARAMETERS.TIME.OPENING_HOUR;
        this.currentMinute = 0;
        this.currentDayOfWeek = (this.currentDayOfWeek + 1) % 7;
        
        // Check for month end (30 days per month)
        if (this.currentDay % REALISTIC_PARAMETERS.TIME.DAYS_PER_MONTH === 1 && this.currentDay > 1) {
            this.triggerMonthEnd();
        }
        
        // Check for win condition (12 months = 360 days)
        if (this.currentDay > REALISTIC_PARAMETERS.TIME.DAYS_PER_MONTH * REALISTIC_PARAMETERS.TIME.MONTHS_TO_WIN) {
            this.checkVictoryCondition();
        }
        
        this.saveToLocalStorage();
    }
    
    /**
     * Trigger day closure and transition to summary
     */
    triggerDayClosure() {
        console.log(`Shop closing at Day ${this.currentDay}, 8 PM`);
        this.setState(this.STATES.DAY_SUMMARY);
    }
    
    /**
     * Trigger month end financial deduction
     */
    triggerMonthEnd() {
        console.log(`Month end reached on Day ${this.currentDay}`);
        // Economic_Simulation_Core will handle the financial deduction
    }
    
    /**
     * Check victory condition
     */
    checkVictoryCondition() {
        // This will be called by Economic_Simulation_Core with net worth data
        console.log(`12 months completed! Checking victory condition...`);
    }
    
    /**
     * Get current game time as formatted string
     */
    getTimeString() {
        const hour12 = this.currentHour > 12 ? this.currentHour - 12 : (this.currentHour === 0 ? 12 : this.currentHour);
        const ampm = this.currentHour >= 12 ? 'PM' : 'AM';
        const minuteStr = this.currentMinute.toString().padStart(2, '0');
        
        return `Day ${this.currentDay}, ${hour12}:${minuteStr} ${ampm}`;
    }
    
    /**
     * Get current day of week name
     */
    getDayOfWeekName() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[this.currentDayOfWeek];
    }
    
    /**
     * Get current month number (1-12+)
     */
    getCurrentMonth() {
        return Math.floor((this.currentDay - 1) / REALISTIC_PARAMETERS.TIME.DAYS_PER_MONTH) + 1;
    }
    
    /**
     * Get day within current month (1-30)
     */
    getDayOfMonth() {
        return ((this.currentDay - 1) % REALISTIC_PARAMETERS.TIME.DAYS_PER_MONTH) + 1;
    }
    
    /**
     * Check if it's a delivery day for a category
     */
    isDeliveryDay(category) {
        const deliveryDays = REALISTIC_PARAMETERS.SUPPLY_CHAIN.DELIVERY_DAYS[category.toUpperCase()];
        return deliveryDays && deliveryDays.includes(this.currentDayOfWeek);
    }
    
    /**
     * Save game state to localStorage
     */
    saveToLocalStorage() {
        const saveData = {
            currentState: this.currentState,
            currentDay: this.currentDay,
            currentHour: this.currentHour,
            currentMinute: this.currentMinute,
            currentDayOfWeek: this.currentDayOfWeek,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('bakery_game_state', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }
    
    /**
     * Load game state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saveData = localStorage.getItem('bakery_game_state');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.currentState = data.currentState || this.STATES.MENU;
                this.currentDay = data.currentDay || 1;
                this.currentHour = data.currentHour || 6;
                this.currentMinute = data.currentMinute || 0;
                this.currentDayOfWeek = data.currentDayOfWeek || 1;
                
                console.log('Game state loaded from localStorage');
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
    
    /**
     * Reset game state (new game)
     */
    resetGame() {
        this.currentState = this.STATES.MENU;
        this.currentDay = 1;
        this.currentHour = 6;
        this.currentMinute = 0;
        this.currentDayOfWeek = 1;
        this.isTimeFlowing = false;
        this.realTimeAccumulator = 0;
        
        // Clear localStorage
        try {
            localStorage.removeItem('bakery_game_state');
            localStorage.removeItem('bakery_financial_data');
            localStorage.removeItem('bakery_inventory_data');
            localStorage.removeItem('bakery_orders_data');
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
        }
        
        console.log('Game reset');
    }
    
    /**
     * Get game state for display
     */
    getStateInfo() {
        return {
            state: this.currentState,
            day: this.currentDay,
            hour: this.currentHour,
            minute: this.currentMinute,
            dayOfWeek: this.getDayOfWeekName(),
            month: this.getCurrentMonth(),
            dayOfMonth: this.getDayOfMonth(),
            timeString: this.getTimeString(),
            isTimeFlowing: this.isTimeFlowing
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}
