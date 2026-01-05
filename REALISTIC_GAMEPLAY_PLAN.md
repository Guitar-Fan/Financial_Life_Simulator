# Realistic Gameplay Implementation Plan

## Overview
Transform the bakery simulation into a highly realistic customer-driven experience with deep personality systems, complex interactions, and time-based gameplay mechanics.

---

## 🎯 STAGE 1: Enhanced Customer Personality System

### Goals
- Create unique customer personalities with individual traits
- Implement 50/50 satisfaction model (bakery vs. personal factors)
- Replace simple customer spawning with personality-driven behavior

### Implementation Tasks

#### 1.1 Expand CustomerDatabase.js
**File**: `js/CustomerDatabase.js`

**New Customer Attributes**:
```javascript
{
    // Existing attributes...
    
    // NEW PERSONALITY TRAITS
    personality: {
        patience: 0-100,          // How long they'll wait
        chattiness: 0-100,        // How much they want to talk
        impulsiveness: 0-100,     // Spontaneous purchases
        flexibility: 0-100,       // Accept alternatives
        moodiness: 0-100          // Mood swings
    },
    
    // NEW PREFERENCES
    preferences: {
        serviceSpeed: 'fast' | 'normal' | 'slow',
        interactionStyle: 'minimal' | 'friendly' | 'chatty',
        qualityVsPrice: 0-100,    // 0=price focused, 100=quality focused
        brandLoyalty: 0-100,      // How sticky they are
        adventurousness: 0-100    // Try new items
    },
    
    // NEW WILLINGNESS TO PAY
    willingnessToPay: {
        base: number,             // Base budget
        priceRange: [min, max],   // Acceptable price range
        qualityMultiplier: number // Willing to pay more for quality
    },
    
    // NEW EXTERNAL CIRCUMSTANCES
    currentMood: 0-100,           // Affected by weather, events
    lastMoodUpdate: timestamp,
    externalFactors: {
        weatherSensitivity: 0-100,
        timeOfDaySensitivity: 0-100,
        economicSensitivity: 0-100
    },
    
    // NEW SATISFACTION BREAKDOWN
    satisfactionHistory: [
        {
            day: number,
            bakeryScore: 0-50,    // From bakery factors
            personalScore: 0-50,  // From personal factors
            total: 0-100
        }
    ]
}
```

#### 1.2 Create PersonalityGenerator
**New Method**: `generatePersonality(ageGroup, segment)`
- Generates coherent personality based on demographics
- Different age groups have different personality distributions
- Budget customers: high price sensitivity, low chattiness
- Premium customers: high quality weight, high patience
- Returns complete personality object

#### 1.3 Create Satisfaction Calculator
**New Method**: `calculateSatisfaction(customer, interaction)`
```javascript
calculateSatisfaction(customer, interaction) {
    // BAKERY FACTORS (50%)
    const bakeryScore = (
        (interaction.foodQuality * 0.5) +
        (interaction.bakerylooks * 0.15) +
        (interaction.serviceQuality * 0.25) +
        (interaction.valuePerception * 0.1)
    ) * 50;
    
    // PERSONAL FACTORS (50%)
    const personalScore = (
        (customer.currentMood * 0.4) +
        (customer.personality.match * 0.3) +
        (externalFactors * 0.3)
    ) * 50;
    
    return {
        bakeryScore,
        personalScore,
        total: bakeryScore + personalScore
    };
}
```

#### 1.4 Dynamic Return Rate System
**New Method**: `calculateReturnProbability(customer)`
- Base return rate from satisfaction history
- Modified by personality (loyalty, moodiness)
- Weather effects: rainy days reduce return by 10-30%
- Economic conditions affect differently per segment
- Recent bad experience has stronger weight

**Return Rate Factors**:
- Average satisfaction (40%)
- Loyalty score (25%)
- Recent visit recency (15%)
- Number of visits (10%)
- Last interaction quality (10%)

---

## 🎯 STAGE 2: Hybrid Time System

### Goals
- Replace pure real-time with calculated time blocks during interactions
- Maintain real-time flow between interactions
- Make time meaningful and strategic

### Implementation Tasks

#### 2.1 Create TimeManager.js
**New File**: `js/TimeManager.js`

```javascript
class TimeManager {
    constructor(gameController) {
        this.mode = 'realtime'; // 'realtime' | 'calculated'
        this.currentTime = 0;
        this.gameSpeed = 1.0;
        this.isPaused = false;
        this.activeInteraction = null;
        this.timeCallbacks = [];
    }
    
    // Real-time update (when not in interaction)
    updateRealtime(delta) {
        if (this.mode !== 'realtime') return;
        this.currentTime += delta * this.gameSpeed;
        this.checkCallbacks();
    }
    
    // Calculated time block (during interaction)
    startCalculatedBlock(interaction) {
        this.mode = 'calculated';
        this.activeInteraction = interaction;
        const estimatedTime = this.calculateInteractionTime(interaction);
        return estimatedTime;
    }
    
    endCalculatedBlock() {
        this.mode = 'realtime';
        this.activeInteraction = null;
    }
    
    calculateInteractionTime(interaction) {
        let baseTime = 60; // 60 seconds base
        
        // Customer personality affects time
        baseTime += (interaction.customer.personality.chattiness / 10);
        baseTime -= (interaction.staff.speed * 5);
        
        // Complexity of order
        baseTime += (interaction.itemsOrdered * 10);
        
        // Small talk time
        if (interaction.includesSmallTalk) {
            baseTime += this.calculateSmallTalkTime(interaction);
        }
        
        // Wait time for items
        if (interaction.hasWaitTime) {
            baseTime += interaction.waitTime;
        }
        
        return baseTime;
    }
    
    calculateSmallTalkTime(interaction) {
        const customerChattiness = interaction.customer.personality.chattiness;
        const ownerEngagement = interaction.ownerEngagement || 50;
        
        // Sweet spot is matching customer's chattiness
        const match = 100 - Math.abs(customerChattiness - ownerEngagement);
        const optimalTime = (customerChattiness / 100) * 30; // 0-30 seconds
        
        return optimalTime;
    }
}
```

#### 2.2 Integrate Time Manager
**Modify**: `js/GameController.js`
- Add `this.timeManager = new TimeManager(this)` in constructor
- Replace existing time update with hybrid system
- Pause real-time when entering interaction mode
- Resume after interaction completes

#### 2.3 Visual Time Indicators
**UI Elements**:
- Clock display showing current time
- Time speed controls (1x, 2x, 4x)
- "In Interaction" indicator when in calculated mode
- Time elapsed for current interaction
- Estimated completion time

---

## 🎯 STAGE 3: Immersive Customer Interaction Mode

### Goals
- Create engaging customer interaction gameplay for owner
- Implement small talk balance mechanics
- Add waiting/delay request system

### Implementation Tasks

#### 3.1 Create CustomerInteractionScene.js
**New File**: `js/CustomerInteractionScene.js`

```javascript
class CustomerInteractionScene {
    constructor(gameController, customer, staff) {
        this.game = gameController;
        this.customer = customer;
        this.staff = staff;
        this.isOwner = (staff.role === 'owner');
        this.phase = 'greeting'; // greeting, smalltalk, ordering, closing
        this.conversation = [];
        this.smallTalkScore = 0;
        this.customerMood = customer.currentMood;
    }
    
    // Only owner gets this immersive mode
    startImmersiveMode() {
        if (!this.isOwner) {
            return this.autoResolveInteraction();
        }
        
        this.showInteractionUI();
        this.startPhase('greeting');
    }
    
    showInteractionUI() {
        // Modal overlay with customer avatar
        // Dialogue bubbles
        // Response options
        // Mood meter
        // Time tracker
    }
    
    // Greeting phase
    startPhase(phaseName) {
        this.phase = phaseName;
        
        switch(phaseName) {
            case 'greeting':
                this.showGreetingOptions();
                break;
            case 'smalltalk':
                this.showSmallTalkOptions();
                break;
            case 'ordering':
                this.showOrderingInterface();
                break;
            case 'closing':
                this.showClosingOptions();
                break;
        }
    }
    
    // Small talk gameplay
    showSmallTalkOptions() {
        const options = this.generateSmallTalkOptions();
        // Display 3-4 conversation topics
        // Each takes time and affects mood
        // Can skip to ordering anytime
        // Staying too long annoys impatient customers
        // Leaving too quick disappoints chatty customers
    }
    
    generateSmallTalkOptions() {
        return [
            {
                topic: 'weather',
                duration: 15,
                moodEffect: this.customer.externalFactors.weatherSensitivity / 10
            },
            {
                topic: 'neighborhood',
                duration: 20,
                moodEffect: 5
            },
            {
                topic: 'compliment',
                duration: 10,
                moodEffect: 10,
                loyaltyBonus: 2
            },
            {
                topic: 'skip',
                duration: 0,
                moodEffect: -this.customer.personality.chattiness / 10
            }
        ];
    }
    
    // Handle waiting for items to be made
    handleItemUnavailable(item) {
        const bakingTime = this.game.engine.recipes[item].bakingTime;
        const willWait = this.customerWillWait(bakingTime);
        
        if (willWait) {
            return {
                accepted: true,
                waitTime: bakingTime,
                moodPenalty: (100 - this.customer.personality.patience) / 10
            };
        } else {
            return {
                accepted: false,
                alternative: this.suggestAlternative(item)
            };
        }
    }
    
    customerWillWait(minutes) {
        const patience = this.customer.personality.patience;
        const currentMood = this.customerMood;
        const maxWait = (patience / 100) * 15; // 0-15 minutes
        
        const willingToWait = minutes <= maxWait && currentMood > 30;
        return willingToWait;
    }
    
    // Auto-resolve for staff (not owner)
    autoResolveInteraction() {
        const staffPerformance = this.calculateStaffPerformance();
        const interactionTime = this.game.timeManager.calculateInteractionTime({
            customer: this.customer,
            staff: this.staff,
            itemsOrdered: 1,
            includesSmallTalk: Math.random() > 0.5
        });
        
        return {
            success: staffPerformance > 50,
            satisfaction: staffPerformance,
            timeElapsed: interactionTime,
            revenue: this.calculateRevenue(staffPerformance)
        };
    }
    
    calculateStaffPerformance() {
        const staffSkill = this.staff.skill || 50;
        const customerDifficulty = this.customer.personality.moodiness;
        const randomness = (Math.random() * 20) - 10; // ±10
        
        return Math.max(0, Math.min(100, 
            staffSkill - (customerDifficulty / 2) + randomness
        ));
    }
}
```

#### 3.2 Small Talk Balance Mechanic
**Timing System**:
- Each small talk option has duration
- Track total conversation time
- Compare to customer's ideal duration
- Calculate small talk score based on match

**Scoring**:
```javascript
calculateSmallTalkScore(actualTime, customer) {
    const idealTime = (customer.personality.chattiness / 100) * 60;
    const difference = Math.abs(actualTime - idealTime);
    
    if (difference < 10) return 100; // Perfect!
    if (difference < 20) return 80;  // Good
    if (difference < 40) return 50;  // Okay
    return 20; // Poor
}
```

#### 3.3 Wait Request System
**Workflow**:
1. Customer asks for unavailable item
2. Owner checks baking queue
3. Owner can:
   - Assign baker to make it (if baker available)
   - Tell customer wait time
   - Suggest alternative
   - Apologize and lose sale

**Customer Decision**:
- Patience level vs. wait time
- Current mood
- How much they want the item
- Alternatives available

---

## 🎯 STAGE 4: Robust Staff Task Assignment

### Goals
- Deliberate task assignment system
- Staff become unavailable when assigned
- Track staff performance on tasks

### Implementation Tasks

#### 4.1 Create StaffManager.js
**New File**: `js/StaffManager.js`

```javascript
class StaffManager {
    constructor(gameController) {
        this.game = gameController;
        this.staff = [];
        this.tasks = new Map(); // taskId -> Task
        this.assignments = new Map(); // staffId -> taskId
    }
    
    assignTask(staff, task) {
        if (this.isStaffAvailable(staff)) {
            this.assignments.set(staff.id, task.id);
            staff.status = 'busy';
            staff.currentTask = task;
            task.assignedStaff = staff;
            task.startTime = this.game.timeManager.currentTime;
            
            return {
                success: true,
                estimatedCompletion: task.estimatedTime
            };
        }
        
        return {
            success: false,
            reason: 'Staff not available'
        };
    }
    
    createTask(type, details) {
        const task = {
            id: this.generateTaskId(),
            type: type, // 'baking', 'customer', 'cleaning', 'inventory'
            details: details,
            status: 'pending',
            assignedStaff: null,
            startTime: null,
            completionTime: null,
            estimatedTime: this.estimateTaskTime(type, details)
        };
        
        this.tasks.set(task.id, task);
        return task;
    }
    
    estimateTaskTime(type, details) {
        switch(type) {
            case 'baking':
                return details.recipe.bakingTime / (1 + details.skill/100);
            case 'customer':
                return 60 + (details.customer.personality.chattiness / 2);
            case 'cleaning':
                return 300; // 5 minutes
            case 'inventory':
                return 180; // 3 minutes
            default:
                return 120;
        }
    }
    
    isStaffAvailable(staff) {
        return !this.assignments.has(staff.id) && staff.status === 'available';
    }
    
    getAvailableStaff() {
        return this.staff.filter(s => this.isStaffAvailable(s));
    }
    
    completeTask(taskId, outcome) {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        task.status = 'completed';
        task.completionTime = this.game.timeManager.currentTime;
        task.outcome = outcome;
        
        // Free up staff
        const staff = task.assignedStaff;
        if (staff) {
            this.assignments.delete(staff.id);
            staff.status = 'available';
            staff.currentTask = null;
            
            // Update staff stats based on performance
            this.updateStaffStats(staff, task, outcome);
        }
    }
    
    updateStaffStats(staff, task, outcome) {
        // Track performance metrics
        staff.tasksCompleted++;
        staff.totalTaskTime += (task.completionTime - task.startTime);
        
        if (outcome.success) {
            staff.successCount++;
            
            // Skill improvement
            if (Math.random() < 0.1) {
                staff.skill = Math.min(100, staff.skill + 1);
            }
        } else {
            staff.failureCount++;
        }
        
        // Update efficiency rating
        staff.efficiency = (staff.successCount / staff.tasksCompleted) * 100;
    }
}
```

#### 4.2 Task Assignment UI
**New Panel**: Task Assignment Board

**Interface**:
```
┌─────────────────────────────────────┐
│      📋 TASK BOARD                  │
├─────────────────────────────────────┤
│                                     │
│  Available Staff:                   │
│  ☐ Emma (Baker) - Available         │
│  ☐ Jake (Server) - Busy (2:30)      │
│  ☐ You (Owner) - Available          │
│                                     │
│  Pending Tasks:                     │
│  • Bake 3x Croissants (15 min)      │
│     [Assign Staff ▼]                │
│                                     │
│  • Serve Customer #12 (2 min)       │
│     [Assign Staff ▼]                │
│                                     │
│  • Clean Display Case (5 min)       │
│     [Assign Staff ▼]                │
│                                     │
│  Active Tasks:                      │
│  • Jake serving Customer #11        │
│     ⏱ 0:45 remaining                │
│                                     │
└─────────────────────────────────────┘
```

**Features**:
- Drag-and-drop staff to tasks
- Click-to-assign dropdown
- Visual status indicators
- Time estimates
- Priority markers
- Auto-assign toggle (for automation)

#### 4.3 Staff Performance in Interactions
**Modify**: Customer satisfaction calculation

```javascript
calculateCustomerSatisfaction(customer, staff, interaction) {
    // Base bakery score
    let bakeryScore = this.calculateBakeryScore(interaction);
    
    // Staff performance modifier
    const staffPerformance = this.calculateStaffPerformance(staff, customer);
    bakeryScore *= (staffPerformance / 100);
    
    // Add randomness to staff interaction
    const randomFactor = (Math.random() * 20) - 10; // ±10
    bakeryScore += randomFactor;
    
    // Personal score (customer factors)
    const personalScore = this.calculatePersonalScore(customer);
    
    return {
        bakeryScore: Math.max(0, Math.min(50, bakeryScore)),
        personalScore: Math.max(0, Math.min(50, personalScore)),
        staffPerformance: staffPerformance,
        total: bakeryScore + personalScore
    };
}

calculateStaffPerformance(staff, customer) {
    let performance = staff.skill || 50;
    
    // Staff-customer personality match
    if (customer.personality.chattiness > 70 && staff.chattiness > 70) {
        performance += 10; // They hit it off!
    }
    
    if (customer.personality.patience < 30 && staff.speed < 50) {
        performance -= 15; // Impatient customer, slow staff
    }
    
    // Staff energy/mood
    performance *= (staff.energy / 100);
    
    // Experience with customer type
    if (staff.experienceWith[customer.segment]) {
        performance += 5;
    }
    
    return Math.max(20, Math.min(100, performance));
}
```

---

## 🎯 STAGE 5: UI/UX Improvements

### Goals
- Remove disruptive popup notifications
- Create upgraded customer database UI
- Add satisfaction visualization

### Implementation Tasks

#### 5.1 Replace Popup Notifications
**Remove**: Large modal popups for baking completion

**Add**: Subtle notification system

```javascript
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
    }
    
    init() {
        // Create fixed notification area (top-right)
        this.container = document.createElement('div');
        this.container.id = 'notification-area';
        this.container.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 1000;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
        `;
        document.body.appendChild(this.container);
    }
    
    notify(type, message, options = {}) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.innerHTML = `
            <div class="notification-icon">${options.icon || '📢'}</div>
            <div class="notification-content">
                <div class="notification-title">${options.title || type}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.dismissNotification(notification);
        }, options.duration || 5000);
        
        this.container.prepend(notification);
        
        // Animate in
        gsap.from(notification, {
            x: 100,
            opacity: 0,
            duration: 0.3,
            ease: 'back.out'
        });
    }
    
    dismissNotification(notification) {
        gsap.to(notification, {
            x: 100,
            opacity: 0,
            duration: 0.2,
            onComplete: () => notification.remove()
        });
    }
}
```

**Usage for Baking**:
```javascript
// Instead of: showPopup("Croissant finished!")
game.notifications.notify('success', 'Croissant ready!', {
    icon: '🥐',
    title: 'Baking Complete',
    duration: 3000
});
```

#### 5.2 Upgraded Customer Database
**Enhance**: `js/CustomerDatabase.js` UI methods

**New Views**:
1. **Customer Detail View** - Show all personality traits
2. **Satisfaction Breakdown** - Pie chart of bakery vs. personal
3. **Visit Timeline** - Graphical visit history
4. **Personality Profile** - Visual representation of traits
5. **Interaction History** - Log of all interactions

**Customer Card Enhancement**:
```html
<div class="customer-card-enhanced">
    <div class="customer-header">
        <div class="customer-avatar">👤</div>
        <div class="customer-name">Emma Wilson</div>
        <div class="loyalty-badge">🥇 Gold</div>
    </div>
    
    <div class="customer-stats-grid">
        <div class="stat">
            <label>Satisfaction</label>
            <div class="satisfaction-bar">
                <div class="bakery-portion" style="width: 40%"></div>
                <div class="personal-portion" style="width: 35%"></div>
            </div>
            <small>75/100 (40 bakery + 35 personal)</small>
        </div>
        
        <div class="stat">
            <label>Return Probability</label>
            <div class="progress-bar">
                <div style="width: 85%"></div>
            </div>
            <small>85% likely to return</small>
        </div>
    </div>
    
    <div class="personality-traits">
        <h4>Personality</h4>
        <div class="trait">
            <span>Patience</span>
            <div class="trait-bar"><div style="width: 70%"></div></div>
            <span>70</span>
        </div>
        <div class="trait">
            <span>Chattiness</span>
            <div class="trait-bar"><div style="width: 45%"></div></div>
            <span>45</span>
        </div>
        <!-- More traits... -->
    </div>
    
    <div class="preferences">
        <h4>Preferences</h4>
        <div class="pref-item">
            ⚡ Service Speed: <strong>Fast</strong>
        </div>
        <div class="pref-item">
            💬 Interaction: <strong>Minimal</strong>
        </div>
        <div class="pref-item">
            💰 Budget: <strong>$8-15</strong>
        </div>
    </div>
    
    <div class="external-factors">
        <h4>Current State</h4>
        <div class="mood-indicator">
            Mood: <span class="mood-emoji">😊</span> 75/100
            <small>(Affected by: ☀️ Sunny weather +10)</small>
        </div>
    </div>
</div>
```

#### 5.3 Satisfaction Visualization
**New Component**: Satisfaction Dashboard

Shows aggregated data:
- Average bakery score trend
- Average personal score trend
- Factors affecting each
- Recommendations for improvement

---

## 🎯 STAGE 6: Refactoring & Integration

### Goals
- Integrate all new systems seamlessly
- Ensure save/load works with new data
- Performance optimization

### Implementation Tasks

#### 6.1 Refactor GameController
**Updates Needed**:
- Initialize new managers (TimeManager, StaffManager)
- Route customer spawning through personality system
- Integrate interaction mode for owner
- Update day cycle to use new systems

#### 6.2 Save/Load Enhancement
**Add to Save Data**:
```javascript
{
    // Existing save data...
    
    // New additions
    customerDatabase: this.customerDB.serialize(),
    timeManagerState: this.timeManager.getState(),
    staffAssignments: this.staffManager.getAssignments(),
    activeInteractions: this.interactions.map(i => i.serialize())
}
```

#### 6.3 Performance Checks
- Limit active customers to reasonable number
- Batch update customer moods
- Lazy load customer detail views
- Optimize interaction calculations

---

## 📋 Implementation Order

### Phase 1: Foundation (Days 1-2)
1. Create PersonalityGenerator
2. Expand customer attributes in CustomerDatabase
3. Implement new satisfaction calculator
4. Test personality generation

### Phase 2: Time System (Days 3-4)
5. Create TimeManager.js
6. Integrate with GameController
7. Add time UI elements
8. Test hybrid time system

### Phase 3: Interactions (Days 5-7)
9. Create CustomerInteractionScene.js
10. Implement small talk mechanic
11. Add wait request system
12. Test owner interaction mode

### Phase 4: Staff System (Days 8-9)
13. Create StaffManager.js
14. Build task assignment UI
15. Implement staff performance tracking
16. Test task workflow

### Phase 5: Polish (Days 10-11)
17. Replace popup notifications
18. Upgrade customer database UI
19. Add satisfaction visualization
20. UI/UX improvements

### Phase 6: Integration (Days 12-14)
21. Refactor GameController integration
22. Implement save/load for new systems
23. Performance optimization
24. Comprehensive testing

---

## 🧪 Testing Checklist

- [ ] Customer personalities generate correctly
- [ ] Satisfaction splits 50/50 between bakery and personal
- [ ] Return rates vary based on personality and satisfaction
- [ ] Time system switches between realtime and calculated
- [ ] Owner gets immersive interaction mode
- [ ] Staff auto-resolve interactions with variance
- [ ] Small talk timing affects satisfaction
- [ ] Wait requests work properly
- [ ] Staff assignment prevents multi-tasking
- [ ] Staff performance affects customer satisfaction
- [ ] Notifications don't interrupt gameplay
- [ ] Customer database shows all new data
- [ ] Save/load preserves all state
- [ ] Performance is acceptable with many customers

---

## 🎮 Expected Gameplay Impact

**Before**: 
- Simple customer spawning
- Click to serve
- Immediate transactions
- Uniform customer behavior

**After**:
- Each customer has unique personality
- Complex interaction system with choices
- Time-based strategic decisions
- Staff management is deliberate
- Customer relationships matter
- Realistic satisfaction drivers

**Realism Increase**: ~300%
**Gameplay Depth**: ~500%
**Player Engagement**: Significantly Higher

---

## 📝 Notes for Implementation

- Start with Stage 1 (personality system) as foundation
- Each stage builds on previous
- Test thoroughly between stages
- Keep user informed of progress
- Document any deviations from plan
- Maintain backward compatibility where possible

**Next Step**: Begin Stage 1 implementation upon user approval.
