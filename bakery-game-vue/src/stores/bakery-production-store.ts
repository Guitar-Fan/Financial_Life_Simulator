/**
 * Production Store - Baking queue, multi-stage production, and automation
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ProductionQueueItem, Recipe } from '../types/bakery-game-types';
import { useBakeryInventoryStore } from './bakery-inventory-store';
import { useBakeryStaffStore } from './bakery-staff-store';

export const useBakeryProductionStore = defineStore('bakeryProduction', () => {
  // ============ State ============
  const queue = ref<ProductionQueueItem[]>([]);
  const ovenCapacity = ref<number>(3);
  const bakingSpeedMultiplier = ref<number>(1.0);
  const automationEnabled = ref<boolean>(false);
  const productionTargets = ref<{ [recipeKey: string]: number }>({});

  // ============ Getters ============
  const queueByStage = computed(() => {
    const byStage: { [stage: string]: ProductionQueueItem[] } = {};
    queue.value.forEach(item => {
      const stage = item.currentStage;
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(item);
    });
    return byStage;
  });

  const itemsInOven = computed(() => {
    return queue.value.filter(item => 
      item.currentStage === 'baking' && item.hasOvenSlot
    ).length;
  });

  const ovenSlotsAvailable = computed(() => {
    return ovenCapacity.value - itemsInOven.value;
  });

  const itemsWaitingForOven = computed(() => {
    return queue.value.filter(item => 
      item.currentStage === 'baking' && item.waitingForOven && !item.hasOvenSlot
    ).length;
  });

  const estimatedCompletionTimes = computed(() => {
    const times: { [id: string]: number } = {};
    queue.value.forEach(item => {
      let remainingTime = 0;
      for (let i = item.stageIndex; i < item.stages.length; i++) {
        const stage = item.stages[i];
        if (i === item.stageIndex) {
          remainingTime += stage.duration * (1 - item.progress);
        } else {
          remainingTime += stage.duration;
        }
      }
      times[item.id] = remainingTime / bakingSpeedMultiplier.value;
    });
    return times;
  });

  // ============ Actions ============
  function startBaking(recipe: Recipe, quantity: number) {
    const inventoryStore = useBakeryInventoryStore();
    
    // Calculate ingredients needed
    const ingredientsNeeded: { [key: string]: number } = {};
    for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
      ingredientsNeeded[ingredient] = amount * quantity;
    }
    
    // Check if we have enough ingredients
    for (const [ingredient, amount] of Object.entries(ingredientsNeeded)) {
      if (inventoryStore.getIngredientStock(ingredient) < amount) {
        throw new Error(`Not enough ${ingredient}`);
      }
    }
    
    // Consume ingredients and get average quality
    const ingredientQuality = inventoryStore.consumeIngredients(ingredientsNeeded);
    
    // Create production item
    const stages = recipe.stages || [
      { name: 'prep' as const, duration: 10, skillImpact: 0.3, requiresOven: false },
      { name: 'mixing' as const, duration: 15, skillImpact: 0.4, requiresOven: false },
      { name: 'baking' as const, duration: recipe.bakeTime, skillImpact: 0.5, requiresOven: true },
      { name: 'cooling' as const, duration: 20, skillImpact: 0.1, requiresOven: false },
    ];
    
    const item: ProductionQueueItem = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeKey: recipe.key,
      quantity,
      currentStage: stages[0].name,
      stageIndex: 0,
      stages,
      progress: 0,
      totalTime: stages.reduce((sum, s) => sum + s.duration, 0),
      ingredientQuality,
      prepQuality: 1.0,
      assignedEmployee: null,
      employeeSkillImpact: 1.0,
      waitingForOven: false,
      hasOvenSlot: false,
    };
    
    queue.value.push(item);
    return item.id;
  }

  function updateProduction(deltaMinutes: number) {
    const staffStore = useBakeryStaffStore();
    
    queue.value.forEach(item => {
      const stage = item.stages[item.stageIndex];
      
      // Check if waiting for oven
      if (stage.requiresOven && !item.hasOvenSlot) {
        if (ovenSlotsAvailable.value > 0) {
          item.hasOvenSlot = true;
          item.waitingForOven = false;
        } else {
          item.waitingForOven = true;
          return; // Skip this item for now
        }
      }
      
      // Apply employee skill impact
      let effectiveSpeed = bakingSpeedMultiplier.value;
      if (item.assignedEmployee) {
        const employee = staffStore.getEmployeeById(item.assignedEmployee);
        if (employee) {
          const skillBonus = (employee.skillLevel / 10) * stage.skillImpact;
          effectiveSpeed *= (1 + skillBonus);
        }
      }
      
      // Update progress
      const progressDelta = (deltaMinutes / stage.duration) * effectiveSpeed;
      item.progress += progressDelta;
      
      // Check if stage complete
      if (item.progress >= 1.0) {
        completeStage(item.id);
      }
    });
  }

  function completeStage(itemId: string) {
    const item = queue.value.find(i => i.id === itemId);
    if (!item) return;
    
    const currentStage = item.stages[item.stageIndex];
    
    // Apply quality based on employee skill
    if (item.assignedEmployee) {
      const staffStore = useBakeryStaffStore();
      const employee = staffStore.getEmployeeById(item.assignedEmployee);
      if (employee) {
        const skillFactor = employee.skillLevel / 10;
        item.prepQuality *= (0.8 + skillFactor * 0.4); // 0.8 to 1.2 range
      }
    }
    
    // Release oven slot if needed
    if (currentStage.requiresOven) {
      item.hasOvenSlot = false;
    }
    
    // Move to next stage or complete
    if (item.stageIndex < item.stages.length - 1) {
      item.stageIndex++;
      item.currentStage = item.stages[item.stageIndex].name;
      item.progress = 0;
    } else {
      // Production complete!
      finishProduction(itemId);
    }
  }

  function finishProduction(itemId: string) {
    const itemIndex = queue.value.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = queue.value[itemIndex];
    const inventoryStore = useBakeryInventoryStore();
    
    // Calculate final quality
    const finalQuality = (item.ingredientQuality + item.prepQuality) / 2;
    
    // Calculate unit cost (ingredients + labor estimate)
    const laborCostPerUnit = 2.5; // Rough estimate
    const ingredientCostPerUnit = 5.0; // Would calculate from actual ingredients
    const unitCost = ingredientCostPerUnit + laborCostPerUnit;
    
    // Add to inventory
    inventoryStore.addProduct(
      item.recipeKey,
      item.quantity,
      finalQuality,
      item.ingredientQuality,
      unitCost
    );
    
    // Remove from queue
    queue.value.splice(itemIndex, 1);
  }

  function assignEmployee(itemId: string, employeeId: string) {
    const item = queue.value.find(i => i.id === itemId);
    if (item) {
      item.assignedEmployee = employeeId;
    }
  }

  function unassignEmployee(itemId: string) {
    const item = queue.value.find(i => i.id === itemId);
    if (item) {
      item.assignedEmployee = null;
    }
  }

  function cancelProduction(itemId: string) {
    const itemIndex = queue.value.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
      // Could refund partial ingredients based on progress
      queue.value.splice(itemIndex, 1);
    }
  }

  function setProductionTarget(recipeKey: string, quantity: number) {
    if (quantity <= 0) {
      delete productionTargets.value[recipeKey];
    } else {
      productionTargets.value[recipeKey] = quantity;
    }
  }

  function maintainProductionTargets() {
    if (!automationEnabled.value) return;
    
    const inventoryStore = useBakeryInventoryStore();
    
    // Check each target and auto-start production if below target
    for (const [recipeKey, target] of Object.entries(productionTargets.value)) {
      const currentStock = inventoryStore.getProductStock(recipeKey);
      const inProduction = queue.value
        .filter(item => item.recipeKey === recipeKey)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const total = currentStock + inProduction;
      
      if (total < target) {
        // Auto-start production (would need recipe data)
        console.log(`Auto-producing ${recipeKey} to maintain target ${target}`);
      }
    }
  }

  function resetProduction() {
    queue.value = [];
    productionTargets.value = {};
    ovenCapacity.value = 3;
    bakingSpeedMultiplier.value = 1.0;
  }

  return {
    // State
    queue,
    ovenCapacity,
    bakingSpeedMultiplier,
    automationEnabled,
    productionTargets,
    
    // Getters
    queueByStage,
    itemsInOven,
    ovenSlotsAvailable,
    itemsWaitingForOven,
    estimatedCompletionTimes,
    
    // Actions
    startBaking,
    updateProduction,
    completeStage,
    finishProduction,
    assignEmployee,
    unassignEmployee,
    cancelProduction,
    setProductionTarget,
    maintainProductionTargets,
    resetProduction,
  };
}, {
  persist: {
    key: 'bakery_production_state',
    storage: localStorage,
    pick: ['productionTargets', 'ovenCapacity', 'bakingSpeedMultiplier'],
  },
});
