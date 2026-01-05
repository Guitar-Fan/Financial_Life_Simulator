/**
 * StaffManager.js - Robust staff task assignment and management
 * Handles deliberate task assignment, staff availability, and performance tracking
 */

class StaffManager {
    constructor(gameController) {
        this.game = gameController;
        this.staff = []; // All staff members including owner
        this.tasks = new Map(); // taskId -> Task object
        this.assignments = new Map(); // staffId -> taskId
        this.taskHistory = []; // Completed tasks for analytics
        this.nextTaskId = 1;

        console.log('👔 StaffManager initialized');
    }

    // ==================== STAFF MANAGEMENT ====================

    /**
     * Register a staff member
     */
    addStaff(staff) {
        if (!staff.id) {
            staff.id = `staff_${this.staff.length + 1}`;
        }

        // Initialize staff properties
        staff.status = staff.status || 'available';
        staff.currentTask = null;
        staff.skill = staff.skill || 50;
        staff.speed = staff.speed || 50;
        staff.energy = staff.energy || 100;
        staff.tasksCompleted = staff.tasksCompleted || 0;
        staff.successCount = staff.successCount || 0;
        staff.failureCount = staff.failureCount || 0;
        staff.efficiency = staff.efficiency || 50;
        staff.totalTaskTime = staff.totalTaskTime || 0;
        staff.experienceWith = staff.experienceWith || {};
        staff.chattiness = staff.chattiness || 50;

        this.staff.push(staff);
        console.log(`➕ Added staff: ${staff.name} (${staff.role})`);

        return staff;
    }

    /**
     * Remove a staff member
     */
    removeStaff(staffId) {
        const index = this.staff.findIndex(s => s.id === staffId);
        if (index === -1) return false;

        // Cancel any assigned task
        if (this.assignments.has(staffId)) {
            const taskId = this.assignments.get(staffId);
            this.cancelTask(taskId);
        }

        this.staff.splice(index, 1);
        return true;
    }

    /**
     * Get all staff members
     */
    getAllStaff() {
        return [...this.staff];
    }

    /**
     * Get available staff
     */
    getAvailableStaff() {
        return this.staff.filter(s => this.isStaffAvailable(s));
    }

    /**
     * Get busy staff
     */
    getBusyStaff() {
        return this.staff.filter(s => !this.isStaffAvailable(s));
    }

    /**
     * Check if staff member is available
     */
    isStaffAvailable(staff) {
        return !this.assignments.has(staff.id) && staff.status === 'available';
    }

    /**
     * Get staff by ID
     */
    getStaff(staffId) {
        return this.staff.find(s => s.id === staffId);
    }

    // ==================== TASK MANAGEMENT ====================

    /**
     * Create a new task
     */
    createTask(type, details) {
        const task = {
            id: `task_${this.nextTaskId++}`,
            type: type, // 'baking', 'customer', 'cleaning', 'inventory', 'prep'
            details: details || {},
            status: 'pending', // 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
            assignedStaff: null,
            createdTime: Date.now(),
            startTime: null,
            completionTime: null,
            estimatedTime: this.estimateTaskTime(type, details),
            actualTime: null,
            priority: details.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
            outcome: null
        };

        this.tasks.set(task.id, task);
        console.log(`📋 Created task: ${task.type} (${task.id})`);

        return task;
    }

    /**
     * Assign task to staff member
     */
    assignTask(staff, task) {
        if (!this.isStaffAvailable(staff)) {
            return {
                success: false,
                reason: `${staff.name} is not available`
            };
        }

        // Check if task is already assigned
        if (task.assignedStaff) {
            return {
                success: false,
                reason: 'Task already assigned'
            };
        }

        // Assign the task
        this.assignments.set(staff.id, task.id);
        staff.status = 'busy';
        staff.currentTask = task;
        task.assignedStaff = staff;
        task.status = 'in_progress';
        task.startTime = Date.now();

        console.log(`✅ Assigned ${task.type} task to ${staff.name}`);

        // If time manager exists, advance time
        if (this.game.timeManager && task.estimatedTime) {
            this.game.timeManager.registerTimeCallback(
                this.game.timeManager.currentTime + task.estimatedTime,
                () => this.completeTask(task.id),
                true
            );
        }

        // Emit event
        if (this.game.engine && this.game.engine.emit) {
            this.game.engine.emit('task_assigned', {
                staff: staff,
                task: task
            });
        }

        return {
            success: true,
            estimatedCompletion: task.estimatedTime
        };
    }

    /**
     * Estimate time for a task
     */
    estimateTaskTime(type, details) {
        let baseTime = 60; // Default 60 seconds

        switch (type) {
            case 'baking':
                baseTime = details.recipe ? (details.recipe.bakingTime || 300) : 300;
                if (details.quantity) {
                    baseTime *= details.quantity;
                }
                if (details.skill) {
                    baseTime /= (1 + details.skill / 100); // Skilled staff faster
                }
                break;

            case 'customer':
                baseTime = 60;
                if (details.customer && details.customer.personality) {
                    baseTime += (details.customer.personality.chattiness / 100) * 30;
                }
                if (details.itemCount) {
                    baseTime += (details.itemCount - 1) * 15;
                }
                break;

            case 'cleaning':
                baseTime = 300; // 5 minutes
                break;

            case 'inventory':
                baseTime = 180; // 3 minutes
                if (details.itemCount) {
                    baseTime += details.itemCount * 10;
                }
                break;

            case 'prep':
                baseTime = 240; // 4 minutes
                break;

            default:
                baseTime = 120;
        }

        return Math.max(20, baseTime);
    }

    /**
     * Complete a task
     */
    completeTask(taskId, outcomeOverride = null) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'in_progress') {
            console.warn(`Cannot complete task ${taskId} - not in progress`);
            return null;
        }

        task.completionTime = Date.now();
        task.actualTime = (task.completionTime - task.startTime) / 1000; // Convert to seconds
        task.status = 'completed';

        // Calculate outcome if not provided
        if (outcomeOverride) {
            task.outcome = outcomeOverride;
        } else {
            task.outcome = this.calculateTaskOutcome(task);
        }

        // Free up staff
        const staff = task.assignedStaff;
        if (staff) {
            this.assignments.delete(staff.id);
            staff.status = 'available';
            staff.currentTask = null;

            // Update staff stats
            this.updateStaffStats(staff, task);

            // Restore energy slightly
            staff.energy = Math.min(100, staff.energy + 5);
        }

        // Move to history
        this.taskHistory.push({
            ...task,
            archivedAt: Date.now()
        });

        // Keep history limited
        if (this.taskHistory.length > 100) {
            this.taskHistory = this.taskHistory.slice(-100);
        }

        console.log(`✔️ Task completed: ${task.type} by ${staff?.name} (${task.outcome.success ? 'SUCCESS' : 'FAILED'})`);

        // Emit event
        if (this.game.engine && this.game.engine.emit) {
            this.game.engine.emit('task_completed', {
                staff: staff,
                task: task,
                outcome: task.outcome
            });
        }

        return task.outcome;
    }

    /**
     * Calculate task outcome based on staff performance
     */
    calculateTaskOutcome(task) {
        const staff = task.assignedStaff;
        if (!staff) {
            return { success: false, quality: 0, efficiency: 0 };
        }

        // Base success on skill
        let successChance = staff.skill / 100;

        // Energy affects performance
        successChance *= (staff.energy / 100);

        // Experience bonus
        if (staff.experienceWith[task.type]) {
            successChance *= 1.1; // 10% bonus
        }

        // Random factor (±20%)
        const randomFactor = 0.8 + (Math.random() * 0.4);
        successChance *= randomFactor;

        const success = Math.random() < successChance;

        // Calculate quality (0-100)
        let quality = staff.skill;
        quality *= (staff.energy / 100);
        quality += (Math.random() * 20 - 10); // ±10
        quality = Math.max(0, Math.min(100, quality));

        // Calculate efficiency (how close to estimated time)
        const timeRatio = task.actualTime / task.estimatedTime;
        let efficiency = 100;
        if (timeRatio > 1.2) {
            efficiency = 60; // Took too long
        } else if (timeRatio > 1) {
            efficiency = 80; // Slightly slow
        } else if (timeRatio < 0.8) {
            efficiency = 90; // Good speed
        }

        return {
            success: success,
            quality: Math.round(quality),
            efficiency: Math.round(efficiency),
            timeRatio: timeRatio
        };
    }

    /**
     * Fail a task
     */
    failTask(taskId, reason) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.status = 'failed';
        task.completionTime = Date.now();
        task.outcome = {
            success: false,
            quality: 0,
            efficiency: 0,
            failureReason: reason
        };

        // Free up staff
        const staff = task.assignedStaff;
        if (staff) {
            this.assignments.delete(staff.id);
            staff.status = 'available';
            staff.currentTask = null;
            this.updateStaffStats(staff, task);
        }

        console.log(`❌ Task failed: ${task.type} - ${reason}`);
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.status = 'cancelled';

        // Free up staff if assigned
        const staff = task.assignedStaff;
        if (staff) {
            this.assignments.delete(staff.id);
            staff.status = 'available';
            staff.currentTask = null;
        }

        this.tasks.delete(taskId);
        console.log(`🚫 Task cancelled: ${task.type}`);
    }

    /**
     * Get all tasks
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }

    /**
     * Get pending tasks
     */
    getPendingTasks() {
        return Array.from(this.tasks.values()).filter(t => t.status === 'pending');
    }

    /**
     * Get active tasks
     */
    getActiveTasks() {
        return Array.from(this.tasks.values()).filter(t => t.status === 'in_progress');
    }

    // ==================== STAFF STATS ====================

    /**
     * Update staff statistics after task completion
     */
    updateStaffStats(staff, task) {
        staff.tasksCompleted++;
        staff.totalTaskTime += task.actualTime || 0;

        if (task.outcome && task.outcome.success) {
            staff.successCount++;

            // Skill improvement chance (10%)
            if (Math.random() < 0.1) {
                staff.skill = Math.min(100, staff.skill + 1);
                console.log(`📈 ${staff.name}'s skill increased to ${staff.skill}`);
            }

            // Track experience with task type
            if (!staff.experienceWith[task.type]) {
                staff.experienceWith[task.type] = 0;
            }
            staff.experienceWith[task.type]++;
        } else {
            staff.failureCount++;
        }

        // Update efficiency rating
        staff.efficiency = staff.tasksCompleted > 0
            ? Math.round((staff.successCount / staff.tasksCompleted) * 100)
            : 50;

        // Energy depletion
        staff.energy = Math.max(20, staff.energy - 5);
    }

    /**
     * Get staff performance metrics
     */
    getStaffMetrics(staffId) {
        const staff = this.getStaff(staffId);
        if (!staff) return null;

        const avgTaskTime = staff.tasksCompleted > 0
            ? staff.totalTaskTime / staff.tasksCompleted
            : 0;

        return {
            name: staff.name,
            role: staff.role,
            skill: staff.skill,
            efficiency: staff.efficiency,
            tasksCompleted: staff.tasksCompleted,
            successRate: staff.tasksCompleted > 0
                ? Math.round((staff.successCount / staff.tasksCompleted) * 100)
                : 0,
            averageTaskTime: Math.round(avgTaskTime),
            energy: staff.energy,
            status: staff.status,
            currentTask: staff.currentTask?.type || null
        };
    }

    /**
     * Get all staff metrics
     */
    getAllStaffMetrics() {
        return this.staff.map(s => this.getStaffMetrics(s.id));
    }

    /**
     * Rest staff (restore energy)
     */
    restStaff(staffId) {
        const staff = this.getStaff(staffId);
        if (!staff) return;

        staff.energy = Math.min(100, staff.energy + 30);
        console.log(`😴 ${staff.name} rested. Energy: ${staff.energy}`);
    }

    // ==================== TASK ALLOCATION ====================

    /**
     * Auto-assign tasks to available staff (basic AI)
     */
    autoAssignTasks() {
        const pendingTasks = this.getPendingTasks();
        const availableStaff = this.getAvailableStaff();

        if (pendingTasks.length === 0 || availableStaff.length === 0) {
            return [];
        }

        const assignments = [];

        // Sort tasks by priority
        pendingTasks.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Assign tasks to best-suited staff
        for (const task of pendingTasks) {
            if (availableStaff.length === 0) break;

            // Find best staff for this task
            const bestStaff = this.findBestStaffForTask(task, availableStaff);
            if (bestStaff) {
                const result = this.assignTask(bestStaff, task);
                if (result.success) {
                    assignments.push({ staff: bestStaff, task: task });
                    // Remove from available
                    const index = availableStaff.indexOf(bestStaff);
                    if (index > -1) {
                        availableStaff.splice(index, 1);
                    }
                }
            }
        }

        return assignments;
    }

    /**
     * Find best staff member for a task
     */
    findBestStaffForTask(task, availableStaff) {
        if (availableStaff.length === 0) return null;

        // Score each staff member
        const scores = availableStaff.map(staff => ({
            staff: staff,
            score: this.scoreStaffForTask(staff, task)
        }));

        // Sort by score
        scores.sort((a, b) => b.score - a.score);

        return scores[0].staff;
    }

    /**
     * Score how suitable a staff member is for a task
     */
    scoreStaffForTask(staff, task) {
        let score = 0;

        // Base skill
        score += staff.skill;

        // Energy level
        score += staff.energy / 2;

        // Experience with task type
        if (staff.experienceWith[task.type]) {
            score += staff.experienceWith[task.type] * 2;
        }

        // Efficiency
        score += staff.efficiency / 2;

        // Role match
        if (task.type === 'baking' && staff.role === 'baker') {
            score += 30;
        } else if (task.type === 'customer' && staff.role === 'server') {
            score += 30;
        }

        return score;
    }

    // ==================== STATE MANAGEMENT ====================

    /**
     * Get state for saving
     */
    getState() {
        return {
            staff: this.staff,
            tasks: Array.from(this.tasks.entries()),
            assignments: Array.from(this.assignments.entries()),
            taskHistory: this.taskHistory.slice(-50), // Last 50
            nextTaskId: this.nextTaskId
        };
    }

    /**
     * Restore state from save
     */
    setState(state) {
        if (!state) return;

        this.staff = state.staff || [];
        this.tasks = new Map(state.tasks || []);
        this.assignments = new Map(state.assignments || []);
        this.taskHistory = state.taskHistory || [];
        this.nextTaskId = state.nextTaskId || 1;
    }

    /**
     * Clear all tasks and assignments
     */
    reset() {
        this.tasks.clear();
        this.assignments.clear();
        this.staff.forEach(s => {
            s.status = 'available';
            s.currentTask = null;
        });
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.StaffManager = StaffManager;
}
