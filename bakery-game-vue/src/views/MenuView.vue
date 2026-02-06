<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBakeryGameStore } from '@/stores';
import { BakeryCard, BakeryButton } from '@/components/base';
import TutorialSystem from '@/components/TutorialSystem.vue';
import { gameTutorialSteps } from '@/data/tutorialSteps';

const router = useRouter();
const gameStore = useBakeryGameStore();
const tutorialRef = ref<InstanceType<typeof TutorialSystem> | null>(null);

const startNewGame = () => {
  gameStore.startGame();
};

const continueGame = () => {
  gameStore.goToPhase('buying');
};

const openDashboard = () => {
  router.push('/dashboard');
};

const showLoadModal = ref(false);
const showTutorial = ref(false);

const startTutorial = () => {
  showTutorial.value = true;
  tutorialRef.value?.start();
};

const handleTutorialComplete = () => {
  showTutorial.value = false;
  localStorage.setItem('bakery-tutorial-completed', 'true');
};

const handleTutorialSkip = () => {
  showTutorial.value = false;
};

// Check if first time user
onMounted(() => {
  const hasSeenTutorial = localStorage.getItem('bakery-tutorial-completed');
  if (!hasSeenTutorial) {
    setTimeout(() => {
      startTutorial();
    }, 1000);
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div class="w-full max-w-4xl">
      <!-- Hero Section -->
      <div class="text-center mb-12 animate-fade-in">
        <div class="text-8xl mb-4">🥐</div>
        <h1 class="text-5xl font-display font-bold text-gradient-gold mb-3">
          Bakery Tycoon
        </h1>
        <p class="text-xl text-bakery-brown-600">
          Build your pastry empire from the ground up
        </p>
      </div>

      <!-- Main Menu Cards -->
      <div class="grid md:grid-cols-2 gap-6 mb-8 animate-slide-up">
        <!-- New Game Card -->
        <BakeryCard variant="glass" hoverable padding="lg">
          <div class="text-center">
            <div class="text-5xl mb-4">🆕</div>
            <h3 class="text-2xl font-display font-bold mb-3">New Game</h3>
            <p class="text-bakery-brown-600 mb-6">
              Start fresh with $50,000 and build your bakery from scratch
            </p>
            <BakeryButton
              variant="primary"
              size="lg"
              full-width
              @click="startNewGame"
            >
              Start New Game
            </BakeryButton>
          </div>
        </BakeryCard>

        <!-- Continue Game Card -->
        <BakeryCard variant="glass" hoverable padding="lg">
          <div class="text-center">
            <div class="text-5xl mb-4">💾</div>
            <h3 class="text-2xl font-display font-bold mb-3">Continue</h3>
            <p class="text-bakery-brown-600 mb-6">
              Load your saved game and continue your bakery journey
            </p>
            <BakeryButton
              variant="secondary"
              size="lg"
              full-width
              @click="showLoadModal = true"
            >
              Load Game
            </BakeryButton>
          </div>
        </BakeryCard>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style="animation-delay: 0.1s">
        <BakeryCard variant="outlined" hoverable padding="md">
          <button class="w-full text-center" @click="startTutorial">
            <div class="text-3xl mb-2">📚</div>
            <p class="text-sm font-medium">Tutorial</p>
          </button>
        </BakeryCard>

        <BakeryCard variant="outlined" hoverable padding="md">
          <button class="w-full text-center">
            <div class="text-3xl mb-2">🏆</div>
            <p class="text-sm font-medium">Achievements</p>
          </button>
        </BakeryCard>

        <BakeryCard variant="outlined" hoverable padding="md">
          <button class="w-full text-center" @click="openDashboard">
            <div class="text-3xl mb-2">📊</div>
            <p class="text-sm font-medium">Dashboard</p>
          </button>
        </BakeryCard>

        <BakeryCard variant="outlined" hoverable padding="md">
          <button class="w-full text-center">
            <div class="text-3xl mb-2">⚙️</div>
            <p class="text-sm font-medium">Settings</p>
          </button>
        </BakeryCard>
      </div>

      <!-- Game Info -->
      <div class="mt-12 text-center text-sm text-bakery-brown-500">
        <p>Version 1.0.0 (Vue 3 Migration) | Made with ❤️ and 🥐</p>
      </div>
    </div>

    <!-- Tutorial System -->
    <TutorialSystem
      v-if="showTutorial"
      ref="tutorialRef"
      :steps="gameTutorialSteps"
      :auto-start="false"
      @complete="handleTutorialComplete"
      @skip="handleTutorialSkip"
    />
  </div>
</template>
