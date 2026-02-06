/**
 * Game Loop Composable - Main update cycle for all game systems
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useBakeryGameStore } from '../stores/bakery-game-store';
import { useBakeryFinancialStore } from '../stores/bakery-financial-store';
import { useBakeryProductionStore } from '../stores/bakery-production-store';
import { useBakeryInventoryStore } from '../stores/bakery-inventory-store';
import { useBakeryEconomyStore } from '../stores/bakery-economy-store';
import { useBakeryCustomerStore } from '../stores/bakery-customer-store';
import { useBakeryStaffStore } from '../stores/bakery-staff-store';

export function useBakeryGameLoop() {
  const gameStore = useBakeryGameStore();
  const financialStore = useBakeryFinancialStore();
  const productionStore = useBakeryProductionStore();
  const inventoryStore = useBakeryInventoryStore();
  const economyStore = useBakeryEconomyStore();
  const customerStore = useBakeryCustomerStore();
  const staffStore = useBakeryStaffStore();

  const lastUpdateTime = ref<number>(Date.now());
  const accumulatedTime = ref<number>(0);
  let animationFrameId: number | null = null;

  const TICK_RATE = 1000 / 60; // 60 FPS
  const GAME_MINUTE_MS = 1000; // 1 real second = 1 game minute

  function gameLoop(currentTime: number) {
    if (!gameStore.isRunning || gameStore.isPaused) {
      lastUpdateTime.value = currentTime;
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = currentTime - lastUpdateTime.value;
    lastUpdateTime.value = currentTime;

    accumulatedTime.value += deltaTime * gameStore.gameSpeed;

    // Fixed time step updates
    while (accumulatedTime.value >= GAME_MINUTE_MS) {
      updateGameSystems(1); // 1 game minute
      accumulatedTime.value -= GAME_MINUTE_MS;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function updateGameSystems(deltaMinutes: number) {
    // Update time
    financialStore.advanceTime(deltaMinutes);

    // Update production queue
    if (gameStore.currentPhase === 'baking') {
      productionStore.updateProduction(deltaMinutes);
      
      // Check for automation
      if (gameStore.automationEnabled) {
        productionStore.maintainProductionTargets();
      }
    }

    // Update product freshness
    inventoryStore.updateFreshness(financialStore.day);

    // Spawn customers during selling phase
    if (gameStore.currentPhase === 'selling' && !financialStore.isAfterHours) {
      maybeSpawnCustomer();
    }

    // Check for day end
    if (financialStore.hour >= 20 && gameStore.currentPhase === 'selling') {
      endDaySequence();
    }
  }

  function maybeSpawnCustomer() {
    // Spawn logic based on time of day, traffic, etc.
    const spawnChance = 0.1; // 10% chance per minute
    if (Math.random() < spawnChance) {
      customerStore.spawnCustomers(1);
    }
  }

  function endDaySequence() {
    // Discard spoiled products
    const spoiled = inventoryStore.discardSpoiled(financialStore.day);
    
    // Pay staff for the day
    staffStore.staff.forEach(emp => {
      staffStore.endShift(emp.id);
    });

    // Simulate economy
    economyStore.simulateDay();

    // End financial day
    financialStore.endDay();

    // Reset customer metrics
    customerStore.metrics.newCustomersToday = 0;

    // Move to summary phase
    gameStore.goToPhase('summary');
  }

  function start() {
    if (!animationFrameId) {
      lastUpdateTime.value = Date.now();
      accumulatedTime.value = 0;
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function stop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  onMounted(() => {
    start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    start,
    stop,
    updateGameSystems,
  };
}
