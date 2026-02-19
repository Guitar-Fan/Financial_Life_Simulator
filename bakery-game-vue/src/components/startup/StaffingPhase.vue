<!--
  Phase 7: Staffing
  Player hires from a pool of candidates with varying skills, reliability, and wage demands.
  Includes wage negotiation and labor cost projections.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { STAFF_CANDIDATES } from '@/data/startup-data';
import type { StaffCandidateId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';

const store = useBakeryStartupStore();

const expandedCandidate = ref<StaffCandidateId | null>(null);
const negotiatingId = ref<StaffCandidateId | null>(null);
const negotiatedWage = ref<number>(0);

function getHourlyRate(candidate: typeof STAFF_CANDIDATES[0]): number {
  if (candidate.salaryType === 'hourly') return candidate.requestedSalary;
  return Math.round((candidate.requestedSalary / 2080) * 100) / 100;
}

function isHired(id: StaffCandidateId): boolean {
  return store.staffHires.some(h => h.candidateId === id);
}

function getHire(id: StaffCandidateId) {
  return store.staffHires.find(h => h.candidateId === id);
}

function hire(candidateId: StaffCandidateId) {
  const candidate = STAFF_CANDIDATES.find(c => c.id === candidateId);
  if (!candidate) return;
  const wage = negotiatedWage.value > 0 ? negotiatedWage.value : getHourlyRate(candidate);
  store.hireStaff(candidateId, wage, 30);
  negotiatingId.value = null;
}

function fire(candidateId: StaffCandidateId) {
  store.fireStaff(candidateId);
}

function startNegotiation(candidate: typeof STAFF_CANDIDATES[0]) {
  negotiatingId.value = candidate.id;
  negotiatedWage.value = getHourlyRate(candidate);
}

function personalityLevel(value: number): number {
  return Math.round(value * 5);
}

const totalWeeklyLabor = computed(() => {
  return store.staffHires.reduce((sum, h) => sum + h.agreedWage * h.hoursPerWeek, 0);
});

const monthlyLaborCost = computed(() => totalWeeklyLabor.value * 4.33);

const totalWeeklyHours = computed(() => {
  return store.staffHires.reduce((sum, h) => sum + h.hoursPerWeek, 0);
});

const hasMinimumStaff = computed(() => store.staffHires.length >= 1);

const skillSummary = computed(() => {
  const skills: Record<string, number> = {};
  store.staffHires.forEach(h => {
    const candidate = STAFF_CANDIDATES.find(c => c.id === h.candidateId);
    if (candidate) {
      for (const [trait, value] of Object.entries(candidate.personality)) {
        const level = personalityLevel(value);
        skills[trait] = Math.max(skills[trait] || 0, level);
      }
    }
  });
  return skills;
});

const advisorMessage = computed(() => {
  if (store.staffHires.length === 0) return 'You can\'t run a bakery alone — well, you CAN, but it\'s brutal. Hire at least one helper for the opening. Think about what roles you need most.';
  if (store.staffHires.length === 1) return 'One hire is a start. For opening week, you\'ll want someone handling the front while you bake, or vice versa. Consider a second hire.';
  if (monthlyLaborCost.value > store.cashRemaining * 0.3) return '⚠️ Your labor costs are getting high relative to your remaining cash. Make sure you can sustain this for at least 3 months.';
  return `${store.staffHires.length} staff members costing $${monthlyLaborCost.value.toLocaleString()}/month. Solid team!`;
});
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="mentor" :size="64" :mood="hasMinimumStaff ? 'happy' : 'concerned'" />
      <SpeechBubble :type="monthlyLaborCost > store.cashRemaining * 0.3 ? 'warning' : 'tip'" position="left">
        <p><strong class="text-[var(--game-gold)]">Chef Auguste:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Staff Summary -->
    <div class="game-panel p-4">
      <div class="grid grid-cols-4 gap-4 text-center">
        <div>
          <p class="text-lg font-bold text-[var(--game-info)] font-game-mono">{{ store.staffHires.length }}</p>
          <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Hired</p>
        </div>
        <div>
          <p class="text-lg font-bold text-[#c084fc] font-game-mono">{{ totalWeeklyHours }}<span class="text-xs">hr</span></p>
          <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Weekly Hrs</p>
        </div>
        <div>
          <p class="text-lg font-bold text-[var(--game-gold)] font-game-mono">${{ totalWeeklyLabor.toLocaleString() }}<span class="text-xs">/wk</span></p>
          <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Weekly Labor</p>
        </div>
        <div>
          <p class="text-lg font-bold font-game-mono" :style="{ color: monthlyLaborCost <= store.cashRemaining * 0.2 ? 'var(--game-success)' : 'var(--game-danger)' }">
            ${{ monthlyLaborCost.toLocaleString() }}<span class="text-xs">/mo</span>
          </p>
          <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Monthly</p>
        </div>
      </div>

      <!-- Team Skills -->
      <div v-if="Object.keys(skillSummary).length > 0" class="mt-4 pt-3" style="border-top: 1px solid var(--game-border-dark)">
        <h4 class="text-xs font-bold text-[var(--game-gold)] mb-2 uppercase tracking-wider">Team Skills</h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(level, skill) in skillSummary"
            :key="skill"
            class="game-badge capitalize"
            :class="level >= 4 ? 'game-badge--success' : level >= 3 ? 'game-badge--info' : ''"
          >
            {{ skill }}: {{ level }}/5
          </span>
        </div>
      </div>
    </div>

    <!-- Candidate List -->
    <div class="space-y-3">
      <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">
        <span class="mr-2">👥</span>Available Candidates
      </h3>

      <div class="space-y-3">
        <div
          v-for="candidate in STAFF_CANDIDATES"
          :key="candidate.id"
          class="game-panel overflow-hidden"
          :class="{ 'game-panel--success': isHired(candidate.id) }"
        >
          <div
            class="p-4 flex items-start justify-between cursor-pointer"
            @click="expandedCandidate = expandedCandidate === candidate.id ? null : candidate.id"
          >
            <div class="flex items-start gap-3">
              <!-- Avatar -->
              <div class="w-12 h-12 rounded-md flex items-center justify-center text-xl font-bold flex-shrink-0"
                style="background: linear-gradient(135deg, var(--game-bg-elevated), var(--game-bg-medium)); border: 1px solid var(--game-border-dark); color: var(--game-gold)"
              >
                {{ candidate.name.charAt(0) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ candidate.name }}</h4>
                  <span class="game-badge capitalize">{{ candidate.role.replace(/_/g, ' ') }}</span>
                  <span v-if="isHired(candidate.id)" class="game-badge game-badge--success">HIRED</span>
                </div>
                <p class="text-xs text-[var(--game-text-muted)] mt-0.5">{{ candidate.background }}</p>
                <div class="flex gap-3 mt-1.5 text-[11px] text-[var(--game-text-dim)]">
                  <span>💰 <span class="font-game-mono text-[var(--game-text-muted)]">${{ getHourlyRate(candidate).toFixed(2) }}/hr</span>{{ candidate.salaryType === 'salary' ? ' (salaried)' : '' }}</span>
                  <span>📅 {{ candidate.experience }}yr exp</span>
                  <span>⏰ {{ candidate.availability.length }}d/wk</span>
                </div>
              </div>
            </div>
            <span class="text-[var(--game-text-dim)] text-xs ml-2">{{ expandedCandidate === candidate.id ? '▲' : '▼' }}</span>
          </div>

          <Transition name="expand">
            <div v-if="expandedCandidate === candidate.id" class="px-4 pb-4 space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
              <p class="text-sm text-[var(--game-text-secondary)] italic">"{{ candidate.background }}"</p>

              <!-- Personality -->
              <div>
                <h5 class="text-xs font-bold text-[var(--game-gold)] mb-2 uppercase tracking-wider">Personality Profile</h5>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div v-for="(value, trait) in candidate.personality" :key="trait" class="flex items-center gap-2">
                    <span class="text-[10px] text-[var(--game-text-muted)] capitalize w-20">{{ trait === 'customerService' ? 'service' : trait }}</span>
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--game-bg-darkest)">
                      <div class="h-full rounded-full" style="background: var(--game-gold)" :style="{ width: `${value * 100}%` }" />
                    </div>
                    <span class="text-[10px] font-bold w-6 text-[var(--game-text-secondary)] font-game-mono">{{ personalityLevel(value) }}</span>
                  </div>
                </div>
              </div>

              <!-- Strengths & Weaknesses -->
              <div class="flex flex-wrap gap-2">
                <span v-for="strength in candidate.strengths" :key="strength" class="game-badge game-badge--success">
                  ✓ {{ strength }}
                </span>
                <span v-for="weakness in candidate.weaknesses" :key="weakness" class="game-badge game-badge--danger">
                  ✗ {{ weakness }}
                </span>
              </div>

              <!-- Wage Negotiation -->
              <div v-if="negotiatingId === candidate.id" class="rounded-md p-4 space-y-3" style="background: rgba(245, 158, 11, 0.06); border: 1px solid var(--game-border-dark)">
                <h5 class="text-sm font-bold text-[var(--game-gold)]">💬 Wage Negotiation</h5>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-[var(--game-text-secondary)]">Offer: <strong class="font-game-mono text-[var(--game-text-primary)]">${{ negotiatedWage.toFixed(2) }}/hr</strong></span>
                  <span class="text-[var(--game-text-muted)]">Asking: ${{ getHourlyRate(candidate).toFixed(2) }}/hr</span>
                </div>
                <input
                  type="range"
                  v-model.number="negotiatedWage"
                  :min="getHourlyRate(candidate) * 0.8"
                  :max="getHourlyRate(candidate) * 1.3"
                  :step="0.25"
                  class="game-slider w-full"
                />
                <p class="text-[10px]" :style="{ color: negotiatedWage < getHourlyRate(candidate) * 0.9 ? 'var(--game-danger)' : 'var(--game-success)' }">
                  {{ negotiatedWage < getHourlyRate(candidate) * 0.9 ? '⚠️ Low offer — risk of rejection or low morale' : negotiatedWage > getHourlyRate(candidate) ? '✓ Above asking — will boost loyalty' : '✓ Fair offer' }}
                </p>
                <div class="flex gap-2">
                  <button @click="negotiatingId = null" class="game-btn game-btn--ghost flex-1 py-2">Cancel</button>
                  <button @click="hire(candidate.id)" class="game-btn game-btn--success flex-1 py-2">Hire at ${{ negotiatedWage.toFixed(2) }}/hr</button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div v-else class="flex gap-2">
                <button
                  v-if="!isHired(candidate.id)"
                  @click="startNegotiation(candidate)"
                  class="game-btn game-btn--primary flex-1 py-2.5"
                >
                  Interview & Negotiate
                </button>
                <button
                  v-if="isHired(candidate.id)"
                  @click="fire(candidate.id)"
                  class="game-btn game-btn--danger flex-1 py-2.5"
                >
                  Let Go
                </button>
              </div>

              <!-- Hours for hired staff -->
              <div v-if="isHired(candidate.id)" class="rounded-md p-3" style="background: rgba(96, 165, 250, 0.06); border: 1px solid var(--game-info-dim)">
                <div class="flex justify-between text-xs">
                  <span class="text-[var(--game-text-muted)]">Weekly Hours: <strong class="text-[var(--game-text-primary)] font-game-mono">{{ getHire(candidate.id)?.hoursPerWeek }}hr</strong></span>
                  <span class="text-[var(--game-text-muted)]">Weekly Cost: <strong class="text-[var(--game-text-primary)] font-game-mono">${{ ((getHire(candidate.id)?.agreedWage || 0) * (getHire(candidate.id)?.hoursPerWeek || 0)).toLocaleString() }}</strong></span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(6)" class="game-btn game-btn--ghost">← Suppliers & Menu</button>
      <button
        @click="store.completeCurrentPhase()"
        :disabled="!hasMinimumStaff"
        :class="['game-btn py-3 px-6', hasMinimumStaff ? 'game-btn--primary' : '']"
      >
        {{ hasMinimumStaff ? 'Plan Grand Opening →' : 'Hire at least 1 staff member' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
