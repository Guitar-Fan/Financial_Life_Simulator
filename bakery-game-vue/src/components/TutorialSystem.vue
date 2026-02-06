<template>
  <Teleport to="body">
    <div v-if="isActive" class="tutorial-overlay" @click="handleOverlayClick">
      <!-- Spotlight Effect -->
      <div
        v-if="currentStep && currentStep.target"
        class="tutorial-spotlight"
        :style="spotlightStyle"
      ></div>

      <!-- Tutorial Card -->
      <div
        class="tutorial-card animate-slide-up"
        :style="cardPosition"
        @click.stop
      >
        <!-- Header -->
        <div class="tutorial-header">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ currentStep?.icon || '💡' }}</span>
            <div>
              <h3 class="font-bold text-lg text-bakery-brown-900">
                {{ currentStep?.title }}
              </h3>
              <p class="text-xs text-bakery-brown-600">
                Step {{ currentStepIndex + 1 }} of {{ steps.length }}
              </p>
            </div>
          </div>
          <button
            @click="skip"
            class="text-bakery-brown-400 hover:text-bakery-brown-600 transition-colors"
            title="Skip tutorial"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div class="tutorial-content">
          <p class="text-bakery-brown-700">{{ currentStep?.content }}</p>
          
          <!-- Action Hint -->
          <div v-if="currentStep?.action" class="tutorial-action">
            <span class="font-medium">{{ currentStep.action }}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="tutorial-progress">
          <div
            class="tutorial-progress-bar"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- Footer -->
        <div class="tutorial-footer">
          <button
            v-if="currentStepIndex > 0"
            @click="previous"
            class="tutorial-btn tutorial-btn-secondary"
          >
            ← Previous
          </button>
          <div class="flex-1"></div>
          <button
            v-if="currentStepIndex < steps.length - 1"
            @click="next"
            class="tutorial-btn tutorial-btn-primary"
          >
            Next →
          </button>
          <button
            v-else
            @click="complete"
            class="tutorial-btn tutorial-btn-success"
          >
            Complete! 🎉
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon?: string;
  target?: string; // CSS selector for element to highlight
  action?: string; // Optional action hint
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Props {
  steps: TutorialStep[];
  autoStart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
});

const emit = defineEmits<{
  complete: [];
  skip: [];
  stepChange: [step: TutorialStep];
}>();

const isActive = ref(false);
const currentStepIndex = ref(0);

const currentStep = computed(() => props.steps[currentStepIndex.value]);
const progress = computed(() => ((currentStepIndex.value + 1) / props.steps.length) * 100);

const spotlightStyle = computed(() => {
  if (!currentStep.value?.target) return {};
  
  const element = document.querySelector(currentStep.value.target);
  if (!element) return {};
  
  const rect = element.getBoundingClientRect();
  return {
    top: `${rect.top - 8}px`,
    left: `${rect.left - 8}px`,
    width: `${rect.width + 16}px`,
    height: `${rect.height + 16}px`,
  };
});

const cardPosition = computed(() => {
  if (!currentStep.value?.target || currentStep.value?.position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
  
  const element = document.querySelector(currentStep.value.target);
  if (!element) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
  
  const rect = element.getBoundingClientRect();
  const position = currentStep.value.position || 'bottom';
  
  switch (position) {
    case 'top':
      return {
        bottom: `${window.innerHeight - rect.top + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      };
    case 'bottom':
      return {
        top: `${rect.bottom + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + 20}px`,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 20}px`,
        transform: 'translateY(-50%)',
      };
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
  }
});

const start = () => {
  isActive.value = true;
  currentStepIndex.value = 0;
};

const next = () => {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++;
  }
};

const previous = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
};

const complete = () => {
  isActive.value = false;
  emit('complete');
};

const skip = () => {
  isActive.value = false;
  emit('skip');
};

const handleOverlayClick = () => {
  // Allow clicking through to highlighted elements
  if (!currentStep.value?.target) {
    skip();
  }
};

// Watch for step changes
watch(currentStep, (step) => {
  if (step) {
    emit('stepChange', step);
    
    // Scroll to highlighted element
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
});

// Auto-start if enabled
onMounted(() => {
  if (props.autoStart && props.steps.length > 0) {
    setTimeout(start, 500);
  }
});

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!isActive.value) return;
  
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    if (currentStepIndex.value < props.steps.length - 1) {
      next();
    } else {
      complete();
    }
  } else if (e.key === 'ArrowLeft') {
    previous();
  } else if (e.key === 'Escape') {
    skip();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

defineExpose({
  start,
  next,
  previous,
  complete,
  skip,
  isActive,
});
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  backdrop-filter: blur(2px);
}

.tutorial-spotlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 9999;
  transition: all 0.3s ease;
}

.tutorial-card {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  z-index: 10000;
}

.tutorial-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #fef3c7;
}

.tutorial-content {
  padding: 1.5rem;
}

.tutorial-action {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-left: 3px solid #d97706;
  border-radius: 4px;
  color: #78350f;
  font-size: 0.875rem;
}

.tutorial-progress {
  height: 4px;
  background: #fef3c7;
  overflow: hidden;
}

.tutorial-progress-bar {
  height: 100%;
  background: linear-gradient(to right, #d97706, #f59e0b);
  transition: width 0.3s ease;
}

.tutorial-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #fef3c7;
}

.tutorial-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.tutorial-btn-primary {
  background: #d97706;
  color: white;
}

.tutorial-btn-primary:hover {
  background: #b45309;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.tutorial-btn-secondary {
  background: #fef3c7;
  color: #78350f;
}

.tutorial-btn-secondary:hover {
  background: #fde68a;
}

.tutorial-btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.tutorial-btn-success:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
</style>
