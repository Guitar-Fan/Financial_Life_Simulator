/**
 * Main Game Store - Controls game flow, UI state, and phase management
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GamePhase } from '../types/bakery-game-types';

export const useBakeryGameStore = defineStore('bakeryGame', () => {
  // ============ State ============
  const currentPhase = ref<GamePhase>('menu');
  const phaseOrder = ref<GamePhase[]>(['setup', 'buying', 'baking', 'selling', 'summary']);
  const phaseIndex = ref<number>(0);
  const isRunning = ref<boolean>(false);
  const isPaused = ref<boolean>(false);
  const gameSpeed = ref<number>(1); // 0.5x, 1x, 2x, 5x
  const automationEnabled = ref<boolean>(false);
  const showTutorial = ref<boolean>(true);

  // UI State
  const activeDashboardTab = ref<string>('overview');
  const showDashboard = ref<boolean>(false);
  const showStaffPanel = ref<boolean>(false);
  const showCustomersPanel = ref<boolean>(false);
  const activeModal = ref<string | null>(null);

  // Business Modifiers (set during setup)
  const trafficMultiplier = ref<number>(1.0);
  const qualityMultiplier = ref<number>(1.0);
  const efficiencyMultiplier = ref<number>(1.0);
  const dailyMaintenanceCost = ref<number>(0);
  const locationId = ref<string | null>(null);
  const equipmentTierId = ref<string | null>(null);
  const financingId = ref<string | null>(null);
  const demographics = ref<{ budget: number; mainstream: number; premium: number }>({
    budget: 0.3,
    mainstream: 0.5,
    premium: 0.2
  });

  // ============ Getters ============
  const currentPhaseIndex = computed(() =>
    phaseOrder.value.indexOf(currentPhase.value)
  );

  const isInGamePhase = computed(() =>
    phaseOrder.value.includes(currentPhase.value)
  );

  const nextPhase = computed(() => {
    const nextIndex = currentPhaseIndex.value + 1;
    return nextIndex < phaseOrder.value.length
      ? phaseOrder.value[nextIndex]
      : null;
  });

  const previousPhase = computed(() => {
    const prevIndex = currentPhaseIndex.value - 1;
    return prevIndex >= 0
      ? phaseOrder.value[prevIndex]
      : null;
  });

  // ============ Actions ============
  function startGame() {
    isRunning.value = true;
    currentPhase.value = 'setup';
    phaseIndex.value = 0;
  }

  function goToPhase(phase: GamePhase) {
    if (phase === 'menu') {
      isRunning.value = false;
    }
    currentPhase.value = phase;
    phaseIndex.value = phaseOrder.value.indexOf(phase);
  }

  function advancePhase() {
    const next = nextPhase.value;
    if (next) {
      currentPhase.value = next;
      phaseIndex.value = currentPhaseIndex.value;
    } else {
      // Cycle back to buying for next day
      currentPhase.value = 'buying';
      phaseIndex.value = 0;
    }
  }

  function goBackPhase() {
    const prev = previousPhase.value;
    if (prev) {
      currentPhase.value = prev;
      phaseIndex.value = currentPhaseIndex.value;
    }
  }

  function pauseGame() {
    isPaused.value = true;
  }

  function resumeGame() {
    isPaused.value = false;
  }

  function setGameSpeed(speed: number) {
    gameSpeed.value = Math.max(0.5, Math.min(5, speed));
  }

  function toggleAutomation() {
    automationEnabled.value = !automationEnabled.value;
  }

  function openDashboard(tab?: string) {
    showDashboard.value = true;
    if (tab) activeDashboardTab.value = tab;
  }

  function closeDashboard() {
    showDashboard.value = false;
  }

  function openModal(modalId: string) {
    activeModal.value = modalId;
  }

  function closeModal() {
    activeModal.value = null;
  }

  function applySetup(choices: {
    traffic: number;
    quality: number;
    efficiency: number;
    maintenance: number;
    locationId: string;
    equipmentId: string;
    financingId: string;
    demographics: { budget: number; mainstream: number; premium: number };
  }) {
    trafficMultiplier.value = choices.traffic;
    qualityMultiplier.value = choices.quality;
    efficiencyMultiplier.value = choices.efficiency;
    dailyMaintenanceCost.value = choices.maintenance;
    locationId.value = choices.locationId;
    equipmentTierId.value = choices.equipmentId;
    financingId.value = choices.financingId;
    demographics.value = choices.demographics;
  }

  function resetGame() {
    currentPhase.value = 'menu';
    phaseIndex.value = 0;
    isRunning.value = false;
    isPaused.value = false;
    gameSpeed.value = 1;
    automationEnabled.value = false;
    showDashboard.value = false;
    showStaffPanel.value = false;
    showCustomersPanel.value = false;
    activeModal.value = null;
  }

  return {
    // State
    currentPhase,
    phaseOrder,
    phaseIndex,
    isRunning,
    isPaused,
    gameSpeed,
    automationEnabled,
    showTutorial,
    activeDashboardTab,
    showDashboard,
    showStaffPanel,
    showCustomersPanel,
    activeModal,
    trafficMultiplier,
    qualityMultiplier,
    efficiencyMultiplier,
    dailyMaintenanceCost,
    locationId,
    equipmentTierId,
    financingId,
    demographics,

    // Getters
    currentPhaseIndex,
    isInGamePhase,
    nextPhase,
    previousPhase,

    // Actions
    startGame,
    goToPhase,
    advancePhase,
    goBackPhase,
    pauseGame,
    resumeGame,
    setGameSpeed,
    toggleAutomation,
    openDashboard,
    closeDashboard,
    openModal,
    closeModal,
    applySetup,
    resetGame,
  };
}, {
  persist: {
    key: 'bakery_game_state',
    storage: localStorage,
    pick: ['currentPhase', 'gameSpeed', 'automationEnabled', 'showTutorial'],
  },
});
