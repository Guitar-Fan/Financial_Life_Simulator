<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBakeryGameStore, useBakeryFinancialStore } from '@/stores';
import { BakeryCard, BakeryButton, BakeryBadge, BakeryProgressBar } from '@/components/base';
import { 
  FINANCING_OPTIONS, 
  LOCATION_OPTIONS, 
  EQUIPMENT_TIERS,
  type FinancingOption,
  type LocationOption,
  type EquipmentTier
} from '@/data/setup-options';

const router = useRouter();
const gameStore = useBakeryGameStore();
const financialStore = useBakeryFinancialStore();

// Setup State
const currentStep = ref(1);
const totalSteps = 3;

const selectedFinancing = ref<FinancingOption | null>(null);
const selectedLocation = ref<LocationOption | null>(null);
const selectedEquipment = ref<EquipmentTier | null>(null);

// Computed stats based on selections
const startingCash = computed(() => {
  let cash = 15000; // Base savings
  if (selectedFinancing.value) {
    cash += selectedFinancing.value.amount;
  }
  if (selectedEquipment.value) {
    cash -= selectedEquipment.value.price;
  }
  return cash;
});

const projectedRent = computed(() => selectedLocation.value?.rent || 0);
const projectedTraffic = computed(() => selectedLocation.value?.trafficMultiplier || 1.0);
const qualityMultiplier = computed(() => selectedEquipment.value?.qualityMultiplier || 1.0);

const canProgress = computed(() => {
  if (currentStep.value === 1) return !!selectedFinancing.value;
  if (currentStep.value === 2) return !!selectedLocation.value;
  if (currentStep.value === 3) return !!selectedEquipment.value;
  return false;
});

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    completeSetup();
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const completeSetup = () => {
  // Apply choices to stores
  if (selectedFinancing.value && selectedLocation.value && selectedEquipment.value) {
    // Phase 1: Main Game Modifiers
    gameStore.applySetup({
      traffic: selectedLocation.value.trafficMultiplier,
      quality: selectedEquipment.value.qualityMultiplier,
      efficiency: selectedEquipment.value.efficiencyMultiplier,
      maintenance: selectedEquipment.value.maintenanceCost,
      locationId: selectedLocation.value.id,
      equipmentId: selectedEquipment.value.id,
      financingId: selectedFinancing.value.id,
      demographics: selectedLocation.value.demographics
    });

    // Phase 2: Financial Initialization
    financialStore.cash = startingCash.value;
    financialStore.rentAmount = selectedLocation.value.rent * 30; // Monthly rent
  }
  
  // Advance to the first gameplay phase
  gameStore.advancePhase();
};

const selectFinancing = (option: FinancingOption) => {
  selectedFinancing.value = option;
};

const selectLocation = (option: LocationOption) => {
  selectedLocation.value = option;
};

const selectEquipment = (option: EquipmentTier) => {
  selectedEquipment.value = option;
};
</script>

<template>
  <div class="max-w-6xl mx-auto animate-fade-in">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h2 class="text-4xl font-display font-bold text-gradient-gold mb-2">
        Establish Your Bakery
      </h2>
      <p class="text-bakery-brown-600">
        Step {{ currentStep }} of {{ totalSteps }}: 
        <span v-if="currentStep === 1">Choose Your Financing</span>
        <span v-else-if="currentStep === 2">Select Your Location</span>
        <span v-else-if="currentStep === 3">Equipment & Outfitting</span>
      </p>
      
      <!-- Progress Bar -->
      <div class="max-w-md mx-auto mt-4">
        <BakeryProgressBar 
          :value="(currentStep / totalSteps) * 100" 
          variant="gold" 
          size="md"
          animated
        />
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Options Column -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Step 1: Financing -->
        <Transition name="scale" mode="out-in">
          <div v-if="currentStep === 1" class="grid md:grid-cols-1 gap-4">
            <BakeryCard 
              v-for="option in FINANCING_OPTIONS" 
              :key="option.id"
              :variant="selectedFinancing?.id === option.id ? 'glass' : 'outlined'"
              hoverable
              padding="lg"
              class="cursor-pointer transition-all border-2"
              :class="selectedFinancing?.id === option.id ? 'border-bakery-gold-400' : 'border-transparent'"
              @click="selectFinancing(option)"
            >
              <div class="flex items-start gap-4">
                <div class="text-5xl">{{ option.icon }}</div>
                <div class="flex-1">
                  <div class="flex justify-between items-start">
                    <h3 class="text-xl font-bold">{{ option.name }}</h3>
                    <BakeryBadge 
                      :variant="option.difficulty === 'Relaxed' ? 'success' : option.difficulty === 'Standard' ? 'warning' : 'danger'"
                    >
                      {{ option.difficulty }}
                    </BakeryBadge>
                  </div>
                  <p class="text-bakery-brown-600 mt-1">{{ option.description }}</p>
                  
                  <div class="mt-4 grid grid-cols-2 gap-4">
                    <div v-if="option.amount > 0">
                      <p class="text-xs uppercase text-bakery-brown-500">Loan Amount</p>
                      <p class="font-bold text-profit">${{ option.amount.toLocaleString() }}</p>
                    </div>
                    <div v-if="option.interestRate > 0">
                      <p class="text-xs uppercase text-bakery-brown-500">Interest Rate</p>
                      <p class="font-bold text-amber-600">{{ (option.interestRate * 100).toFixed(1) }}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </BakeryCard>
          </div>

          <!-- Step 2: Location -->
          <div v-else-if="currentStep === 2" class="grid md:grid-cols-1 gap-4">
            <BakeryCard 
              v-for="option in LOCATION_OPTIONS" 
              :key="option.id"
              :variant="selectedLocation?.id === option.id ? 'glass' : 'outlined'"
              hoverable
              padding="lg"
              class="cursor-pointer transition-all border-2"
              :class="selectedLocation?.id === option.id ? 'border-bakery-gold-400' : 'border-transparent'"
              @click="selectLocation(option)"
            >
              <div class="flex items-start gap-4">
                <div class="text-5xl">{{ option.icon }}</div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold">{{ option.name }}</h3>
                  <p class="text-bakery-brown-600 mt-1">{{ option.description }}</p>
                  
                  <div class="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div class="bg-bakery-brown-50 p-2 rounded-lg">
                      <p class="text-[10px] uppercase text-bakery-brown-500">Daily Rent</p>
                      <p class="font-bold text-danger">${{ option.rent }}</p>
                    </div>
                    <div class="bg-bakery-brown-50 p-2 rounded-lg">
                      <p class="text-[10px] uppercase text-bakery-brown-500">Traffic</p>
                      <p class="font-bold text-blue-600">{{ (option.trafficMultiplier * 100).toFixed(0) }}%</p>
                    </div>
                    <div class="bg-bakery-brown-50 p-2 rounded-lg">
                      <p class="text-[10px] uppercase text-bakery-brown-500">Focus</p>
                      <p class="font-bold text-bakery-gold-600">
                        {{ option.demographics.premium > 0.4 ? 'Premium' : option.demographics.budget > 0.3 ? 'Budget' : 'Balanced' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </BakeryCard>
          </div>

          <!-- Step 3: Equipment -->
          <div v-else-if="currentStep === 3" class="grid md:grid-cols-1 gap-4">
            <BakeryCard 
              v-for="tier in EQUIPMENT_TIERS" 
              :key="tier.id"
              :variant="selectedEquipment?.id === tier.id ? 'glass' : 'outlined'"
              hoverable
              padding="lg"
              class="cursor-pointer transition-all border-2"
              :class="selectedEquipment?.id === tier.id ? 'border-bakery-gold-400' : 'border-transparent'"
              @click="selectEquipment(tier)"
            >
              <div class="flex items-start gap-4">
                <div class="text-5xl">{{ tier.icon }}</div>
                <div class="flex-1">
                  <div class="flex justify-between items-start">
                    <h3 class="text-xl font-bold">{{ tier.name }}</h3>
                    <p class="font-bold text-profit text-lg">${{ tier.price.toLocaleString() }}</p>
                  </div>
                  <p class="text-bakery-brown-600 mt-1">{{ tier.description }}</p>
                  
                  <div class="mt-4 grid grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                      <div class="w-full h-2 bg-bakery-brown-100 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-bakery-gold-500 transition-all" 
                          :style="{ width: `${tier.qualityMultiplier * 60}%` }"
                        ></div>
                      </div>
                      <span class="text-xs whitespace-nowrap">Quality: {{ (tier.qualityMultiplier * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-full h-2 bg-bakery-brown-100 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 transition-all" 
                          :style="{ width: `${tier.efficiencyMultiplier * 60}%` }"
                        ></div>
                      </div>
                      <span class="text-xs whitespace-nowrap">Efficiency: {{ (tier.efficiencyMultiplier * 100).toFixed(0) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </BakeryCard>
          </div>
        </Transition>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8">
          <BakeryButton 
            v-if="currentStep > 1"
            variant="ghost" 
            @click="prevStep"
          >
            ← Back
          </BakeryButton>
          <div v-else></div>
          
          <BakeryButton 
            variant="primary" 
            size="lg"
            :disabled="!canProgress"
            @click="nextStep"
          >
            {{ currentStep === totalSteps ? 'Finalize & Open Bakery! 🎉' : 'Next Step →' }}
          </BakeryButton>
        </div>
      </div>

      <!-- Business Preview Dashboard -->
      <div class="space-y-6">
        <BakeryCard variant="glass" padding="lg" class="sticky top-24">
          <h3 class="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Business Plan
          </h3>
          
          <div class="space-y-6">
            <!-- Starting Capital -->
            <div>
              <p class="text-xs uppercase text-bakery-brown-500 mb-1">Starting Cash</p>
              <div class="flex items-end gap-2 text-3xl font-bold" :class="startingCash > 10000 ? 'text-profit' : 'text-danger'">
                ${{ startingCash.toLocaleString() }}
              </div>
              <p class="text-[10px] text-bakery-brown-400 mt-1">
                (Savings + Loans - Initial Costs)
              </p>
            </div>

            <div class="border-t border-bakery-brown-100 pt-4 space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-bakery-brown-600 italic">Financial Strategy:</span>
                <span class="font-bold">{{ selectedFinancing?.name || '---' }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-bakery-brown-600 italic">Prime Location:</span>
                <span class="font-bold">{{ selectedLocation?.name || '---' }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-bakery-brown-600 italic">Equipment Tier:</span>
                <span class="font-bold">{{ selectedEquipment?.name || '---' }}</span>
              </div>
            </div>

            <!-- Projections Radar (Simplified) -->
            <div class="bg-bakery-brown-900/5 rounded-xl p-4 space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-bakery-brown-700">Startup Indicators</h4>
              
              <div class="space-y-3">
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span>Market Visibility</span>
                    <span class="font-bold">{{ (projectedTraffic * 100).toFixed(0) }}%</span>
                  </div>
                  <BakeryProgressBar :value="projectedTraffic * 40" variant="blue" size="sm" />
                </div>
                
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span>Product Quality Ceiling</span>
                    <span class="font-bold">{{ (qualityMultiplier * 100).toFixed(0) }}%</span>
                  </div>
                  <BakeryProgressBar :value="qualityMultiplier * 60" variant="gold" size="sm" />
                </div>
                
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span>Risk Level</span>
                    <span class="font-bold" :class="projectedRent > 300 ? 'text-danger' : 'text-profit'">
                      {{ projectedRent > 400 ? 'High' : projectedRent > 150 ? 'Moderate' : 'Low' }}
                    </span>
                  </div>
                  <BakeryProgressBar :value="(projectedRent / 600) * 100" variant="danger" size="sm" />
                </div>
              </div>
            </div>

            <!-- Simulation Hint -->
            <div class="text-[11px] text-bakery-brown-500 bg-amber-50 rounded-lg p-3 border border-amber-100">
              <strong>💡 Tip:</strong> Starting in <em>Artisan Row</em> with <em>Professional</em> equipment is generally recommended for new entrepreneurs.
            </div>
          </div>
        </BakeryCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.money-positive {
  color: #10b981;
}
.money-negative {
  color: #ef4444;
}

/* Animations */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
